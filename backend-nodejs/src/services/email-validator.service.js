// ============================================
// EMAIL VALIDATION SERVICE
// ============================================
// Validates email addresses before sending
// - Syntax validation (regex)
// - DNS MX record check (domain has mail server)
// - Disposable email detection (temp email services)
// - Suspicious pattern detection (random characters)
// - Common typo detection (gmial.com, yahooo.com, etc.)
// ============================================

const dns = require('dns').promises;

// Common disposable/temporary email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'maildrop.cc', 'getnada.com', 'sharklasers.com',
  'guerrillamailblock.com', 'spam4.me', 'grr.la', 'discard.email',
  'emailondeck.com', 'mintemail.com', 'mytemp.email', 'tempinbox.com'
];

// Common email typos
const COMMON_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com'
};

/**
 * Validate email syntax using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid syntax
 */
function isValidSyntax(email) {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
}

/**
 * Check if email domain is disposable/temporary
 * @param {string} email - Email address to check
 * @returns {boolean} - True if disposable
 */
function isDisposableEmail(email) {
  if (!email) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Check if email has suspicious patterns (random characters)
 * @param {string} email - Email address to check
 * @returns {object} - { suspicious: boolean, reason: string }
 */
function hasSuspiciousPattern(email) {
  if (!email) return { suspicious: false };
  
  const localPart = email.split('@')[0];
  
  // Check for excessive random characters (e.g., drtfgd4vsvsh)
  // Pattern: more than 8 characters with no vowels or too many consonants in a row
  const vowels = (localPart.match(/[aeiou]/gi) || []).length;
  const consonants = (localPart.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
  const numbers = (localPart.match(/[0-9]/g) || []).length;
  
  // Suspicious if:
  // 1. More than 10 characters with less than 2 vowels
  // 2. More than 5 consecutive consonants
  // 3. More than 50% numbers
  
  if (localPart.length > 10 && vowels < 2) {
    return { suspicious: true, reason: 'Email appears to contain random characters' };
  }
  
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(localPart)) {
    return { suspicious: true, reason: 'Email contains too many consecutive consonants' };
  }
  
  if (numbers > localPart.length * 0.5 && localPart.length > 8) {
    return { suspicious: true, reason: 'Email contains too many numbers' };
  }
  
  return { suspicious: false };
}

/**
 * Check for common typos in email domain
 * @param {string} email - Email address to check
 * @returns {object} - { hasTypo: boolean, suggestion: string }
 */
function checkForTypos(email) {
  if (!email) return { hasTypo: false };
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { hasTypo: false };
  
  if (COMMON_TYPOS[domain]) {
    return {
      hasTypo: true,
      suggestion: email.split('@')[0] + '@' + COMMON_TYPOS[domain]
    };
  }
  
  return { hasTypo: false };
}

/**
 * Check if domain has valid MX records (mail server)
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} - True if domain has MX records
 */
async function hasMXRecords(email) {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    // DNS lookup failed - domain doesn't exist or no MX records
    return false;
  }
}

/**
 * Comprehensive email validation
 * @param {string} email - Email address to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.checkMX - Check MX records (default: true)
 * @param {boolean} options.blockDisposable - Block disposable emails (default: true)
 * @param {boolean} options.checkSuspicious - Check for suspicious patterns (default: true)
 * @param {boolean} options.checkTypos - Check for common typos (default: true)
 * @returns {Promise<Object>} - Validation result
 */
async function validateEmail(email, options = {}) {
  // Skip validation in test environment if DISABLE_EMAIL_VALIDATION is set
  if (process.env.DISABLE_EMAIL_VALIDATION === 'true') {
    return {
      valid: true,
      email: email?.toLowerCase().trim(),
      normalizedEmail: email?.toLowerCase().trim(),
      errors: [],
      warnings: []
    };
  }
  
  const {
    checkMX = true,
    blockDisposable = true,
    checkSuspicious = true,
    checkTypos = true
  } = options;
  
  const result = {
    valid: false,
    email: email,
    errors: [],
    warnings: []
  };
  
  // 1. Check if email is provided
  if (!email) {
    result.errors.push('Email is required');
    return result;
  }
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  result.email = normalizedEmail;
  
  // 2. Syntax validation
  if (!isValidSyntax(normalizedEmail)) {
    result.errors.push('Invalid email format');
    return result;
  }
  
  // 3. Check for common typos
  if (checkTypos) {
    const typoCheck = checkForTypos(normalizedEmail);
    if (typoCheck.hasTypo) {
      result.errors.push(`Did you mean ${typoCheck.suggestion}?`);
      result.warnings.push(`Possible typo detected. Did you mean: ${typoCheck.suggestion}`);
      return result;
    }
  }
  
  // 4. Check for disposable email
  if (blockDisposable && isDisposableEmail(normalizedEmail)) {
    result.errors.push('Disposable/temporary email addresses are not allowed');
    return result;
  }
  
  // 5. Check for suspicious patterns
  if (checkSuspicious) {
    const suspiciousCheck = hasSuspiciousPattern(normalizedEmail);
    if (suspiciousCheck.suspicious) {
      result.errors.push(suspiciousCheck.reason);
      result.warnings.push('This email address looks suspicious. Please use a real email address.');
      return result;
    }
  }
  
  // 6. Check MX records (domain has mail server)
  if (checkMX) {
    const hasMX = await hasMXRecords(normalizedEmail);
    if (!hasMX) {
      result.errors.push('Email domain does not exist or cannot receive emails');
      return result;
    }
  }
  
  // All checks passed
  result.valid = true;
  return result;
}

/**
 * Quick email validation (syntax only)
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid syntax
 */
function quickValidate(email) {
  return isValidSyntax(email);
}

/**
 * Validate multiple emails
 * @param {string[]} emails - Array of email addresses
 * @param {Object} options - Validation options
 * @returns {Promise<Object[]>} - Array of validation results
 */
async function validateEmails(emails, options = {}) {
  if (!Array.isArray(emails)) return [];
  
  const results = await Promise.all(
    emails.map(email => validateEmail(email, options))
  );
  
  return results;
}

module.exports = {
  validateEmail,
  quickValidate,
  validateEmails,
  isValidSyntax,
  isDisposableEmail,
  hasMXRecords,
  hasSuspiciousPattern,
  checkForTypos
};
