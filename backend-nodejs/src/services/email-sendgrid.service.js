/**
 * Email service using SendGrid API
 * Works on Render free tier (uses HTTP API instead of SMTP)
 * Free tier: 100 emails/day
 * Get API key: https://app.sendgrid.com/settings/api_keys
 */

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'North Wollo Tourism';

/**
 * Send email via SendGrid API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(to, subject, html) {
  // Skip if no API key configured
  if (!apiKey) {
    console.warn('⚠️  SENDGRID_API_KEY not set — email not sent');
    return false;
  }

  // In test environment, redirect to test email if configured
  const testEmailOverride = process.env.TEST_EMAIL_OVERRIDE;
  if (process.env.NODE_ENV === 'test' && testEmailOverride) {
    to = testEmailOverride;
  }

  try {
    console.log(`📧 Sending email to=${to} subject="${subject}"`);

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      html,
    };

    const response = await sgMail.send(msg);
    
    console.log(`✅ Email sent via SendGrid to ${to}: ${response[0].statusCode}`);
    return true;
  } catch (err) {
    console.error(`❌ SendGrid error for ${to}:`, err.message);
    if (err.response) {
      console.error('SendGrid response:', err.response.body);
    }
    return false;
  }
}

/**
 * Send verification email with OTP
 */
async function sendVerificationEmail(to, otp, username) {
  const subject = 'Verify Your Email — North Wollo Tourism';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to North Wollo Tourism!</h2>
      <p>Hi ${username || 'there'},</p>
      <p>Thank you for registering. Please verify your email address using the code below:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1f2937; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">North Wollo Tourism System</p>
    </div>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(to, fullName) {
  const subject = 'Welcome to North Wollo Tourism!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome, ${fullName}!</h2>
      <p>Your account has been successfully verified.</p>
      <p>You can now explore tourism places, book hotels, and discover the beauty of North Wollo.</p>
      <p>Thank you for joining us!</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">North Wollo Tourism System</p>
    </div>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Send password reset email with OTP
 */
async function sendPasswordResetEmail(to, otp) {
  const subject = 'Password Reset OTP — North Wollo Tourism';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>You requested to reset your password. Use the code below:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1f2937; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">North Wollo Tourism System</p>
    </div>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Send booking notification to client
 */
async function sendBookingNotification(to, bookingId, hotelName, status, message) {
  const subject = `Booking #${bookingId} ${status} — ${hotelName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Update</h2>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Hotel:</strong> ${hotelName}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p>${message}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">North Wollo Tourism System</p>
    </div>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Send account status notification
 */
async function sendAccountStatusEmail(to, status, reason = '') {
  const subjects = {
    deactivated: 'Account Deactivated — North Wollo Tourism',
    reactivated: 'Account Reactivated — North Wollo Tourism',
    locked: 'Account Temporarily Locked — North Wollo Tourism',
    unlocked: 'Account Unlocked — North Wollo Tourism',
  };

  const messages = {
    deactivated: `Your account has been deactivated. ${reason}`,
    reactivated: 'Your account has been reactivated. You can now log in.',
    locked: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.',
    unlocked: 'Your account has been unlocked. You can now log in.',
  };

  const subject = subjects[status] || 'Account Status Update';
  const message = messages[status] || reason;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Account Status Update</h2>
      <p>${message}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">North Wollo Tourism System</p>
    </div>
  `;
  return sendEmail(to, subject, html);
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingNotification,
  sendAccountStatusEmail,
};
