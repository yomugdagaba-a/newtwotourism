package com.northwollo.tourism.service;

import com.northwollo.tourism.dto.request.PasswordResetConfirmDto;
import com.northwollo.tourism.dto.request.PasswordResetRequestDto;
import com.northwollo.tourism.dto.response.PasswordResetResponseDto;
import com.northwollo.tourism.entity.PasswordResetToken;
import com.northwollo.tourism.entity.User;
import com.northwollo.tourism.repository.PasswordResetTokenRepository;
import com.northwollo.tourism.repository.UserRepository;
import com.northwollo.tourism.service.impl.PasswordResetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private User testUser;
    private PasswordResetToken testToken;

    @BeforeEach
    void setUp() {
        // Set up configuration values
        ReflectionTestUtils.setField(passwordResetService, "tokenExpiryHours", 1);
        ReflectionTestUtils.setField(passwordResetService, "maxTokensPerUser", 3);
        ReflectionTestUtils.setField(passwordResetService, "maxTokensPerIpPerHour", 5);
        ReflectionTestUtils.setField(passwordResetService, "frontendBaseUrl", "http://localhost:3000");

        // Create test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");
        testUser.setActive(true);

        // Create test token
        testToken = new PasswordResetToken();
        testToken.setId(1L);
        testToken.setToken("test-token-123");
        testToken.setUserId(1L);
        testToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        testToken.setUsed(false);
    }

    @Test
    void testInitiatePasswordReset_Success() {
        // Arrange
        PasswordResetRequestDto request = new PasswordResetRequestDto("test@example.com");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.countValidTokensByUserId(eq(1L), any(LocalDateTime.class))).thenReturn(0L);
        when(passwordResetTokenRepository.countTokensByIpAddressSince(eq(ipAddress), any(LocalDateTime.class))).thenReturn(0L);
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        when(emailService.sendPasswordResetEmail(eq("test@example.com"), anyString())).thenReturn(true);

        // Act
        PasswordResetResponseDto response = passwordResetService.initiatePasswordReset(request, ipAddress, userAgent);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("If the email exists, a reset link has been sent.", response.getMessage());
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), anyString());
    }

    @Test
    void testInitiatePasswordReset_UserNotFound() {
        // Arrange
        PasswordResetRequestDto request = new PasswordResetRequestDto("nonexistent@example.com");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act
        PasswordResetResponseDto response = passwordResetService.initiatePasswordReset(request, ipAddress, userAgent);

        // Assert
        assertTrue(response.isSuccess()); // Should still return success for security
        assertEquals("If the email exists, a reset link has been sent.", response.getMessage());
        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    void testInitiatePasswordReset_InactiveUser() {
        // Arrange
        testUser.setActive(false);
        PasswordResetRequestDto request = new PasswordResetRequestDto("test@example.com");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act
        PasswordResetResponseDto response = passwordResetService.initiatePasswordReset(request, ipAddress, userAgent);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Account is inactive. Please contact support.", response.getMessage());
    }

    @Test
    void testInitiatePasswordReset_RateLimitExceeded() {
        // Arrange
        PasswordResetRequestDto request = new PasswordResetRequestDto("test@example.com");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.countValidTokensByUserId(eq(1L), any(LocalDateTime.class))).thenReturn(5L); // Exceeds limit

        // Act
        PasswordResetResponseDto response = passwordResetService.initiatePasswordReset(request, ipAddress, userAgent);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Too many reset requests. Please try again later.", response.getMessage());
    }

    @Test
    void testConfirmPasswordReset_Success() {
        // Arrange
        PasswordResetConfirmDto request = new PasswordResetConfirmDto("test@example.com", "test-token-123", "newPassword123");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(passwordResetTokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("newPassword123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);

        // Act
        PasswordResetResponseDto response = passwordResetService.confirmPasswordReset(request, ipAddress, userAgent);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("Password has been reset successfully.", response.getMessage());
        verify(passwordEncoder).encode("newPassword123");
        verify(userRepository).save(testUser);
        verify(passwordResetTokenRepository).markAllTokensAsUsedByUserId(1L);
        assertTrue(testToken.isUsed());
    }

    @Test
    void testConfirmPasswordReset_InvalidToken() {
        // Arrange
        PasswordResetConfirmDto request = new PasswordResetConfirmDto("test@example.com", "invalid-token", "newPassword123");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(passwordResetTokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        // Act
        PasswordResetResponseDto response = passwordResetService.confirmPasswordReset(request, ipAddress, userAgent);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid or expired reset token.", response.getMessage());
    }

    @Test
    void testConfirmPasswordReset_ExpiredToken() {
        // Arrange
        testToken.setExpiresAt(LocalDateTime.now().minusHours(1)); // Expired
        PasswordResetConfirmDto request = new PasswordResetConfirmDto("test@example.com", "test-token-123", "newPassword123");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(passwordResetTokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // Act
        PasswordResetResponseDto response = passwordResetService.confirmPasswordReset(request, ipAddress, userAgent);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid or expired reset token.", response.getMessage());
    }

    @Test
    void testConfirmPasswordReset_UsedToken() {
        // Arrange
        testToken.setUsed(true); // Already used
        PasswordResetConfirmDto request = new PasswordResetConfirmDto("test@example.com", "test-token-123", "newPassword123");
        String ipAddress = "192.168.1.1";
        String userAgent = "Test Browser";

        when(passwordResetTokenRepository.findByToken("test-token-123")).thenReturn(Optional.of(testToken));

        // Act
        PasswordResetResponseDto response = passwordResetService.confirmPasswordReset(request, ipAddress, userAgent);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Invalid or expired reset token.", response.getMessage());
    }

    @Test
    void testIsValidResetToken() {
        // Arrange
        when(passwordResetTokenRepository.existsValidToken(eq("valid-token"), any(LocalDateTime.class))).thenReturn(true);
        when(passwordResetTokenRepository.existsValidToken(eq("invalid-token"), any(LocalDateTime.class))).thenReturn(false);

        // Act & Assert
        assertTrue(passwordResetService.isValidResetToken("valid-token"));
        assertFalse(passwordResetService.isValidResetToken("invalid-token"));
    }

    @Test
    void testCleanupExpiredTokens() {
        // Arrange
        when(passwordResetTokenRepository.deleteExpiredTokens(any(LocalDateTime.class))).thenReturn(5);

        // Act
        int deletedCount = passwordResetService.cleanupExpiredTokens();

        // Assert
        assertEquals(5, deletedCount);
        verify(passwordResetTokenRepository).deleteExpiredTokens(any(LocalDateTime.class));
    }
}