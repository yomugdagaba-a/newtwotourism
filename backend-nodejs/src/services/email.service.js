const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || process.env.MAIL_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587'),
  secure: (process.env.SMTP_PORT || process.env.MAIL_PORT) === '465',
  auth: (process.env.SMTP_USER || process.env.MAIL_USER) ? {
    user: process.env.SMTP_USER || process.env.MAIL_USER,
    pass: process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD,
  } : undefined,
});

const FROM = process.env.SMTP_FROM || process.env.MAIL_FROM || 'noreply@tourism.com';

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    return false;
  }
}

async function sendPasswordResetOtp(email, otp, expiryMinutes) {
  return sendEmail(email, 'Password Reset OTP', `
    <h2>Password Reset Request</h2>
    <p>Use the following OTP to reset your password:</p>
    <h1 style="color:#007bff;font-size:32px;letter-spacing:5px;">${otp}</h1>
    <p>Expires in ${expiryMinutes} minutes. If you didn't request this, ignore this email.</p>
  `);
}

async function sendEmailVerificationOtp(email, otp, expiryMinutes) {
  return sendEmail(email, 'Email Verification OTP', `
    <h2>Email Verification</h2>
    <p>Please verify your email using the following OTP:</p>
    <h1 style="color:#28a745;font-size:32px;letter-spacing:5px;">${otp}</h1>
    <p>Expires in ${expiryMinutes} minutes.</p>
  `);
}

async function sendBookingAcceptedNotification(email, hotelName, bookingId) {
  const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-sand.vercel.app';
  return sendEmail(email, `Booking #${bookingId} Accepted — ${hotelName}`, `
    <h2>Your Booking Request Was Accepted</h2>
    <p>Great news! <strong>${hotelName}</strong> has accepted your booking request.</p>
    <p><strong>Booking ID:</strong> #${bookingId}</p>
    <p>The hotel will now propose a cost. You will receive another email once the cost is ready for you to review and pay.</p>
    <a href="${appUrl}/bookings" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View My Bookings</a>
  `);
}

async function sendCostProposedNotification(email, hotelName, cost, bookingId) {
  const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-sand.vercel.app';
  return sendEmail(email, `Cost Proposed for Booking #${bookingId} — ${hotelName}`, `
    <h2>Cost Proposed for Your Booking</h2>
    <p>Hotel <strong>${hotelName}</strong> has proposed a cost for your booking.</p>
    <table style="border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 12px;font-weight:bold;color:#6b7280;">Booking ID</td><td style="padding:6px 12px;font-weight:bold;">#${bookingId}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#6b7280;">Hotel</td><td style="padding:6px 12px;font-weight:bold;">${hotelName}</td></tr>
      <tr><td style="padding:6px 12px;font-weight:bold;color:#6b7280;">Proposed Cost</td><td style="padding:6px 12px;font-weight:900;font-size:18px;color:#7c3aed;">${cost} ETB</td></tr>
    </table>
    <p>To proceed, please upload your payment receipt:</p>
    <a href="${appUrl}/bookings" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View My Bookings & Upload Receipt</a>
    <p style="margin-top:16px;color:#6b7280;font-size:13px;">If you did not make this booking, please ignore this email.</p>
  `);
}

async function sendReceiptUploadedNotification(email, hotelName, bookingId) {
  return sendEmail(email, 'Payment Receipt Received', `
    <h2>Payment Receipt Received</h2>
    <p>A receipt was uploaded for booking #${bookingId} at <strong>${hotelName}</strong>.</p>
    <p>Please review and approve the booking.</p>
  `);
}

async function sendBookingApprovedNotification(email, hotelName, bookingId) {
  return sendEmail(email, 'Booking Approved', `
    <h2>Booking Approved</h2>
    <p>Your booking at <strong>${hotelName}</strong> (ID: #${bookingId}) has been approved.</p>
  `);
}

async function sendBookingRejectedNotification(email, hotelName, reason, bookingId) {
  return sendEmail(email, 'Booking Rejected', `
    <h2>Booking Rejected</h2>
    <p>Your booking at <strong>${hotelName}</strong> (ID: #${bookingId}) was rejected.</p>
    <p><strong>Reason:</strong> ${reason}</p>
  `);
}

async function sendWelcomeEmail(email, fullName) {
  return sendEmail(email, 'Welcome to Tourism Platform', `
    <h2>Welcome, ${fullName}!</h2>
    <p>Thank you for registering with our tourism platform.</p>
    <p>You can now explore amazing tourism destinations and book hotels.</p>
  `);
}

function buildSecurityAlertMessage(alertType, ipAddress, lockoutMinutes = 15) {
  switch (alertType) {
    case 'ACCOUNT_LOCKED':
      return `Your account has been temporarily locked due to multiple failed login attempts from IP: ${ipAddress}. It will unlock in ${lockoutMinutes} minutes.`;
    case 'ACCOUNT_UNLOCKED':
      return 'Your account has been unlocked by an administrator.';
    default:
      return `Security alert: ${alertType} from IP: ${ipAddress}`;
  }
}

module.exports = {
  sendEmail,
  sendPasswordResetOtp,
  sendEmailVerificationOtp,
  sendWelcomeEmail,
  sendBookingAcceptedNotification,
  sendCostProposedNotification,
  sendReceiptUploadedNotification,
  sendBookingApprovedNotification,
  sendBookingRejectedNotification,
  buildSecurityAlertMessage,
};
