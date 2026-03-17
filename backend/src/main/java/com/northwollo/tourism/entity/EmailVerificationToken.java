package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationToken extends BaseEntity {

    @NotBlank
    @Column(nullable = false, length = 6)
    private String token; // 6-digit OTP

    @NotNull
    @Column(nullable = false)
    private Long userId;

    @NotBlank
    @Email
    @Column(nullable = false, length = 255)
    private String email;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(nullable = false)
    private int attemptCount = 0; // Track failed verification attempts

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    // Convenience constructor for creating new tokens
    public EmailVerificationToken(String token, Long userId, String email, LocalDateTime expiresAt) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.expiresAt = expiresAt;
        this.verified = false;
        this.attemptCount = 0;
    }

    // Helper methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public boolean isValid() {
        return !verified && !isExpired();
    }

    public void markAsVerified() {
        this.verified = true;
    }

    public void incrementAttemptCount() {
        this.attemptCount++;
    }
}