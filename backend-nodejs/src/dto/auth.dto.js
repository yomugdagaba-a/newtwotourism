/** Auth DTOs — validation schemas for auth endpoints */

class AuthDto {
  static get RegisterDto() {
    return {
      username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
      email: { required: true, isEmail: true },
      password: { required: true, type: 'string', minLength: 8 },
      fullName: { required: true, type: 'string', minLength: 2 },
    };
  }

  static get LoginDto() {
    return {
      username: { required: true, type: 'string' },
      password: { required: true, type: 'string', minLength: 8 },
    };
  }

  static get RefreshTokenDto() {
    return {
      refreshToken: { required: true, type: 'string' },
    };
  }

  static get PasswordResetRequestDto() {
    return {
      email: { required: true, isEmail: true },
    };
  }

  static get PasswordResetConfirmDto() {
    return {
      token: { required: true, type: 'string' },
      newPassword: { required: true, type: 'string', minLength: 8 },
      email: { isEmail: true }, // optional
    };
  }

  static get EmailVerificationRequestDto() {
    return {
      email: { required: true, isEmail: true },
    };
  }
}

// Export both class and individual DTOs for backward compatibility
module.exports = {
  AuthDto,
  RegisterDto: AuthDto.RegisterDto,
  LoginDto: AuthDto.LoginDto,
  RefreshTokenDto: AuthDto.RefreshTokenDto,
  PasswordResetRequestDto: AuthDto.PasswordResetRequestDto,
  PasswordResetConfirmDto: AuthDto.PasswordResetConfirmDto,
  EmailVerificationRequestDto: AuthDto.EmailVerificationRequestDto,
};
