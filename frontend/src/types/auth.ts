// frontend/src/types/auth.ts

export interface LoginRequestDto {
  username: string;
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  expiresAt?: string;
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    roles: string[];
  };
}

export interface ResetPasswordRequestDto {
  email: string;
}
