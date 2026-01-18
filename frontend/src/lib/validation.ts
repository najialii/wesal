export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

/**
 * Validate phone format
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }

  // Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Invalid phone format' };
  }

  // Check minimum length (at least 10 digits)
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Phone number must have at least 10 digits' };
  }

  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number is too long' };
  }

  return { isValid: true };
}

/**
 * Validate password meets security requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate max length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (value && value.length > maxLength) {
    return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }

  return { isValid: true };
}
