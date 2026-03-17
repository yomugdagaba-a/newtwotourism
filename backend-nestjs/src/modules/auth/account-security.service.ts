import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AccountSecurityService {
  private readonly logger = new Logger(AccountSecurityService.name);

  private readonly maxFailedAttempts = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5');
  private readonly lockoutDurationMinutes = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15');
  private readonly maxIpAttemptsPerHour = parseInt(process.env.MAX_IP_ATTEMPTS_PER_HOUR || '100');
  private readonly progressiveDelayEnabled = true;
  private readonly suspiciousActivityThreshold = 3;
  private readonly securityAlertsEnabled = true;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Record a login attempt
   */
  async recordLoginAttempt(
    username: string,
    successful: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: number,
    failureReason?: string,
  ): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          userId: userId || null,
          ipAddress,
          success: successful,
          reason: failureReason,
        },
      });

      if (!successful) {
        this.logger.warn(
          `Failed login attempt for ${username} from IP ${ipAddress} - Reason: ${failureReason}`,
        );

        // Check if account should be locked
        if (userId) {
          await this.checkAndLockAccount(userId, username, ipAddress);
        }
      } else {
        this.logger.debug(`Successful login for ${username} from IP ${ipAddress}`);
      }
    } catch (error) {
      this.logger.error('Failed to record login attempt:', error);
    }
  }

  /**
   * Check if an identifier should be blocked due to failed attempts
   */
  async shouldBlockIdentifier(username: string, ipAddress: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check consecutive failed attempts
    const consecutiveFailures = await this.prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (consecutiveFailures >= this.maxFailedAttempts) {
      this.logger.warn(
        `Identifier ${username} blocked due to ${consecutiveFailures} consecutive failed attempts`,
      );
      return true;
    }

    return false;
  }

  /**
   * Check if an IP address should be blocked
   */
  async shouldBlockIpAddress(ipAddress: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentAttempts = await this.prisma.loginAttempt.count({
      where: {
        ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentAttempts >= this.maxIpAttemptsPerHour) {
      this.logger.warn(
        `IP address ${ipAddress} blocked due to ${recentAttempts} attempts in the last hour`,
      );
      return true;
    }

    return false;
  }

  /**
   * Get progressive delay in seconds
   */
  async getProgressiveDelay(username: string, ipAddress: string): Promise<number> {
    if (!this.progressiveDelayEnabled) {
      return 0;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentFailures = await this.prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: oneHourAgo },
      },
    });

    // Progressive delay: 1s, 2s, 4s, 8s, 16s, 30s (max)
    if (recentFailures <= 1) return 0;
    if (recentFailures === 2) return 1;
    if (recentFailures === 3) return 2;
    if (recentFailures === 4) return 4;
    if (recentFailures === 5) return 8;
    if (recentFailures === 6) return 16;
    return 30;
  }

  /**
   * Lock a user account
   */
  async lockUserAccount(
    userId: number,
    reason: string,
    triggerIpAddress: string,
  ): Promise<void> {
    try {
      // Check if already locked
      const existingLockout = await this.prisma.accountLockout.findUnique({
        where: { userId },
      });

      if (existingLockout && existingLockout.lockedUntil > new Date()) {
        this.logger.log(`User ${userId} is already locked out`);
        return;
      }

      const lockedUntil = new Date(Date.now() + this.lockoutDurationMinutes * 60 * 1000);

      await this.prisma.accountLockout.upsert({
        where: { userId },
        create: {
          userId,
          lockedUntil,
        },
        update: {
          lockedUntil,
        },
      });

      this.logger.warn(
        `User ${userId} locked out until ${lockedUntil} - Reason: ${reason} - Triggered by IP: ${triggerIpAddress}`,
      );

      // Send security alert
      if (this.securityAlertsEnabled) {
        await this.sendSecurityAlert(userId, 'ACCOUNT_LOCKED', triggerIpAddress);
      }
    } catch (error) {
      this.logger.error('Failed to lock user account:', error);
    }
  }

  /**
   * Check if user is locked out
   */
  async isUserLockedOut(userId: number): Promise<boolean> {
    try {
      const lockout = await this.prisma.accountLockout.findUnique({
        where: { userId },
      });

      if (!lockout) {
        return false;
      }

      if (lockout.lockedUntil > new Date()) {
        return true;
      }

      // Lockout expired, delete it
      await this.prisma.accountLockout.delete({
        where: { userId },
      });

      return false;
    } catch (error) {
      this.logger.error('Failed to check lockout status:', error);
      return false;
    }
  }

  /**
   * Unlock a user account (admin action)
   */
  async unlockUserAccount(userId: number): Promise<void> {
    try {
      await this.prisma.accountLockout.delete({
        where: { userId },
      });

      this.logger.log(`User ${userId} manually unlocked by admin`);

      // Send security alert
      if (this.securityAlertsEnabled) {
        await this.sendSecurityAlert(userId, 'ACCOUNT_UNLOCKED', 'ADMIN');
      }
    } catch (error) {
      this.logger.error('Failed to unlock user account:', error);
    }
  }

  /**
   * Detect suspicious activity
   */
  async detectSuspiciousActivity(username: string, ipAddress: string): Promise<boolean> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Check for multiple IP addresses used by same user
      const distinctIps = await this.prisma.loginAttempt.findMany({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
        select: { ipAddress: true },
        distinct: ['ipAddress'],
      });

      if (distinctIps.length >= this.suspiciousActivityThreshold) {
        this.logger.warn(
          `Suspicious activity detected for ${username}: ${distinctIps.length} different IP addresses in 24 hours`,
        );
        return true;
      }

      // Check for rapid-fire attempts
      const recentAttempts = await this.prisma.loginAttempt.count({
        where: {
          ipAddress,
          success: false,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (recentAttempts >= 5) {
        this.logger.warn(
          `Suspicious activity detected for ${username}: ${recentAttempts} attempts in 5 minutes`,
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(userId: number, alertType: string, ipAddress: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.email) {
        return;
      }

      const message = this.buildSecurityAlertMessage(alertType, ipAddress);
      await this.emailService.sendEmail(
        user.email,
        'Security Alert - Account Activity',
        message,
      );

      this.logger.log(`Security alert sent to user ${userId}: ${alertType}`);
    } catch (error) {
      this.logger.error('Failed to send security alert:', error);
    }
  }

  /**
   * Cleanup old security records
   */
  async cleanupOldSecurityRecords(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Delete old login attempts
      const deletedAttempts = await this.prisma.loginAttempt.deleteMany({
        where: {
          createdAt: { lt: cutoffTime },
        },
      });

      this.logger.log(
        `Security cleanup completed: ${deletedAttempts.count} login attempts deleted`,
      );

      return deletedAttempts.count;
    } catch (error) {
      this.logger.error('Failed to cleanup old security records:', error);
      return 0;
    }
  }

  /**
   * Private helper: Check and lock account if needed
   */
  private async checkAndLockAccount(
    userId: number,
    username: string,
    ipAddress: string,
  ): Promise<void> {
    try {
      // Don't lock if already locked
      if (await this.isUserLockedOut(userId)) {
        return;
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const consecutiveFailures = await this.prisma.loginAttempt.count({
        where: {
          userId,
          success: false,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (consecutiveFailures >= this.maxFailedAttempts) {
        const reason = `Account locked due to ${consecutiveFailures} consecutive failed login attempts`;
        await this.lockUserAccount(userId, reason, ipAddress);
      }
    } catch (error) {
      this.logger.error('Failed to check and lock account:', error);
    }
  }

  /**
   * Build security alert message
   */
  private buildSecurityAlertMessage(alertType: string, ipAddress: string): string {
    switch (alertType) {
      case 'ACCOUNT_LOCKED':
        return `Your account has been temporarily locked due to multiple failed login attempts from IP: ${ipAddress}. It will be automatically unlocked in ${this.lockoutDurationMinutes} minutes. If this wasn't you, please contact support immediately.`;
      case 'ACCOUNT_UNLOCKED':
        return 'Your account has been unlocked by an administrator.';
      case 'SUSPICIOUS_ACTIVITY':
        return `Suspicious login activity detected on your account from IP: ${ipAddress}. If this wasn't you, please change your password immediately.`;
      default:
        return `Security alert: ${alertType} from IP: ${ipAddress}`;
    }
  }
}
