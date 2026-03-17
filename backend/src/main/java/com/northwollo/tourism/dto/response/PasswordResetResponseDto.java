package com.northwollo.tourism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetResponseDto {

    private String message;
    private boolean success;
    private Integer expiresInMinutes; // OTP expiry time

    public static PasswordResetResponseDto success(String message) {
        return PasswordResetResponseDto.builder()
                .message(message)
                .success(true)
                .build();
    }

    public static PasswordResetResponseDto error(String message) {
        return PasswordResetResponseDto.builder()
                .message(message)
                .success(false)
                .build();
    }
}