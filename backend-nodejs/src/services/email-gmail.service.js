// ============================================
// GMAIL SMTP EMAIL SERVICE (Using Nodemailer)
// ============================================
// Free, reliable, works with any Gmail account
// Uses Gmail App Password (not your regular password)
// ============================================

const nodemailer = require('nodemailer');

function getGmailTransporter() {
  const email = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  
  if (!email || !password) {
    console.warn('⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — emails will not be sent');
    return null;
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password
    }
  });
  
  return transporter;
}

function getSenderInfo() {
  return {
    email: process.env.GMAIL_USER || 'noreply@example.com',
    name: process.env.GMAIL_SENDER_NAME || 'North Wollo Tourism'
  };
}

async function sendEmail(to, subject, html) {
  const transporter = getGmailTransporter();
  if (!transporter) {
    console.error(`❌ Email not sent to ${to}: Gmail credentials not configured`);
    return false;
  }
  
  console.log(`📧 Sending email to=${to} subject="${subject}"`);
  
  try {
    const sender = getSenderInfo();
    
    const mailOptions = {
      from: `"${sender.name}" <${sender.email}>`,
      to: to,
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent via Gmail to ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Gmail error for ${to}:`, err.message);
    return false;
  }
}

// All email template functions
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
  const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-ten.vercel.app';
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
  const appUrl = process.env.FRONTEND_URL || 'https://tourism-system-ten.vercel.app';
  return sendEmail(email, `Cost Proposed for Booking #${bookingId} — ${hotelName}`, `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#7c3aed;">Cost Proposed for Your Booking</h2>
      <p>Hotel <strong>${hotelName}</strong> has proposed a cost for your booking.</p>
      <table style="border-collapse:collapse;margin:16px 0;width:100%;">
        <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb;">Booking ID</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;">#${bookingId}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;border-bottom:1px solid #e5e7eb;">Hotel</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #e5e7eb;">${hotelName}</td></tr>
        <tr><td style="padding:8px 12px;font-weight:bold;color:#6b7280;">Proposed Cost</td><td style="padding:8px 12px;font-weight:900;font-size:20px;color:#7c3aed;">${cost} ETB</td></tr>
      </table>
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
