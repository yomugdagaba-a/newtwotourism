const nodemailer = require('nodemailer');

// Create transporter lazily so env vars are always read at send time, not at module load
function createTransporter() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587');
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    console.warn('⚠️  Email service: SMTP credentials not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD missing)');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      // Allow self-signed certs and avoid TLS errors on some SMTP servers
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000, // 10s — don't hang forever
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

const FROM = () => process.env.SMTP_FROM || process.env.MAIL_FROM || 'noreply@northwollotourism.com';

async function sendEmail(to, subject, html) {
  const transporter = createTransporter();

  if (!transporter) {
    console.error(`❌ Email not sent to ${to}: SMTP not configured`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: FROM(),
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}: ${err.message}`);
    // Log full error in development for easier debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error(err);
    }
    return false;
  }
}

async function sendPasswordResetOtp(email, otp, expiryMinutes) {
  return sendEmail(email, 'Password Reset OTP — North Wollo Tourism', `
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

async function sendEmailVerificationOtp(email, otp, expiryMinutes) {
  return sendEmail(email, 'Verify Your Email — North Wollo Tourism', `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#059669;margin-bottom:8px;">Email Verification</h2>
      <p style="color:#374151;">Please verify your email address using the code below:</p>
      <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
        <span style="color:#15803d;font-size:36px;font-weight:900;letter-spacing:10px;">${otp}</span>
      </div>
      <p style="color:#6b7280;font-size:14px;">Expires in <strong>${expiryMinutes} minutes</strong>.</p>
      <p style="color:#6b7280;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `);
}

async function sendBookingAcceptedNotification(email, hotelName, bookingId) {
  const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-sand.vercel.app';
  return sendEmail(email, `Booking #${bookingId} Accepted — ${hotelName}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1d4ed8;">Your Booking Request Was Accepted</h2>
      <p>Great news! <strong>${hotelName}</strong> has accepted your booking request.</p>
      <p><strong>Booking ID:</strong> #${bookingId}</p>
      <p style="color:#6b7280;">The hotel will now propose a cost. You will receive another email once the cost is ready.</p>
      <a href="${appUrl}/bookings" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View My Bookings</a>
    </div>
  `);
}

async function sendCostProposedNotification(email, hotelName, cost, bookingId) {
  const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-sand.vercel.app';
  return sendEmail(email, `Cost Proposed for Booking #${bookingId} — ${hotelName}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#7c3aed;">Cost Proposed for Your Booking</h2>
      <p>Hotel <strong>${hotelName}</strong> has proposed a cost for your booking.</p>
      <table style="border-collapse:collapse;margin:16px 0;width:100%;">
        <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb;">Booking ID</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;">#${bookingId}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb;">Hotel</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;">${hotelName}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;">Proposed Cost</td><td style="padding:8px 12px;font-weight:900;font-size:20px;color:#7c3aed;">${cost} ETB</td></tr>
      </table>
      <p>To proceed, please upload your payment receipt:</p>
      <a href="${appUrl}/bookings" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">View My Bookings & Upload Receipt</a>
    </div>
  `);
}

async function sendReceiptUploadedNotification(email, hotelName, bookingId) {
  return sendEmail(email, `Payment Receipt Received — Booking #${bookingId}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1d4ed8;">Payment Receipt Received</h2>
      <p>A receipt was uploaded for booking <strong>#${bookingId}</strong> at <strong>${hotelName}</strong>.</p>
      <p>Please review and approve the booking.</p>
    </div>
  `);
}

async function sendBookingApprovedNotification(email, hotelName, bookingId) {
  return sendEmail(email, `Booking #${bookingId} Approved — ${hotelName}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#15803d;">Booking Approved ✓</h2>
      <p>Your booking at <strong>${hotelName}</strong> (ID: #${bookingId}) has been approved.</p>
      <p style="color:#6b7280;">Enjoy your stay!</p>
    </div>
  `);
}

async function sendBookingRejectedNotification(email, hotelName, reason, bookingId) {
  return sendEmail(email, `Booking #${bookingId} Rejected — ${hotelName}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#dc2626;">Booking Rejected</h2>
      <p>Your booking at <strong>${hotelName}</strong> (ID: #${bookingId}) was rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>
  `);
}

async function sendWelcomeEmail(email, fullName) {
  return sendEmail(email, 'Welcome to North Wollo Tourism!', `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1d4ed8;">Welcome, ${fullName}!</h2>
      <p>Thank you for joining North Wollo Tourism.</p>
      <p>You can now explore amazing tourism destinations and book hotels across North Wollo.</p>
    </div>
  `);
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
};
