package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttempt extends BaseEntity {

    @NotBlank
    @Column(nullable = false, length = 100)
    private String identifier; // username, email, or IP address

    @NotNull
    @Column(nullable = false)
    private LocalDateTime attemptTime;

    @Column(nullable = false)
    private boolean successful = false;

    @NotBlank
    @Column(nullable = false, length = 45)
    private String ipAddress;

    @Column(length = 500)
    private String userAgent;

    @Column(length = 100)
    private String failureReason;

    @Column
    private Long userId; // null if user not found

    @Column(length = 20)
    private String attemptType; // LOGIN, PASSWORD_RESET, EMAIL_VERIFICATION

    // Convenience constructor for login attempts
    public LoginAttempt(String identifier, boolean successful, String ipAddress, String userAgent) {
        this.identifier = identifier;
        this.attemptTime = LocalDateTime.now();
        this.successful = successful;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.attemptType = "LOGIN";
    }

    // Constructor with failure reason
    public LoginAttempt(String identifier, String failureReason, String ipAddress, String userAgent) {
        this.identifier = identifier;
        this.attemptTime = LocalDateTime.now();
        this.successful = false;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.failureReason = failureReason;
        this.attemptType = "LOGIN";
    }
}