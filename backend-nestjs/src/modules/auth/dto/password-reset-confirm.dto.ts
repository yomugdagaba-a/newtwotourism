import { IsNotEmpty, IsString, MinLength, IsEmail, IsOptional } from 'class-validator';

export class PasswordResetConfirmDto {
  @IsNotEmpty()
  @IsString()
  token!: string; // 6-digit OTP

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
