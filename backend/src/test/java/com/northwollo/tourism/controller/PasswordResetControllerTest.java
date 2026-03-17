package com.northwollo.tourism.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northwollo.tourism.dto.request.PasswordResetConfirmDto;
import com.northwollo.tourism.dto.request.PasswordResetRequestDto;
import com.northwollo.tourism.dto.response.PasswordResetResponseDto;
import com.northwollo.tourism.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PasswordResetController.class)
class PasswordResetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PasswordResetService passwordResetService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testInitiatePasswordReset_Success() throws Exception {
        // Arrange
        PasswordResetRequestDto request = new PasswordResetRequestDto("test@example.com");
        PasswordResetResponseDto response = PasswordResetResponseDto.success("Reset link sent");

        when(passwordResetService.initiatePasswordReset(any(PasswordResetRequestDto.class), anyString(), anyString()))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Reset link sent"));
    }

    @Test
    void testInitiatePasswordReset_InvalidEmail() throws Exception {
        // Arrange
        PasswordResetRequestDto request = new PasswordResetRequestDto("invalid-email");

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest()); // Validation should fail
    }

    @Test
    void testConfirmPasswordReset_Success() throws Exception {
        // Arrange
        PasswordResetConfirmDto request = new PasswordResetConfirmDto("test@example.com", "123456", "newPassword123");
        PasswordResetResponseDto response = PasswordResetResponseDto.success("Password reset successfully");

        when(passwordResetService.confirmPasswordReset(any(PasswordResetConfirmDto.class), anyString(), anyString()))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password reset successfully"));
    }

    @Test
    void testConfirmPasswordReset_InvalidToken() throws Exception {
        // Arrange
        PasswordResetConfirmDto request = new PasswordResetConfirmDto("test@example.com", "000000", "newPassword123");
        PasswordResetResponseDto response = PasswordResetResponseDto.error("Invalid token");

        when(passwordResetService.confirmPasswordReset(any(PasswordResetConfirmDto.class), anyString(), anyString()))
                .thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid token"));
    }

    @Test
    void testValidateResetToken_ValidToken() throws Exception {
        // Arrange
        when(passwordResetService.isValidResetToken("valid-token")).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/auth/reset-password/validate")
                .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Token is valid"));
    }

    @Test
    void testValidateResetToken_InvalidToken() throws Exception {
        // Arrange
        when(passwordResetService.isValidResetToken("invalid-token")).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/auth/reset-password/validate")
                .param("token", "invalid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }
}