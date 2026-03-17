package com.northwollo.tourism.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    private String token;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn; // Access token expiry in seconds
    private Long userId; // User ID for frontend use

    // Backward compatibility constructor
    public AuthResponseDto(String token) {
        this.token = token;
        this.tokenType = "Bearer";
    }

    // Full constructor with userId
    public AuthResponseDto(String token, String refreshToken, long expiresIn, Long userId) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
        this.expiresIn = expiresIn;
        this.userId = userId;
    }
    
    // Constructor without userId (backward compatibility)
    public AuthResponseDto(String token, String refreshToken, long expiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
        this.expiresIn = expiresIn;
    }
}
