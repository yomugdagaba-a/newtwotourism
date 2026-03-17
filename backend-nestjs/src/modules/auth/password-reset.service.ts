import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetResponseDto } from './dto/password-reset-response.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class PasswordResetService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS_PER_OTP = 3;
  private readonly MAX_OTPS_PER_USER_PER_HOUR = 3;
  private readonly MAX_OTPS_PER_IP_PER_HOUR = 5;
  private readonly COOLDOWN_SECONDS = 60;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async initiatePasswordReset(
    request: PasswordResetRequestDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PasswordResetResponseDto> {
    const email = request.email.toLowerCase().trim();

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists - security best practice
      return PasswordResetResponseDto.success(
        'If the email exists, a 6-digit OTP has been sent.',
      );
    }

    // Check if user is active
    if (!user.active) {
      return PasswordResetResponseDto.error(
        'Account is inactive. Please contact support.',
      );
    }

    // Check cooldown
    const lastToken = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const secondsSinceLastRequest = Math.floor(
        (Date.now() - lastToken.createdAt.getTime()) / 1000,
      );
      if (secondsSinceLastRequest < this.COOLDOWN_SECONDS) {
        const waitTime = this.COOLDOWN_SECONDS - secondsSinceLastRequest;
        return PasswordResetResponseDto.error(
          `Please wait ${waitTime} seconds before requesting another OTP.`,
        );
      }
    }

    // Check rate limits
    if (!(await this.checkRateLimits(user.id, ipAddress))) {
      return PasswordResetResponseDto.error(
        'Too many reset requests. Please try again in 1 hour.',
      );
    }

    // Invalidate existing unused OTPs
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: otp,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Send email
    try {
      await this.emailService.sendPasswordResetOtp(email, otp, this.OTP_EXPIRY_MINUTES);
    } catch (error) {
      return PasswordResetResponseDto.error(
        'Failed to send OTP. Please try again.',
      );
    }

    return PasswordResetResponseDto.builder()
      .success(true)
      .message(
        `A 6-digit OTP has been sent to your email. It expires in ${this.OTP_EXPIRY_MINUTES} minutes.`,
      )
      .expiresInMinutes(this.OTP_EXPIRY_MINUTES)
      .build();
  }

  async confirmPasswordReset(
    request: PasswordResetConfirmDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<PasswordResetResponseDto> {
    const otp = request.token.trim();
    const newPassword = request.newPassword;
    const email = request.email ? request.email.toLowerCase().trim() : null;

    // Validate OTP format
    if (!this.isValidOtpFormat(otp)) {
      return PasswordResetResponseDto.error(
        'Invalid OTP format. Please enter a 6-digit code.',
      );
    }

    // Find token
    let resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: otp },
      include: { user: true },
    });

    if (!resetToken) {
      return PasswordResetResponseDto.error('Invalid or expired OTP.');
    }

    // If email provided, verify it matches
    if (email && resetToken.user.email !== email) {
      return PasswordResetResponseDto.error('Invalid or expired OTP.');
    }

    // Check if token is valid (not used and not expired)
    if (resetToken.used || resetToken.expiresAt < new Date()) {
      return PasswordResetResponseDto.error(
        'OTP has expired. Please request a new one.',
      );
    }

    // Check attempt count
    if (resetToken.attemptCount >= this.MAX_ATTEMPTS_PER_OTP) {
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
      return PasswordResetResponseDto.error(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Increment attempt count
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { attemptCount: resetToken.attemptCount + 1 },
    });

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return PasswordResetResponseDto.success(
      'Password has been reset successfully. You can now log in.',
    );
  }

  async isValidResetToken(token: string): Promise<boolean> {
    if (!this.isValidOtpFormat(token)) {
      return false;
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return false;
    }

    return !resetToken.used && resetToken.expiresAt > new Date();
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  private async checkRateLimits(userId: number, ipAddress: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check user-based rate limit
    const userOtpCount = await this.prisma.passwordResetToken.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (userOtpCount >= this.MAX_OTPS_PER_USER_PER_HOUR) {
      return false;
    }

    // Check IP-based rate limit
    const ipOtpCount = await this.prisma.passwordResetToken.count({
      where: {
        ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (ipOtpCount >= this.MAX_OTPS_PER_IP_PER_HOUR) {
      return false;
    }

    return true;
  }

  private generateOtp(): string {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

  private isValidOtpFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}
