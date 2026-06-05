/**
 * SecureFace Edge AI - Common Validation
 */

import { ValidationError } from '../repositories/errors';

/**
 * Validates if a string is a valid UUID format (v4)
 */
export function validateUUID(id: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName}: Must be a valid UUID v4.`);
  }
}

/**
 * Validates if a string is a strict ISO 8601 timestamp
 * Accepts: 2026-06-05T12:34:56.000Z or 2026-06-05T12:34:56Z
 */
export function validateTimestamp(timestamp: string, fieldName: string): void {
  // Strict ISO 8601 Regex
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  
  if (!isoRegex.test(timestamp)) {
    throw new ValidationError(`Invalid ${fieldName}: Must be a strict ISO 8601 timestamp (YYYY-MM-DDTHH:mm:ss.sssZ).`);
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${fieldName}: Date is logically invalid.`);
  }
}
