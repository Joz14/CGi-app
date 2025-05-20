export default function validateAndSanitizeInput(input, options = {}) {
  const {
    maxLength = 20,
    allowAlphanumeric = true,
    allowSymbols = false,
    fieldName = 'Input',
    fallback = ''
  } = options;

  if (typeof input !== 'string' || input.trim() === '') {
    return {
      isValid: false,
      sanitized: '',
      error: `${fieldName} cannot be empty`
    };
  }

  let sanitized = input.trim();

  // Strip HTML
  sanitized = sanitized.replace(/<\/?[^>]+(>|$)/g, '');

  // Invalid character detection
  if (allowAlphanumeric && !allowSymbols) {
    const invalidChars = sanitized.replace(/[a-zA-Z0-9 _-]/g, '');
    if (invalidChars.length > 0) {
      return {
        isValid: false,
        sanitized,
        error: `${fieldName} contains invalid characters: ${invalidChars}`
      };
    }
  }

  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      sanitized,
      error: `${fieldName} must be ${maxLength} characters or fewer`
    };
  }

  return {
    isValid: true,
    sanitized
  };
}
