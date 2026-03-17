export class EmailVerificationResponseDto {
  success!: boolean;
  message!: string;
  expiresInMinutes?: number;

  static success(message: string, expiresInMinutes?: number): EmailVerificationResponseDto {
    return {
      success: true,
      message,
      expiresInMinutes,
    };
  }

  static error(message: string): EmailVerificationResponseDto {
    return {
      success: false,
      message,
    };
  }

  static builder() {
    return new EmailVerificationResponseBuilder();
  }
}

class EmailVerificationResponseBuilder {
  private dto: EmailVerificationResponseDto = { success: false, message: '' };

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

  build(): EmailVerificationResponseDto {
    return this.dto;
  }
}
