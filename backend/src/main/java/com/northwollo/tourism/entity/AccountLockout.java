package com.northwollo.tourism.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "account_lockouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AccountLockout extends BaseEntity {

    @NotNull
    @Column(nullable = false)
    private Long userId;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime lockedAt;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime unlockAt;

    @Column(length = 200)
    private String reason;

    @Column(nullable = false)
    private int lockoutCount = 1; // Number of times this user has been locked out

    @Column(nullable = false)
    private boolean active = true; // Whether this lockout is currently active

    @Column(length = 45)
    private String triggerIpAddress; // IP that triggered the lockout

    @Column(length = 100)
    private String lockoutType; // FAILED_LOGIN, SUSPICIOUS_ACTIVITY, MANUAL

    // Convenience constructor
    public AccountLockout(Long userId, LocalDateTime unlockAt, String reason, String triggerIpAddress) {
        this.userId = userId;
        this.lockedAt = LocalDateTime.now();
        this.unlockAt = unlockAt;
        this.reason = reason;
        this.triggerIpAddress = triggerIpAddress;
        this.lockoutType = "FAILED_LOGIN";
        this.active = true;
    }

    // Helper methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.unlockAt);
    }

    public boolean isActive() {
        return this.active && !isExpired();
    }

    public void deactivate() {
        this.active = false;
    }

    public long getRemainingLockoutMinutes() {
        if (!isActive()) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(unlockAt)) {
            return 0;
        }
        return java.time.Duration.between(now, unlockAt).toMinutes();
    }
}