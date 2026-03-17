/** Auth DTOs — validation schemas for auth endpoints */

const RegisterDto = {
  username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
  email: { required: true, isEmail: true },
  password: { required: true, type: 'string', minLength: 8 },
  fullName: { required: true, type: 'string', minLength: 2 },
};

const LoginDto = {
  username: { required: true, type: 'string' },
  password: { required: true, type: 'string', minLength: 8 },
};

const RefreshTokenDto = {
  refreshToken: { required: true, type: 'string' },
};

const PasswordResetRequestDto = {
  email: { required: true, isEmail: true },
};

const PasswordResetConfirmDto = {
  token: { required: true, type: 'string' },
  newPassword: { required: true, type: 'string', minLength: 8 },
  email: { isEmail: true }, // optional
};

const EmailVerificationRequestDto = {
  email: { required: true, isEmail: true },
};

module.exports = {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  EmailVerificationRequestDto,
};
