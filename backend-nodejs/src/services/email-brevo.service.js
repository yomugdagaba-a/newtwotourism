const SibApiV3Sdk = require('sib-api-v3-sdk');

class EmailBrevoService {
  constructor() {
    this.client = null;
    this.apiInstance = null;
    this._initializeClient();
  }

  _initializeClient() {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('❌ BREVO_API_KEY not set — emails will not be sent');
      console.error('   Get your API key from: https://app.brevo.com/settings/keys/api');
      return;
    }

    try {
      this.client = SibApiV3Sdk.ApiClient.instance;
      this.client.authentications['api-key'].apiKey = apiKey;
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      console.log('✅ Brevo email service initialized successfully');
      console.log(`📧 Sender: ${process.env.BREVO_SENDER_EMAIL || 'not set'}`);
    } catch (error) {
      console.error('❌ Failed to initialize Brevo:', error.message);
    }
  }

  _getSenderInfo() {
    return {
      email: process.env.BREVO_SENDER_EMAIL || process.env.GMAIL_USER || 'noreply@example.com',
      name: process.env.BREVO_SENDER_NAME || 'North Wollo Tourism',
    };
  }

  async sendEmail(to, subject, html) {
    if (!this.apiInstance) {
      console.error(`❌ Email not sent to ${to}: Brevo API not configured`);
      return false;
    }

    console.log(`📧 Sending email via Brevo to=${to} subject="${subject}"`);
    
    try {
      const sender = this._getSenderInfo();
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.sender = { name: sender.name, email: sender.email };
      sendSmtpEmail.to = [{ email: to }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Email sent via Brevo to ${to}: ${result.messageId}`);
      return true;
    } catch (err) {
      console.error(`❌ Brevo error for ${to}:`, err.message);
      if (err.response) {
        console.error('Brevo API response:', err.response.text);
      }
      return false;
    }
  }

  async sendPasswordResetOtp(email, otp, expiryMinutes) {
    return this.sendEmail(email, 'Password Reset OTP — North Wollo Tourism', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">Password Reset Request</h2>
        <p style="color:#374151;">Use the following OTP to reset your password:</p>
        <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <span style="color:#1d4ed8;font-size:36px;font-weight:900;letter-spacing:10px;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px;">Expires in <strong>${expiryMinutes} minutes</strong>. If you didn't request this, ignore this email.</p>
      </div>
    `);
  }

  async sendEmailVerificationOtp(email, otp, expiryMinutes, fullName = '') {
    const greeting = fullName ? `Welcome, ${fullName}!` : 'Welcome!';
    return this.sendEmail(email, 'Verify Your Email — North Wollo Tourism', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;margin-bottom:8px;">${greeting}</h2>
        <p style="color:#374151;margin-bottom:16px;">Thank you for joining <strong>North Wollo Tourism</strong>.</p>
        <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:20px 0;border-radius:4px;">
          <h3 style="color:#059669;margin:0 0 8px 0;font-size:16px;">📧 Email Verification Required</h3>
          <p style="color:#374151;margin:0;">Please verify your email address using the code below:</p>
        </div>
        <div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <span style="color:#1d4ed8;font-size:36px;font-weight:900;letter-spacing:10px;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px;margin-bottom:8px;">⏱️ This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
        <p style="color:#6b7280;font-size:13px;margin:0;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `);
  }

  async sendBookingAcceptedNotification(email, hotelName, bookingId) {
    const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-ten.vercel.app';
    return this.sendEmail(email, `Booking #${bookingId} Accepted — ${hotelName}`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;">Your Booking Request Was Accepted</h2>
        <p>Great news! <strong>${hotelName}</strong> has accepted your booking request.</p>
        <p><strong>Booking ID:</strong> #${bookingId}</p>
        <a href="${appUrl}/bookings" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View My Bookings</a>
      </div>
    `);
  }

  async sendCostProposedNotification(email, hotelName, cost, bookingId) {
    const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-ten.vercel.app';
    return this.sendEmail(email, `Cost Proposed for Booking #${bookingId} — ${hotelName}`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#7c3aed;">Cost Proposed for Your Booking</h2>
        <p>Hotel <strong>${hotelName}</strong> has proposed a cost for your booking.</p>
        <table style="border-collapse:collapse;margin:16px 0;width:100%;">
          <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb;">Booking ID</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;">#${bookingId}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;">Proposed Cost</td><td style="padding:8px 12px;font-weight:900;font-size:20px;color:#7c3aed;">${cost} ETB</td></tr>
        </table>
        <a href="${appUrl}/bookings" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View My Bookings & Upload Receipt</a>
      </div>
    `);
  }

  async sendReceiptUploadedNotification(email, hotelName, bookingId) {
    return this.sendEmail(email, `Payment Receipt Received — Booking #${bookingId}`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;">Payment Receipt Received</h2>
        <p>A receipt was uploaded for booking <strong>#${bookingId}</strong> at <strong>${hotelName}</strong>.</p>
        <p>Please review and approve the booking.</p>
      </div>
    `);
  }

  async sendBookingApprovedNotification(email, hotelName, bookingId) {
    return this.sendEmail(email, `Booking #${bookingId} Approved — ${hotelName}`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#15803d;">Booking Approved ✓</h2>
        <p>Your booking at <strong>${hotelName}</strong> (ID: #${bookingId}) has been approved.</p>
        <p style="color:#6b7280;">Enjoy your stay!</p>
      </div>
    `);
  }

  async sendBookingRejectedNotification(email, hotelName, reason, bookingId) {
    return this.sendEmail(email, `Booking #${bookingId} Rejected — ${hotelName}`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#dc2626;">Booking Rejected</h2>
        <p>Your booking at <strong>${hotelName}</strong> (ID: #${bookingId}) was rejected.</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
    `);
  }

  async sendWelcomeEmail(email, fullName) {
    return this.sendEmail(email, 'Welcome to North Wollo Tourism!', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#1d4ed8;">Welcome, ${fullName}!</h2>
        <p>Thank you for joining North Wollo Tourism.</p>
        <p>You can now explore amazing tourism destinations and book hotels across North Wollo.</p>
      </div>
    `);
  }
}

module.exports = new EmailBrevoService();
