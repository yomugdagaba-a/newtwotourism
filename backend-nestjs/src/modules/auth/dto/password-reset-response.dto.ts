export class PasswordResetResponseDto {
  success!: boolean;
  message!: string;
  expiresInMinutes?: number;

  static success(message: string, expiresInMinutes?: number): PasswordResetResponseDto {
    return {
      success: true,
      message,
      expiresInMinutes,
    };
  }

  static error(message: string): PasswordResetResponseDto {
    return {
      success: false,
      message,
    };
  }

  static builder() {
    return new PasswordResetResponseBuilder();
  }
}

class PasswordResetResponseBuilder {
  private dto: PasswordResetResponseDto = { success: false, message: '' };

  success(value: boolean): this {
    this.dto.success = value;
    return this;
  }

  message(value: string): this {
    this.dto.message = value;
    return this;
  }

  expiresInMinutes(value: number): this {
    this.dto.expiresInMinutes = value;
    return this;
  }

  build(): PasswordResetResponseDto {
    return this.dto;
  }
}
