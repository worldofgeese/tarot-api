/**
 * MOSAIC Safety Pattern: Input Validation Middleware
 *
 * Validates and sanitizes inputs BEFORE they reach business logic.
 * Pattern: check (validate) → act (pass through) or refuse (reject)
 */

const MAX_INPUT_LENGTH = 500;

/**
 * Sanitizes a string by:
 * - Removing null bytes
 * - HTML entity encoding for potential XSS vectors
 */
export function sanitizeString(input: string): string {
  // Strip null bytes
  let sanitized = input.replace(/\0/g, "");

  // HTML entity encode common XSS vectors
  sanitized = sanitized
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized;
}

/**
 * Validates that a string parameter meets security requirements
 * @param sanitize - If true, applies HTML entity encoding (for output contexts)
 */
export function validateStringParam(
  value: string | undefined,
  paramName: string,
  required: boolean = false,
  sanitize: boolean = false
): { valid: boolean; sanitized?: string; error?: string } {
  // Check if required param is missing
  if (!value || value.trim() === "") {
    if (required) {
      return { valid: false, error: `Parameter '${paramName}' is required` };
    }
    return { valid: true, sanitized: "" };
  }

  // Check length limit
  if (value.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Parameter '${paramName}' is too long (max ${MAX_INPUT_LENGTH} characters)`
    };
  }

  // Strip null bytes (always)
  let processed = value.replace(/\0/g, "");

  // Optionally apply HTML sanitization
  if (sanitize) {
    processed = sanitizeString(processed);
  }

  return { valid: true, sanitized: processed };
}

/**
 * Validates that a card ID is a valid positive integer
 */
export function validateCardId(id: string): { valid: boolean; error?: string } {
  // Reject path traversal attempts
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    return { valid: false, error: "Invalid id" };
  }

  // Check if it's a valid positive integer
  const numericId = parseInt(id, 10);

  // Reject non-numeric, NaN, negative, or decimal values
  if (
    isNaN(numericId) ||
    numericId < 0 ||
    id.includes(".") ||
    numericId.toString() !== id.trim()
  ) {
    return { valid: false, error: "Invalid id" };
  }

  return { valid: true };
}

/**
 * Middleware: Validates query parameter 'q' for search endpoints
 */
export function validateSearchQuery(handler: Function) {
  return ({ query, set }: any) => {
    const { q } = query;

    const validation = validateStringParam(q as string, "q", true);

    if (!validation.valid) {
      set.status = 400;
      return { error: validation.error };
    }

    // Pass sanitized query to handler
    const sanitizedQuery = { ...query, q: validation.sanitized };
    return handler({ query: sanitizedQuery, set });
  };
}

/**
 * Middleware: Validates card ID parameter
 */
export function validateCardIdParam(handler: Function) {
  return ({ params, set, ...rest }: any) => {
    const { id } = params;

    const validation = validateCardId(id);

    if (!validation.valid) {
      set.status = 400;
      return { error: validation.error };
    }

    return handler({ params, set, ...rest });
  };
}

/**
 * Middleware: Validates numeric query parameters (like count, limit, offset)
 */
export function validateNumericParam(
  paramName: string,
  min?: number,
  max?: number
) {
  return (handler: Function) => {
    return ({ query, set, ...rest }: any) => {
      const value = query[paramName];

      if (value !== undefined) {
        const numValue = parseInt(value as string, 10);

        if (isNaN(numValue)) {
          set.status = 400;
          return { error: `Parameter '${paramName}' must be a number` };
        }

        if (min !== undefined && numValue < min) {
          set.status = 400;
          return { error: `Parameter '${paramName}' must be at least ${min}` };
        }

        if (max !== undefined && numValue > max) {
          set.status = 400;
          return { error: `Parameter '${paramName}' must be at most ${max}` };
        }
      }

      return handler({ query, set, ...rest });
    };
  };
}
