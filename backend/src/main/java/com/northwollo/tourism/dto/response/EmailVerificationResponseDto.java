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
public class EmailVerificationResponseDto {

    private String message;
    private boolean success;
    private Integer expiresInMinutes; // OTP expiry time

    public static EmailVerificationResponseDto success(String message) {
        return EmailVerificationResponseDto.builder()
                .message(message)
                .success(true)
                .build();
    }

    public static EmailVerificationResponseDto error(String message) {
        return EmailVerificationResponseDto.builder()
                .message(message)
                .success(false)
                .build();
    }
}