import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { EmailVerificationRequestDto } from './dto/email-verification-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Request() req: any) {
    await this.authService.logout(req.user.userId);
    return { message: 'Logged out successfully' };
  }

  // ==================== PASSWORD RESET ENDPOINTS ====================

  @Post('reset-password')
  @ApiOperation({ summary: 'Initiate password reset process' })
  async initiatePasswordReset(
    @Body() request: PasswordResetRequestDto,
    @Request() req: any,
  ) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    return this.passwordResetService.initiatePasswordReset(
      request,
      ipAddress,
      userAgent,
    );
  }

  @Post('reset-password/confirm')
  @ApiOperation({ summary: 'Confirm password reset with OTP' })
  async confirmPasswordReset(
    @Body() request: PasswordResetConfirmDto,
    @Request() req: any,
  ) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    return this.passwordResetService.confirmPasswordReset(
      request,
      ipAddress,
      userAgent,
    );
  }

  @Get('reset-password/validate')
  @ApiOperation({ summary: 'Validate reset token' })
  async validateResetToken(@Query('token') token: string) {
    const isValid = await this.passwordResetService.isValidResetToken(token);
    if (isValid) {
      return { success: true, message: 'Token is valid' };
    } else {
      return { success: false, message: 'Invalid or expired token' };
    }
  }

  // ==================== EMAIL VERIFICATION ENDPOINTS ====================

  @Post('send-verification')
  @ApiOperation({ summary: 'Send email verification OTP' })
  async sendVerificationEmail(
    @Body() request: EmailVerificationRequestDto,
    @Request() req: any,
  ) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    return this.emailVerificationService.sendVerificationEmail(
      request,
      ipAddress,
      userAgent,
    );
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  async verifyEmail(
    @Query('token') token: string,
    @Request() req: any,
  ) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    return this.emailVerificationService.verifyEmail(token, ipAddress, userAgent);
  }

  @Post('verify-email-otp')
  @ApiOperation({ summary: 'Verify email with email and OTP' })
  async verifyEmailWithOtp(
    @Query('email') email: string,
    @Query('otp') otp: string,
    @Request() req: any,
  ) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    return this.emailVerificationService.verifyEmailWithEmail(
      email,
      otp,
      ipAddress,
      userAgent,
    );
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification OTP' })
  async resendVerificationEmail(
    @Query('userId') userId: string,
    @Request() req: any,
  ) {
    const ipAddress = this.getClientIpAddress(req);
    const userAgent = req.get('user-agent') || '';
    const userIdNum = parseInt(userId, 10);
    return this.emailVerificationService.resendVerificationEmail(
      userIdNum,
      ipAddress,
      userAgent,
    );
  }

  @Get('verify-email/validate')
  @ApiOperation({ summary: 'Validate email verification OTP' })
  async validateVerificationToken(@Query('token') token: string) {
    const isValid = await this.emailVerificationService.isValidVerificationToken(token);
    if (isValid) {
      return { success: true, message: 'OTP is valid' };
    } else {
      return { success: false, message: 'Invalid or expired OTP' };
    }
  }

  @Get('email-verified')
  @ApiOperation({ summary: 'Check if email is verified' })
  async checkEmailVerified(@Query('email') email: string) {
    const isVerified = await this.emailVerificationService.isEmailVerified(email);
    if (isVerified) {
      return { success: true, message: 'Email is verified' };
    } else {
      return { success: false, message: 'Email is not verified' };
    }
  }

  // ==================== HELPER METHODS ====================

  private getClientIpAddress(req: any): string {
    const xForwardedFor = req.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = req.get('x-real-ip');
    if (xRealIp) {
      return xRealIp;
    }

    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}
