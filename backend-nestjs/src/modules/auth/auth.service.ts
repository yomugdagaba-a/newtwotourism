import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AccountSecurityService } from './account-security.service';
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EmailVerificationRequestDto } from './dto/email-verification-request.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private accountSecurityService: AccountSecurityService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, fullName } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with CLIENT role
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        roles: {
          connect: { name: 'CLIENT' },
        },
      },
      include: { roles: true },
    });

    // Auto-send verification email after registration
    try {
      const emailVerificationRequest = new EmailVerificationRequestDto();
      emailVerificationRequest.email = email;
      await this.emailVerificationService.sendVerificationEmail(
        emailVerificationRequest,
        'registration',
        'registration-flow',
      );
    } catch (error) {
      console.error('Failed to send verification email after registration:', error);
      // Don't fail registration if email sending fails
    }

    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto, ipAddress: string = 'unknown', userAgent: string = 'unknown') {
    const { username, password } = loginDto;

    // Check if user is locked out
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { roles: true },
    });

    if (user && (await this.accountSecurityService.isUserLockedOut(user.id))) {
      await this.accountSecurityService.recordLoginAttempt(
        username,
        false,
        ipAddress,
        userAgent,
        user.id,
        'Account is locked due to multiple failed attempts',
      );
      throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
    }

    // Check if IP should be blocked
    if (await this.accountSecurityService.shouldBlockIpAddress(ipAddress)) {
      throw new UnauthorizedException('Too many login attempts from this IP address. Please try again later.');
    }

    // Check if identifier should be blocked
    if (await this.accountSecurityService.shouldBlockIdentifier(username, ipAddress)) {
      throw new UnauthorizedException('Too many failed login attempts. Please try again later.');
    }

    // Get progressive delay
    const delay = await this.accountSecurityService.getProgressiveDelay(username, ipAddress);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    if (!user) {
      await this.accountSecurityService.recordLoginAttempt(
        username,
        false,
        ipAddress,
        userAgent,
        undefined,
        'User not found',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.accountSecurityService.recordLoginAttempt(
        username,
        false,
        ipAddress,
        userAgent,
        user.id,
        'Invalid password',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      await this.accountSecurityService.recordLoginAttempt(
        username,
        false,
        ipAddress,
        userAgent,
        user.id,
        'User account is inactive',
      );
      throw new UnauthorizedException('User account is inactive');
    }

    // Record successful login
    await this.accountSecurityService.recordLoginAttempt(
      username,
      true,
      ipAddress,
      userAgent,
      user.id,
    );

    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        include: { roles: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    // Invalidate refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.username,
      userId: user.id,
      roles: user.roles.map((r: any) => `ROLE_${r.name}`),
    };

    const expiresIn = process.env.JWT_EXPIRATION || '5m';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn,
    });

    // Add random jti (JWT ID) to make each refresh token unique
    const refreshPayload = {
      ...payload,
      jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    // Store refresh token (delete old ones first to avoid unique constraint issues)
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Calculate expiration time in seconds
    const expirationSeconds = this.parseExpirationTime(expiresIn);

    return {
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: expirationSeconds,
      expiresAt: new Date(Date.now() + expirationSeconds * 1000).toISOString(),
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((r: any) => r.name),
      },
    };
  }

  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 300; // default 5 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 300;
    }
  }
}
