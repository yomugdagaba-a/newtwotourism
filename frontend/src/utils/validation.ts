// Professional Form Validation Utilities

export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean;
  message: string;
}

export interface FieldValidation {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

// Common validation rules
export const rules = {
  required: (fieldName: string): ValidationRule => ({
    validate: (value) => value !== undefined && value !== null && String(value).trim() !== '',
    message: `${fieldName} is required`
  }),

  minLength: (fieldName: string, min: number): ValidationRule => ({
    validate: (value) => !value || String(value).length >= min,
    message: `${fieldName} must be at least ${min} characters`
  }),

  maxLength: (fieldName: string, max: number): ValidationRule => ({
    validate: (value) => !value || String(value).length <= max,
    message: `${fieldName} must be at most ${max} characters`
  }),

  email: (): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) && value.includes('@') && value.split('@')[1]?.includes('.');
    },
    message: 'Please enter a valid email address (e.g., user@example.com)'
  }),

  phone: (): ValidationRule => ({
    validate: (value) => !value || /^[\d\s\-+()]{7,20}$/.test(value),
    message: 'Please enter a valid phone number (7-20 digits)'
  }),

  url: (): ValidationRule => ({
    validate: (value) => !value || /^https?:\/\/.+/.test(value),
    message: 'Please enter a valid URL (starting with http:// or https://)'
  }),

  numeric: (fieldName: string): ValidationRule => ({
    validate: (value) => !value || !isNaN(Number(value)),
    message: `${fieldName} must be a number`
  }),

  min: (fieldName: string, min: number): ValidationRule => ({
    validate: (value) => !value || Number(value) >= min,
    message: `${fieldName} must be at least ${min}`
  }),

  max: (fieldName: string, max: number): ValidationRule => ({
    validate: (value) => !value || Number(value) <= max,
    message: `${fieldName} must be at most ${max}`
  }),

  match: (fieldName: string, matchField: string): ValidationRule => ({
    validate: (value, formData) => !value || value === formData?.[matchField],
    message: `${fieldName} does not match`
  }),

  pattern: (fieldName: string, regex: RegExp, customMessage?: string): ValidationRule => ({
    validate: (value) => !value || regex.test(value),
    message: customMessage || `${fieldName} format is invalid`
  }),

  noSpaces: (fieldName: string): ValidationRule => ({
    validate: (value) => !value || !/\s/.test(value),
    message: `${fieldName} cannot contain spaces`
  }),

  alphanumeric: (fieldName: string): ValidationRule => ({
    validate: (value) => !value || /^[a-zA-Z0-9_]+$/.test(value),
    message: `${fieldName} can only contain letters, numbers, and underscores`
  }),

  lettersOnly: (fieldName: string): ValidationRule => ({
    validate: (value) => !value || /^[a-zA-Z\s]+$/.test(value),
    message: `${fieldName} can only contain letters and spaces`
  }),

  startsWithLetter: (fieldName: string): ValidationRule => ({
    validate: (value) => !value || /^[a-zA-Z]/.test(value),
    message: `${fieldName} must start with a letter`
  }),

  positiveNumber: (fieldName: string): ValidationRule => ({
    validate: (value) => !value || (Number(value) > 0),
    message: `${fieldName} must be a positive number`
  }),

  coordinates: (fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return !isNaN(num) && num >= -180 && num <= 180;
    },
    message: `${fieldName} must be a valid coordinate (-180 to 180)`
  }),

  latitude: (): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return !isNaN(num) && num >= -90 && num <= 90;
    },
    message: 'Latitude must be between -90 and 90'
  }),

  longitude: (): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const num = Number(value);
      return !isNaN(num) && num >= -180 && num <= 180;
    },
    message: 'Longitude must be between -180 and 180'
  }),

  imageUrl: (): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(value) || 
             /^https?:\/\/.+/.test(value); // Allow any URL for flexibility
    },
    message: 'Please enter a valid image URL'
  }),

  dateNotPast: (fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    message: `${fieldName} cannot be in the past`
  }),

  dateAfter: (fieldName: string, afterField: string): ValidationRule => ({
    validate: (value, formData) => {
      if (!value || !formData?.[afterField]) return true;
      return new Date(value) > new Date(formData[afterField]);
    },
    message: `${fieldName} must be after the start date`
  }),
};

// Validate a single field
export const validateField = (
  value: any,
  fieldRules: ValidationRule[],
  formData?: any
): string | null => {
  for (const rule of fieldRules) {
    if (!rule.validate(value, formData)) {
      return rule.message;
    }
  }
  return null;
};

// Validate entire form
export const validateForm = (
  formData: Record<string, any>,
  validationRules: FieldValidation
): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  for (const [field, fieldRules] of Object.entries(validationRules)) {
    const error = validateField(formData[field], fieldRules, formData);
    if (error) {
      errors[field] = error;
    }
  }
  
  return errors;
};

// Check if form has errors
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Common field validation schemas
export const schemas = {
  login: {
    usernameOrEmail: [rules.required('Username or email')],
    password: [rules.required('Password')]
  },

  register: {
    username: [
      rules.required('Username'),
      rules.minLength('Username', 4),
      rules.maxLength('Username', 30),
      rules.startsWithLetter('Username'),
      rules.alphanumeric('Username')
    ],
    fullName: [
      rules.required('Full name'),
      rules.minLength('Full name', 2),
      rules.maxLength('Full name', 100),
      rules.lettersOnly('Full name')
    ],
    email: [
      rules.required('Email'),
      rules.email()
    ],
    password: [
      rules.required('Password'),
      rules.minLength('Password', 8),
      rules.pattern('Password', /(?=.*[a-z])/, 'Password must contain at least one lowercase letter'),
      rules.pattern('Password', /(?=.*[A-Z])/, 'Password must contain at least one uppercase letter'),
      rules.pattern('Password', /(?=.*\d)/, 'Password must contain at least one number')
    ],
    confirmPassword: [
      rules.required('Confirm password'),
      rules.match('Passwords', 'password')
    ]
  },

  tourism: {
    name: [
      rules.required('Name'),
      rules.minLength('Name', 3),
      rules.maxLength('Name', 150)
    ],
    description: [
      rules.required('Description'),
      rules.minLength('Description', 20),
      rules.maxLength('Description', 3000)
    ],
    wereda: [rules.required('Wereda')],
    kebele: [rules.required('Kebele')],
    category: [rules.required('Category')],
    latitude: [rules.latitude()],
    longitude: [rules.longitude()]
  },

  hotel: {
    name: [
      rules.required('Hotel name'),
      rules.minLength('Hotel name', 3),
      rules.maxLength('Hotel name', 150)
    ],
    description: [
      rules.minLength('Description', 10),
      rules.maxLength('Description', 3000)
    ],
    tourismPlaceId: [rules.required('Tourism place')],
    starRating: [
      rules.required('Star rating'),
      rules.min('Star rating', 1),
      rules.max('Star rating', 5)
    ],
    contactInfo: [
      rules.required('Contact info'),
      rules.minLength('Contact info', 5),
      rules.maxLength('Contact info', 100)
    ]
  },

  guider: {
    name: [
      rules.required('Name'),
      rules.minLength('Name', 2),
      rules.maxLength('Name', 100)
    ],
    phone: [
      rules.required('Phone'),
      rules.phone()
    ],
    email: [
      rules.email()
    ],
    experience: [
      rules.minLength('Experience', 10),
      rules.maxLength('Experience', 500)
    ],
    languages: [
      rules.required('Languages')
    ]
  },

  road: {
    name: [
      rules.required('Road name'),
      rules.minLength('Road name', 3),
      rules.maxLength('Road name', 150)
    ],
    startPoint: [rules.required('Start point')],
    endPoint: [rules.required('End point')],
    distanceByCar: [
      rules.positiveNumber('Distance by car')
    ],
    distanceByFoot: [
      rules.positiveNumber('Distance by foot')
    ]
  },

  horseService: {
    name: [
      rules.required('Service name'),
      rules.minLength('Service name', 3),
      rules.maxLength('Service name', 50)
    ],
    contactPhone: [
      rules.required('Contact phone'),
      rules.phone()
    ],
    pricePerHour: [
      rules.required('Price per hour'),
      rules.positiveNumber('Price per hour')
    ]
  },

  booking: {
    checkIn: [
      rules.required('Check-in date'),
      rules.dateNotPast('Check-in date')
    ],
    checkOut: [
      rules.required('Check-out date'),
      rules.dateAfter('Check-out date', 'checkIn')
    ],
    numberOfGuests: [
      rules.required('Number of guests'),
      rules.min('Guests', 1),
      rules.max('Guests', 20)
    ],
    numberOfRooms: [
      rules.min('Rooms', 1),
      rules.max('Rooms', 20)
    ]
  },

  user: {
    username: [
      rules.required('Username'),
      rules.minLength('Username', 4),
      rules.maxLength('Username', 30),
      rules.startsWithLetter('Username'),
      rules.alphanumeric('Username')
    ],
    fullName: [
      rules.required('Full name'),
      rules.minLength('Full name', 2),
      rules.maxLength('Full name', 50)
    ],
    email: [
      rules.required('Email'),
      rules.email()
    ],
    phone: [
      rules.phone()
    ]
  }
};

// Helper function to get validation error message for a specific field
export const getFieldError = (
  fieldName: string,
  value: any,
  schemaName: keyof typeof schemas,
  formData?: any
): string | null => {
  const schema = schemas[schemaName];
  if (!schema || !schema[fieldName as keyof typeof schema]) return null;
  return validateField(value, schema[fieldName as keyof typeof schema] as ValidationRule[], formData);
};

// Quick validation functions for common use cases
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^[\d\s\-+()]{7,20}$/.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  return /^https?:\/\/.+/.test(url);
};

export const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z][a-zA-Z0-9_]{3,29}$/.test(username);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8 && 
         /[a-z]/.test(password) && 
         /[A-Z]/.test(password) && 
         /\d/.test(password);
};
