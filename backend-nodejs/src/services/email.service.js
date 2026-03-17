const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'localhost',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_PORT === '465',
  auth: (process.env.MAIL_USER) ? {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  } : undefined,
});

const FROM = process.env.MAIL_FROM || 'noreply@tourism.com';

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
  return sendEmail(email, 'Booking Request Accepted', `
    <h2>Booking Request Accepted</h2>
    <p>Your booking at <strong>${hotelName}</strong> has been accepted.</p>
    <p><strong>Booking ID:</strong> #${bookingId}</p>
  `);
}

async function sendCostProposedNotification(email, hotelName, cost, bookingId) {
  return sendEmail(email, 'Cost Proposed for Your Booking', `
    <h2>Cost Proposed</h2>
    <p>Hotel <strong>${hotelName}</strong> proposed a cost for booking #${bookingId}.</p>
    <p><strong>Cost:</strong> ${cost} ETB</p>
    <p>Please upload your payment receipt to proceed.</p>
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
