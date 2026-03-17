package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.PasswordResetConfirmDto;
import com.northwollo.tourism.dto.request.PasswordResetRequestDto;
import com.northwollo.tourism.dto.response.PasswordResetResponseDto;
import com.northwollo.tourism.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /**
     * Initiate password reset process
     */
    @PostMapping("/reset-password")
    public ResponseEntity<PasswordResetResponseDto> initiatePasswordReset(
            @Valid @RequestBody PasswordResetRequestDto request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Password reset requested for email: {} from IP: {}", request.getEmail(), ipAddress);
        
        PasswordResetResponseDto response = passwordResetService.initiatePasswordReset(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm password reset with token
     */
    @PostMapping("/reset-password/confirm")
    public ResponseEntity<PasswordResetResponseDto> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmDto request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Password reset confirmation attempted from IP: {}", ipAddress);
        
        PasswordResetResponseDto response = passwordResetService.confirmPasswordReset(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Validate reset token (for frontend validation)
     */
    @GetMapping("/reset-password/validate")
    public ResponseEntity<PasswordResetResponseDto> validateResetToken(@RequestParam String token) {
        boolean isValid = passwordResetService.isValidResetToken(token);
        
        if (isValid) {
            return ResponseEntity.ok(PasswordResetResponseDto.success("Token is valid"));
        } else {
            return ResponseEntity.ok(PasswordResetResponseDto.error("Invalid or expired token"));
        }
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in case of multiple proxies
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}