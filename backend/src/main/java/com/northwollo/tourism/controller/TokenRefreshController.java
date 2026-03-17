package com.northwollo.tourism.controller;

import com.northwollo.tourism.dto.request.TokenRefreshRequestDto;
import com.northwollo.tourism.dto.response.TokenPairResponseDto;
import com.northwollo.tourism.service.TokenRefreshService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class TokenRefreshController {

    private final TokenRefreshService tokenRefreshService;

    /**
     * Refresh access token using refresh token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<TokenPairResponseDto> refreshToken(
            @Valid @RequestBody TokenRefreshRequestDto request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Token refresh requested from IP: {}", ipAddress);
        
        TokenPairResponseDto response = tokenRefreshService.refreshToken(request, ipAddress, userAgent);
        return ResponseEntity.ok(response);
    }

    /**
     * Revoke refresh token (logout)
     */
    @PostMapping("/revoke-token")
    public ResponseEntity<Map<String, String>> revokeToken(
            @Valid @RequestBody TokenRefreshRequestDto request) {
        
        boolean revoked = tokenRefreshService.revokeRefreshToken(request.getRefreshToken());
        
        Map<String, String> response = new HashMap<>();
        if (revoked) {
            response.put("message", "Token revoked successfully");
        } else {
            response.put("message", "Token not found or already revoked");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     */
    @PostMapping("/revoke-all-tokens")
    public ResponseEntity<Map<String, String>> revokeAllTokens(@RequestParam Long userId) {
        int revokedCount = tokenRefreshService.revokeAllUserTokens(userId);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", String.format("Revoked %d tokens successfully", revokedCount));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Validate refresh token
     */
    @GetMapping("/validate-refresh-token")
    public ResponseEntity<Map<String, Object>> validateRefreshToken(@RequestParam String token) {
        boolean isValid = tokenRefreshService.isValidRefreshToken(token);
        Long userId = tokenRefreshService.getUserIdFromRefreshToken(token);
        
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        if (isValid && userId != null) {
            response.put("userId", userId);
        }
        
        return ResponseEntity.ok(response);
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