/**
 * Comprehensive Form Validation Utilities
 * Provides real-time input sanitization and validation for user forms
 */

// ========================
// INPUT SANITIZERS (Real-time filtering)
// ========================

/**
 * Sanitize full name input - only letters and spaces allowed
 * Prevents numbers and special characters as user types
 */
export const sanitizeFullName = (value: string): string => {
  return value.replace(/[^a-zA-Z\s]/g, '');
};

/**
 * Sanitize username - only letters, numbers, and underscore
 * Must start with a letter
 */
export const sanitizeUsername = (value: string): string => {
  let sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
  // If first character is not a letter, remove it
  if (sanitized.length > 0 && !/^[a-zA-Z]/.test(sanitized)) {
    sanitized = sanitized.substring(1);
  }
  return sanitized;
};

/**
 * Sanitize phone number - only digits, spaces, hyphens, parentheses, and plus sign
 */
export const sanitizePhone = (value: string): string => {
  return value.replace(/[^0-9\s\-\(\)\+]/g, '');
};

/**
 * Sanitize international phone number - allows country codes and formatting
 */
export const sanitizeInternationalPhone = (value: string): string => {
  // Allow digits, spaces, hyphens, parentheses, plus sign
  return value.replace(/[^0-9\s\-\(\)\+]/g, '');
};

/**
 * Sanitize numeric input - only digits
 */
export const sanitizeNumeric = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

/**
 * Sanitize decimal input - only digits and one decimal point
 */
export const sanitizeDecimal = (value: string): string => {
  // Allow only digits and one decimal point
  let sanitized = value.replace(/[^0-9.]/g, '');
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  return sanitized;
};

/**
 * Sanitize email - basic sanitization (full validation happens on submit)
 */
export const sanitizeEmail = (value: string): string => {
  // Remove spaces and convert to lowercase
  return value.replace(/\s/g, '').toLowerCase();
};

// ========================
// VALIDATORS (Submit-time validation)
// ========================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate full name
 * - Required
 * - Min 2 characters
 * - Only letters and spaces
 */
export const validateFullName = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Full name is required' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters' };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Full name can only contain letters and spaces' };
  }
  
  return { valid: true };
};

/**
 * Validate username
 * - Required
 * - Min 4 characters
 * - Must start with a letter
 * - Only letters, numbers, and underscore
 */
export const validateUsername = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Username is required' };
  }
  
  if (trimmed.length < 4) {
    return { valid: false, error: 'Username must be at least 4 characters' };
  }
  
  if (!/^[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: 'Username must start with a letter' };
  }
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscore' };
  }
  
  return { valid: true };
};

/**
 * Validate email
 * - Required
 * - Valid email format
 */
export const validateEmail = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

/**
 * Validate password
 * - Required
 * - Min 8 characters
 * - Must contain uppercase, lowercase, and number
 */
export const validatePassword = (value: string): ValidationResult => {
  if (!value) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (value.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[a-z]/.test(value)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[A-Z]/.test(value)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/\d/.test(value)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

/**
 * Validate password confirmation
 */
export const validatePasswordConfirm = (password: string, confirm: string): ValidationResult => {
  if (!confirm) {
    return { valid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirm) {
    return { valid: false, error: 'Passwords do not match' };
  }
  
  return { valid: true };
};

/**
 * Validate phone number (Ethiopian format)
 * - Required
 * - Must be 10 digits (without country code) or 13 digits (with +251)
 */
export const validatePhone = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = trimmed.replace(/\D/g, '');
  
  // Ethiopian phone: 10 digits (09xxxxxxxx) or 13 digits (251xxxxxxxxx)
  if (digitsOnly.length === 10 && digitsOnly.startsWith('09')) {
    return { valid: true };
  }
  
  if (digitsOnly.length === 13 && digitsOnly.startsWith('251')) {
    return { valid: true };
  }
  
  if (digitsOnly.length === 12 && digitsOnly.startsWith('2519')) {
    return { valid: true };
  }
  
  return { valid: false, error: 'Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678)' };
};

/**
 * Validate international phone number
 * - Required
 * - Must be between 7 and 15 digits (international standard)
 * - Can start with + for country code
 * - Supports all international formats
 */
export const validateInternationalPhone = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Remove all non-digit characters except leading +
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  
  // International phone numbers are typically 7-15 digits
  if (digitsOnly.length < 7) {
    return { valid: false, error: 'Phone number is too short (minimum 7 digits)' };
  }
  
  if (digitsOnly.length > 15) {
    return { valid: false, error: 'Phone number is too long (maximum 15 digits)' };
  }
  
  // If it starts with +, ensure there are digits after it
  if (hasPlus && digitsOnly.length === 0) {
    return { valid: false, error: 'Please enter digits after the country code' };
  }
  
  return { valid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  return { valid: true };
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  return { valid: true };
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }
  
  return { valid: true };
};

/**
 * Validate numeric value
 */
export const validateNumeric = (value: string, fieldName: string): ValidationResult => {
  if (!/^\d+$/.test(value)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  
  return { valid: true };
};

/**
 * Validate decimal value
 */
export const validateDecimal = (value: string, fieldName: string): ValidationResult => {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  
  return { valid: true };
};

/**
 * Validate range
 */
export const validateRange = (value: number, min: number, max: number, fieldName: string): ValidationResult => {
  if (value < min || value > max) {
    return { valid: false, error: `${fieldName} must be between ${min} and ${max}` };
  }
  
  return { valid: true };
};

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Get password strength (0-5)
 */
export const getPasswordStrength = (password: string): number => {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password), // Special characters
  ];
  
  return checks.filter(Boolean).length;
};

/**
 * Format phone number for display (Ethiopian format)
 */
export const formatPhoneDisplay = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 10 && digitsOnly.startsWith('09')) {
    // Format as: 091 234 5678
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }
  
  if (digitsOnly.length === 13 && digitsOnly.startsWith('251')) {
    // Format as: +251 91 234 5678
    return `+${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
  }
  
  return phone;
};

/**
 * Format international phone number for display
 * Adds spacing for readability
 */
export const formatInternationalPhoneDisplay = (phone: string): string => {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) return phone;
  
  // If it has a plus, format with country code
  if (hasPlus) {
    // Common formats:
    // +1 XXX XXX XXXX (US/Canada - 11 digits)
    // +44 XXXX XXXXXX (UK - 12 digits)
    // +251 XX XXX XXXX (Ethiopia - 12 digits)
    // +86 XXX XXXX XXXX (China - 13 digits)
    
    if (digitsOnly.length <= 11) {
      // Format: +X XXX XXX XXXX
      const countryCode = digitsOnly.slice(0, digitsOnly.length - 10);
      const rest = digitsOnly.slice(digitsOnly.length - 10);
      return `+${countryCode} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
    } else {
      // Format: +XXX XX XXX XXXX
      const countryCode = digitsOnly.slice(0, digitsOnly.length - 9);
      const rest = digitsOnly.slice(digitsOnly.length - 9);
      return `+${countryCode} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
    }
  }
  
  // Without country code, just add spacing
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }
  
  return phone;
};

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: Record<string, string | undefined>): boolean => {
  return Object.values(errors).some(error => error && error.length > 0);
};
