/**
 * Smart Email Service Selector
 * 
 * Automatically selects the best email service based on environment:
 * - Brevo (recommended for Render and production) if BREVO_API_KEY is set
 * - Gmail SMTP (fallback) if GMAIL_USER and GMAIL_APP_PASSWORD are set
 * 
 * Usage: Just require this file instead of email-gmail.service
 */

const brevoService = require('./email-brevo.service');
const gmailService = require('./email-gmail.service');

// Determine which service to use based on environment variables
function getEmailService() {
  const hasBrevo = !!process.env.BREVO_API_KEY;
  const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

  if (hasBrevo) {
    console.log('📧 Using Brevo email service (recommended for production)');
    return brevoService;
  } else if (hasGmail) {
    console.log('📧 Using Gmail SMTP email service (may have limitations on some hosts)');
    return gmailService;
  } else {
    console.warn('⚠️  No email service configured. Set BREVO_API_KEY or GMAIL credentials.');
    // Return a mock service that logs but doesn't send
    return {
      sendEmail: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendPasswordResetOtp: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendEmailVerificationOtp: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendBookingAcceptedNotification: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendCostProposedNotification: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendReceiptUploadedNotification: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendBookingApprovedNotification: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendBookingRejectedNotification: async () => { console.warn('Email not sent: No service configured'); return false; },
      sendWelcomeEmail: async () => { console.warn('Email not sent: No service configured'); return false; },
    };
  }
}

module.exports = getEmailService();
