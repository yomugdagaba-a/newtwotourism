const dns = require('dns').promises;

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'maildrop.cc', 'getnada.com', 'sharklasers.com',
  'guerrillamailblock.com', 'spam4.me', 'grr.la', 'discard.email',
  'emailondeck.com', 'mintemail.com', 'mytemp.email', 'tempinbox.com',
];

const COMMON_TYPOS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmil.com': 'gmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com',
};

class EmailValidatorService {
  isValidSyntax(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  isDisposableEmail(email) {
    if (!email) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? DISPOSABLE_DOMAINS.includes(domain) : false;
  }

  hasSuspiciousPattern(email) {
    if (!email) return { suspicious: false };
    const localPart = email.split('@')[0];
    const vowels = (localPart.match(/[aeiou]/gi) || []).length;
    const numbers = (localPart.match(/[0-9]/g) || []).length;
    if (localPart.length > 10 && vowels < 2) return { suspicious: true, reason: 'Email appears to contain random characters' };
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(localPart)) return { suspicious: true, reason: 'Email contains too many consecutive consonants' };
    if (numbers > localPart.length * 0.5 && localPart.length > 8) return { suspicious: true, reason: 'Email contains too many numbers' };
    return { suspicious: false };
  }

  checkForTypos(email) {
    if (!email) return { hasTypo: false };
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return { hasTypo: false };
    if (COMMON_TYPOS[domain]) return { hasTypo: true, suggestion: email.split('@')[0] + '@' + COMMON_TYPOS[domain] };
    return { hasTypo: false };
  }

  async hasMXRecords(email) {
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      return false;
    }
  }

  async validateEmail(email, options = {}) {
    if (process.env.DISABLE_EMAIL_VALIDATION === 'true') {
      return { valid: true, email: email?.toLowerCase().trim(), normalizedEmail: email?.toLowerCase().trim(), errors: [], warnings: [] };
    }

    const { checkMX = true, blockDisposable = true, checkSuspicious = true, checkTypos = true } = options;
    const result = { valid: false, email, errors: [], warnings: [] };

    if (!email) { result.errors.push('Email is required'); return result; }

    const normalizedEmail = email.toLowerCase().trim();
    result.email = normalizedEmail;

    if (!this.isValidSyntax(normalizedEmail)) { result.errors.push('Invalid email format'); return result; }

    if (checkTypos) {
      const typoCheck = this.checkForTypos(normalizedEmail);
      if (typoCheck.hasTypo) {
        result.errors.push(`Did you mean ${typoCheck.suggestion}?`);
        result.warnings.push(`Possible typo detected. Did you mean: ${typoCheck.suggestion}`);
        return result;
      }
    }

    if (blockDisposable && this.isDisposableEmail(normalizedEmail)) {
      result.errors.push('Disposable/temporary email addresses are not allowed');
      return result;
    }

    if (checkSuspicious) {
      const suspiciousCheck = this.hasSuspiciousPattern(normalizedEmail);
      if (suspiciousCheck.suspicious) {
        result.errors.push(suspiciousCheck.reason);
        result.warnings.push('This email address looks suspicious. Please use a real email address.');
        return result;
      }
    }

    if (checkMX) {
      const hasMX = await this.hasMXRecords(normalizedEmail);
      if (!hasMX) { result.errors.push('Email domain does not exist or cannot receive emails'); return result; }
    }

    result.valid = true;
    return result;
  }

  quickValidate(email) {
    return this.isValidSyntax(email);
  }

  async validateEmails(emails, options = {}) {
    if (!Array.isArray(emails)) return [];
    return Promise.all(emails.map(email => this.validateEmail(email, options)));
  }
}

module.exports = new EmailValidatorService();
