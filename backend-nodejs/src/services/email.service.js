/**
 * Brevo Email Service (Production)
 * 
 * Uses Brevo API for reliable email delivery on Render.
 * No SMTP ports needed - works everywhere!
 */

const brevoService = require('./email-brevo.service');

// Export Brevo service directly
module.exports = brevoService;
