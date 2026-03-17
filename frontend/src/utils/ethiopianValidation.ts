// Ethiopian Form Validation Utilities
// Comprehensive validation for Ethiopian phone numbers, names, and other fields

// ========================
// ETHIOPIAN PHONE VALIDATION
// ========================

// Ethiopian phone number patterns:
// - Ethio Telecom: 09XX XXX XXX (mobile), 011 XXX XXXX (landline Addis)
// - Safaricom: 07XX XXX XXX
// - International format: +251 9XX XXX XXX or +251 7XX XXX XXX

export const PHONE_PATTERNS = {
  // Mobile patterns (without country code)
  ethioTelecomMobile: /^09[1-9]\d{7}$/, // 09X followed by 7 digits
  safaricom: /^07[0-9]\d{7}$/, // 07X followed by 7 digits
  
  // With country code
  ethioTelecomIntl: /^\+2519[1-9]\d{7}$/, // +2519X followed by 7 digits
  safaricomIntl: /^\+2517[0-9]\d{7}$/, // +2517X followed by 7 digits
  
  // Landline (Addis Ababa)
  landlineAddis: /^011\d{7}$/, // 011 followed by 7 digits
  landlineAddisIntl: /^\+25111\d{7}$/, // +25111 followed by 7 digits
};

export const validateEthiopianPhone = (phone: string): { valid: boolean; error: string | null; formatted: string } => {
  if (!phone || !phone.trim()) {
    return { valid: false, error: 'Phone number is required', formatted: '' };
  }

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's a valid Ethiopian number
  const isEthioMobile = PHONE_PATTERNS.ethioTelecomMobile.test(cleaned);
  const isSafaricom = PHONE_PATTERNS.safaricom.test(cleaned);
  const isEthioIntl = PHONE_PATTERNS.ethioTelecomIntl.test(cleaned);
  const isSafaricomIntl = PHONE_PATTERNS.safaricomIntl.test(cleaned);
  const isLandline = PHONE_PATTERNS.landlineAddis.test(cleaned);
  const isLandlineIntl = PHONE_PATTERNS.landlineAddisIntl.test(cleaned);

  if (isEthioMobile || isSafaricom || isEthioIntl || isSafaricomIntl || isLandline || isLandlineIntl) {
    // Format the number nicely
    let formatted = cleaned;
    if (isEthioMobile || isSafaricom) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (isEthioIntl || isSafaricomIntl) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    return { valid: true, error: null, formatted };
  }

  // Provide specific error messages
  if (cleaned.startsWith('+251')) {
    if (cleaned.length !== 13) {
      return { valid: false, error: 'International format should be +251 followed by 9 digits', formatted: '' };
    }
    return { valid: false, error: 'Invalid Ethiopian number. Use 09X or 07X format', formatted: '' };
  }

  if (cleaned.startsWith('0')) {
    if (cleaned.length !== 10) {
      return { valid: false, error: 'Phone number should be 10 digits (e.g., 0911234567)', formatted: '' };
    }
    if (!cleaned.startsWith('09') && !cleaned.startsWith('07') && !cleaned.startsWith('011')) {
      return { valid: false, error: 'Use 09X (Ethio Telecom), 07X (Safaricom), or 011 (Addis landline)', formatted: '' };
    }
  }

  return { valid: false, error: 'Enter valid Ethiopian phone: 09XXXXXXXX or 07XXXXXXXX', formatted: '' };
};

// Format phone as user types
export const formatPhoneInput = (value: string): string => {
  // Only allow digits and +
  const cleaned = value.replace(/[^\d+]/g, '');
  
  // Limit length
  if (cleaned.startsWith('+251')) {
    return cleaned.slice(0, 13);
  }
  return cleaned.slice(0, 10);
};

// ========================
// NAME VALIDATION
// ========================

export const validateFullName = (name: string): { valid: boolean; error: string | null } => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Full name is required' };
  }

  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  if (words.length < 2) {
    return { valid: false, error: 'Enter first and last name (at least 2 words)' };
  }

  for (const word of words) {
    if (word.length < 2) {
      return { valid: false, error: 'Each name must be at least 2 letters' };
    }
    if (!/^[a-zA-Z\u1200-\u137F]+$/.test(word)) {
      return { valid: false, error: 'Names should contain only letters (English or Amharic)' };
    }
  }

  return { valid: true, error: null };
};

export const validatePersonName = (name: string, fieldName: string = 'Name'): { valid: boolean; error: string | null } => {
  if (!name || !name.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (!/^[a-zA-Z\u1200-\u137F\s]+$/.test(trimmed)) {
    return { valid: false, error: `${fieldName} should contain only letters` };
  }

  return { valid: true, error: null };
};

// ========================
// PLACE NAME VALIDATION
// ========================

export const validatePlaceName = (name: string): { valid: boolean; error: string | null } => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Place name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Place name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Place name must be less than 100 characters' };
  }

  // Allow letters, numbers, spaces, and common punctuation
  if (!/^[a-zA-Z0-9\u1200-\u137F\s\-'.,()]+$/.test(trimmed)) {
    return { valid: false, error: 'Place name contains invalid characters' };
  }

  return { valid: true, error: null };
};

// ========================
// NUMBER VALIDATION
// ========================

export const validatePositiveNumber = (value: string | number, fieldName: string = 'Value'): { valid: boolean; error: string | null } => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  return { valid: true, error: null };
};

export const validatePositiveInteger = (value: string | number, fieldName: string = 'Value'): { valid: boolean; error: string | null } => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be a whole number` };
  }

  return { valid: true, error: null };
};

export const validateRange = (value: number, min: number, max: number, fieldName: string = 'Value'): { valid: boolean; error: string | null } => {
  if (value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (value > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }
  return { valid: true, error: null };
};

// Only allow numeric input (for input fields)
export const filterNumericInput = (value: string, allowDecimal: boolean = false): string => {
  if (allowDecimal) {
    // Allow digits and one decimal point
    const filtered = value.replace(/[^\d.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return filtered;
  }
  // Only allow digits
  return value.replace(/\D/g, '');
};

// ========================
// COST/PRICE VALIDATION
// ========================

export const validateCost = (value: string | number, fieldName: string = 'Cost'): { valid: boolean; error: string | null } => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  // Check for reasonable maximum (e.g., 1 million ETB)
  if (num > 1000000) {
    return { valid: false, error: `${fieldName} seems too high. Please verify.` };
  }

  return { valid: true, error: null };
};

// ========================
// DISTANCE VALIDATION
// ========================

export const validateDistance = (value: string | number, fieldName: string = 'Distance'): { valid: boolean; error: string | null } => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  // Check for reasonable maximum (e.g., 10000 km)
  if (num > 10000) {
    return { valid: false, error: `${fieldName} seems too high. Please verify.` };
  }

  return { valid: true, error: null };
};

// ========================
// STAR RATING VALIDATION
// ========================

export const validateStarRating = (value: number): { valid: boolean; error: string | null } => {
  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Star rating must be a whole number' };
  }
  if (value < 1 || value > 5) {
    return { valid: false, error: 'Star rating must be between 1 and 5' };
  }
  return { valid: true, error: null };
};

// ========================
// URL VALIDATION
// ========================

export const validateImageUrl = (url: string): { valid: boolean; error: string | null } => {
  if (!url || !url.trim()) {
    return { valid: true, error: null }; // Optional field
  }

  const trimmed = url.trim();

  // Check if it's a valid URL
  try {
    new URL(trimmed);
  } catch {
    return { valid: false, error: 'Enter a valid URL (e.g., https://example.com/image.jpg)' };
  }

  // Check if it looks like an image URL
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasImageExtension = imageExtensions.some(ext => trimmed.toLowerCase().includes(ext));
  
  if (!hasImageExtension && !trimmed.includes('image') && !trimmed.includes('photo')) {
    // Just a warning, not an error
    return { valid: true, error: null };
  }

  return { valid: true, error: null };
};

// ========================
// DESCRIPTION VALIDATION
// ========================

export const validateDescription = (text: string, minLength: number = 10, maxLength: number = 2000): { valid: boolean; error: string | null } => {
  if (!text || !text.trim()) {
    return { valid: true, error: null }; // Optional field
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `Description should be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Description should be less than ${maxLength} characters` };
  }

  return { valid: true, error: null };
};

// ========================
// LANGUAGES VALIDATION
// ========================

export const validateLanguages = (languages: string[]): { valid: boolean; error: string | null } => {
  if (!languages || languages.length === 0) {
    return { valid: false, error: 'Select at least one language' };
  }

  for (const lang of languages) {
    if (!lang || lang.trim().length < 2) {
      return { valid: false, error: 'Each language must be at least 2 characters' };
    }
  }

  return { valid: true, error: null };
};

// ========================
// FORM VALIDATION HELPER
// ========================

export interface ValidationResult {
  [key: string]: string | null;
}

export const hasValidationErrors = (errors: ValidationResult): boolean => {
  return Object.values(errors).some(error => error !== null && error !== '');
};

// ========================
// INPUT HANDLERS
// ========================

// Prevent non-numeric input for number fields
export const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal: boolean = false) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  
  if (allowedKeys.includes(e.key)) return;
  
  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (e.ctrlKey || e.metaKey) return;
  
  // Allow decimal point if specified
  if (allowDecimal && e.key === '.' && !e.currentTarget.value.includes('.')) return;
  
  // Allow digits
  if (/^\d$/.test(e.key)) return;
  
  // Prevent all other keys
  e.preventDefault();
};

// Prevent non-letter input for name fields
export const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '];
  
  if (allowedKeys.includes(e.key)) return;
  
  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (e.ctrlKey || e.metaKey) return;
  
  // Allow letters (English and Amharic)
  if (/^[a-zA-Z\u1200-\u137F]$/.test(e.key)) return;
  
  // Prevent all other keys
  e.preventDefault();
};

// Phone number input handler
export const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  
  if (allowedKeys.includes(e.key)) return;
  
  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (e.ctrlKey || e.metaKey) return;
  
  // Allow + at the beginning
  if (e.key === '+' && e.currentTarget.selectionStart === 0 && !e.currentTarget.value.includes('+')) return;
  
  // Allow digits
  if (/^\d$/.test(e.key)) return;
  
  // Prevent all other keys
  e.preventDefault();
};
