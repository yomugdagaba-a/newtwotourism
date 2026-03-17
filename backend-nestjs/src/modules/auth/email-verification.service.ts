import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailVerificationRequestDto } from './dto/email-verification-request.dto';
import { EmailVerificationResponseDto } from './dto/email-verification-response.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class EmailVerificationService {
  private readonly OTP_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS_PER_OTP = 3;
  private readonly MAX_OTPS_PER_EMAIL_PER_HOUR = 3;
  private readonly MAX_OTPS_PER_IP_PER_HOUR = 5;
  private readonly COOLDOWN_SECONDS = 60;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendVerificationEmail(
    request: EmailVerificationRequestDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<EmailVerificationResponseDto> {
    const email = request.email.toLowerCase().trim();

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return EmailVerificationResponseDto.error('Email address not found.');
    }

    // Check if user is active
    if (!user.active) {
      return EmailVerificationResponseDto.error(
        'Account is inactive. Please contact support.',
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return EmailVerificationResponseDto.success('Email is already verified.');
    }

    // Check cooldown
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const secondsSinceLastRequest = Math.floor(
        (Date.now() - lastToken.createdAt.getTime()) / 1000,
      );
      if (secondsSinceLastRequest < this.COOLDOWN_SECONDS) {
        const waitTime = this.COOLDOWN_SECONDS - secondsSinceLastRequest;
        return EmailVerificationResponseDto.error(
          `Please wait ${waitTime} seconds before requesting another OTP.`,
        );
      }
    }

    // Check rate limits
    if (!(await this.checkRateLimits(email, ipAddress))) {
      return EmailVerificationResponseDto.error(
        'Too many verification requests. Please try again in 1 hour.',
      );
    }

    // Invalidate existing unverified OTPs
    await this.prisma.emailVerificationToken.updateMany({
      where: { email, verified: false },
      data: { verified: true },
    });

    // Generate OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create token
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: otp,
        email,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Send email
    try {
      await this.emailService.sendEmailVerificationOtp(email, otp, this.OTP_EXPIRY_MINUTES);
    } catch (error) {
      return EmailVerificationResponseDto.error(
        'Failed to send verification OTP. Please try again.',
      );
    }

    return EmailVerificationResponseDto.builder()
      .success(true)
      .message(
        `A 6-digit OTP has been sent to your email. It expires in ${this.OTP_EXPIRY_MINUTES} minutes.`,
      )
      .expiresInMinutes(this.OTP_EXPIRY_MINUTES)
      .build();
  }

  async verifyEmail(
    otp: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<EmailVerificationResponseDto> {
    // Validate OTP format
    if (!this.isValidOtpFormat(otp)) {
      return EmailVerificationResponseDto.error(
        'Invalid OTP format. Please enter a 6-digit code.',
      );
    }

    // Find token
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token: otp.trim() },
      include: { user: true },
    });

    if (!verificationToken) {
      return EmailVerificationResponseDto.error('Invalid or expired OTP.');
    }

    // Check if token is valid (not verified and not expired)
    if (verificationToken.verified || verificationToken.expiresAt < new Date()) {
      return EmailVerificationResponseDto.error(
        'OTP has expired. Please request a new one.',
      );
    }

    // Check attempt count
    if (verificationToken.attemptCount >= this.MAX_ATTEMPTS_PER_OTP) {
      await this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { verified: true },
      });
      return EmailVerificationResponseDto.error(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Increment attempt count
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { attemptCount: verificationToken.attemptCount + 1 },
    });

    // Update user email verification status
    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Mark token as verified
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { verified: true },
    });

    // Mark all other tokens for this email as verified
    if (verificationToken.email) {
      await this.prisma.emailVerificationToken.updateMany({
        where: { email: verificationToken.email, id: { not: verificationToken.id } },
        data: { verified: true },
      });
    }

    return EmailVerificationResponseDto.success(
      'Email has been verified successfully!',
    );
  }

  async verifyEmailWithEmail(
    email: string,
    otp: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<EmailVerificationResponseDto> {
    // Validate OTP format
    if (!this.isValidOtpFormat(otp)) {
      return EmailVerificationResponseDto.error(
        'Invalid OTP format. Please enter a 6-digit code.',
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find token for this specific email
    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: { token: otp.trim(), email: normalizedEmail },
      include: { user: true },
    });

    if (!verificationToken) {
      return EmailVerificationResponseDto.error('Invalid or expired OTP.');
    }

    // Check if token is valid (not verified and not expired)
    if (verificationToken.verified || verificationToken.expiresAt < new Date()) {
      return EmailVerificationResponseDto.error(
        'OTP has expired. Please request a new one.',
      );
    }

    // Check attempt count
    if (verificationToken.attemptCount >= this.MAX_ATTEMPTS_PER_OTP) {
      await this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { verified: true },
      });
      return EmailVerificationResponseDto.error(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Increment attempt count
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { attemptCount: verificationToken.attemptCount + 1 },
    });

    // Update user email verification status
    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Mark token as verified
    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { verified: true },
    });

    return EmailVerificationResponseDto.success(
      'Email has been verified successfully!',
    );
  }

  async resendVerificationEmail(
    userId: number,
    ipAddress: string,
    userAgent: string,
  ): Promise<EmailVerificationResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return EmailVerificationResponseDto.error('User not found.');
    }

    // Check if user is active
    if (!user.active) {
      return EmailVerificationResponseDto.error(
        'Account is inactive. Please contact support.',
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return EmailVerificationResponseDto.success('Email is already verified.');
    }

    // Delegate to sendVerificationEmail
    const request = new EmailVerificationRequestDto();
    request.email = user.email || '';
    return this.sendVerificationEmail(request, ipAddress, userAgent);
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    return user?.emailVerified ?? false;
  }

  async isUserEmailVerified(userId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return user?.emailVerified ?? false;
  }

  async isValidVerificationToken(token: string): Promise<boolean> {
    if (!this.isValidOtpFormat(token)) {
      return false;
    }

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return false;
    }

    return !verificationToken.verified && verificationToken.expiresAt > new Date();
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  private async checkRateLimits(email: string, ipAddress: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check email-based rate limit
    const emailOtpCount = await this.prisma.emailVerificationToken.count({
      where: {
        email,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (emailOtpCount >= this.MAX_OTPS_PER_EMAIL_PER_HOUR) {
      return false;
    }

    // Check IP-based rate limit
    const ipOtpCount = await this.prisma.emailVerificationToken.count({
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
