import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    // Using environment variables for configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587'),
      secure: (process.env.SMTP_SECURE === 'true' || process.env.MAIL_PORT === '465'), // true for 465, false for other ports
      auth: (process.env.SMTP_USER || process.env.MAIL_USER)
        ? {
            user: process.env.SMTP_USER || process.env.MAIL_USER,
            pass: process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD,
          }
        : undefined,
    });
  }

  private getFromEmail(): string {
    return process.env.SMTP_FROM || process.env.MAIL_FROM || 'noreply@tourism.com';
  }

  async sendPasswordResetOtp(
    email: string,
    otp: string,
    expiryMinutes: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Use the following OTP to proceed:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in ${expiryMinutes} minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset OTP sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP to ${email}:`, error);
      return false;
    }
  }

  async sendEmailVerificationOtp(
    email: string,
    otp: string,
    expiryMinutes: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Email Verification OTP',
        html: `
          <h2>Email Verification</h2>
          <p>Welcome! Please verify your email address using the following OTP:</p>
          <h1 style="color: #28a745; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in ${expiryMinutes} minutes.</p>
          <p>If you didn't create this account, please ignore this email.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email verification OTP sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email verification OTP to ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Welcome to Tourism Platform',
        html: `
          <h2>Welcome, ${fullName}!</h2>
          <p>Thank you for registering with our tourism platform.</p>
          <p>You can now explore amazing tourism destinations and book hotels.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  async sendBookingAcceptedNotification(
    email: string,
    hotelName: string,
    bookingId: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Booking Request Accepted',
        html: `
          <h2>Booking Request Accepted</h2>
          <p>Great news! Your booking request for <strong>${hotelName}</strong> has been accepted by the hotel owner.</p>
          <p><strong>Booking ID:</strong> #${bookingId}</p>
          <p>The hotel owner will soon propose a cost for your booking. Please check your account for updates.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking accepted notification sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send booking accepted notification to ${email}:`, error);
      return false;
    }
  }

  async sendCostProposedNotification(
    email: string,
    hotelName: string,
    cost: number,
    bookingId: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Cost Proposed for Your Booking',
        html: `
          <h2>Cost Proposed</h2>
          <p>The hotel owner for <strong>${hotelName}</strong> has proposed a cost for your booking.</p>
          <p><strong>Booking ID:</strong> #${bookingId}</p>
          <p><strong>Proposed Cost:</strong> ${cost} ETB</p>
          <p>Please upload your payment receipt to proceed with the booking.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Cost proposed notification sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send cost proposed notification to ${email}:`, error);
      return false;
    }
  }

  async sendReceiptUploadedNotification(
    email: string,
    hotelName: string,
    bookingId: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Payment Receipt Received',
        html: `
          <h2>Payment Receipt Received</h2>
          <p>The guest has uploaded a payment receipt for their booking at <strong>${hotelName}</strong>.</p>
          <p><strong>Booking ID:</strong> #${bookingId}</p>
          <p>Please review the receipt and approve the booking if everything is correct.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Receipt uploaded notification sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send receipt uploaded notification to ${email}:`, error);
      return false;
    }
  }

  async sendBookingApprovedNotification(
    email: string,
    hotelName: string,
    bookingId: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Booking Approved',
        html: `
          <h2>Booking Approved</h2>
          <p>Congratulations! Your booking at <strong>${hotelName}</strong> has been approved.</p>
          <p><strong>Booking ID:</strong> #${bookingId}</p>
          <p>Your reservation is confirmed. We look forward to your visit!</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking approved notification sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send booking approved notification to ${email}:`, error);
      return false;
    }
  }

  async sendBookingRejectedNotification(
    email: string,
    hotelName: string,
    reason: string,
    bookingId: number,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject: 'Booking Rejected',
        html: `
          <h2>Booking Rejected</h2>
          <p>Unfortunately, your booking at <strong>${hotelName}</strong> has been rejected.</p>
          <p><strong>Booking ID:</strong> #${bookingId}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please feel free to contact the hotel owner for more information or try booking again.</p>
          <hr>
          <p><small>This is an automated email. Please do not reply.</small></p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking rejected notification sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send booking rejected notification to ${email}:`, error);
      return false;
    }
  }

  async sendEmail(
    email: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.getFromEmail(),
        to: email,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${email} with subject: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      return false;
    }
  }
}
