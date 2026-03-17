/**
 * Request body validation middleware using simple schema rules.
 * Mirrors NestJS class-validator behavior without external deps.
 */

/**
 * validate(schema) — returns Express middleware that validates req.body.
 * schema: { fieldName: { required, type, min, max, minLength, maxLength, isEmail, isEnum, isEnumArray } }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      const isEmpty = value === undefined || value === null || value === '';

      if (rules.required && isEmpty) {
        errors.push({ field, message: `${field} is required` });
        continue;
      }
      if (isEmpty) continue;

      if (rules.type === 'number' && isNaN(Number(value))) {
        errors.push({ field, message: `${field} must be a number` });
      }
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push({ field, message: `${field} must be a string` });
      }
      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({ field, message: `${field} must be a boolean` });
      }
      if (rules.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push({ field, message: `${field} must be an array` });
        } else if (rules.isEnumArray) {
          // Validate each element is a valid enum value
          const invalid = value.filter(v => !rules.isEnumArray.includes(v));
          if (invalid.length > 0) {
            errors.push({ field, message: `${field} contains invalid values: ${invalid.join(', ')}. Allowed: ${rules.isEnumArray.join(', ')}` });
          }
        }
      }
      if (rules.minLength && String(value).length < rules.minLength) {
        errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
      }
      if (rules.maxLength && String(value).length > rules.maxLength) {
        errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
      }
      if (rules.min !== undefined && Number(value) < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}` });
      }
      if (rules.max !== undefined && Number(value) > rules.max) {
        errors.push({ field, message: `${field} must be at most ${rules.max}` });
      }
      if (rules.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push({ field, message: `${field} must be a valid email` });
      }
      if (rules.isEnum && !rules.isEnum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.isEnum.join(', ')}` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    next();
  };
}

module.exports = { validate };
