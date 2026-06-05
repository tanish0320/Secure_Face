/**
 * SecureFace Edge AI - Attendance Validation
 */

import { ValidationError } from '../repositories/errors';

/**
 * Validates GPS string (lat,long)
 */
export function validateGPS(gps: string): void {
  const gpsRegex = /^-?([1-8]?\d(\.\d+)?|90(\.0+)?),-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (!gpsRegex.test(gps)) {
    throw new ValidationError('Invalid GPS format: Expected "latitude,longitude" within valid ranges.');
  }
}

/**
 * Validates recognition/liveness scores
 * Must be 0.0 to 1.0 or null
 */
export function validateScore(score: number | null, fieldName: string): void {
  if (score === null) return;
  
  if (typeof score !== 'number' || score < 0.0 || score > 1.0) {
    throw new ValidationError(`Invalid ${fieldName}: Must be a numeric value between 0.0 and 1.0.`);
  }
}
