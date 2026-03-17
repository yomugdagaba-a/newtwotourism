import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AccountSecurityService } from './account-security.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    EmailModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '5m',
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, PasswordResetService, EmailVerificationService, AccountSecurityService],
  controllers: [AuthController],
  exports: [AuthService, PasswordResetService, EmailVerificationService, AccountSecurityService],
})
export class AuthModule {}
