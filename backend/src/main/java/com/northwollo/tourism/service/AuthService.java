package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.LoginRequestDto;
import com.northwollo.tourism.dto.request.UserRegisterDto;
import com.northwollo.tourism.dto.response.AuthResponseDto;

public interface AuthService {

    AuthResponseDto login(LoginRequestDto dto);

    /**
     * Login with refresh token generation
     * @param dto Login request data
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     * @return Authentication response with access and refresh tokens
     */
    AuthResponseDto login(LoginRequestDto dto, String ipAddress, String userAgent);

    void register(UserRegisterDto dto);

    /**
     * Register user with email verification
     * @param dto User registration data
     * @param ipAddress Client IP address for security tracking
     * @param userAgent Client user agent for security tracking
     */
    void register(UserRegisterDto dto, String ipAddress, String userAgent);
}
