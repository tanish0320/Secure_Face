/**
 * SecureFace Edge AI - Attendance Service Errors
 */

import { DatabaseError } from '../../database/types';

/**
 * Base error for attendance service operations
 */
export class AttendanceServiceError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AttendanceServiceError';
    Object.setPrototypeOf(this, AttendanceServiceError.prototype);
  }
}

/**
 * Thrown when attendance request validation fails
 */
export class AttendanceValidationError extends AttendanceServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceValidationError';
    Object.setPrototypeOf(this, AttendanceValidationError.prototype);
  }
}

/**
 * Thrown when an attendance record cannot be processed or saved
 */
export class AttendanceProcessingError extends AttendanceServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AttendanceProcessingError';
    Object.setPrototypeOf(this, AttendanceProcessingError.prototype);
  }
}

/**
 * Thrown when an employee attempts to mark attendance too frequently
 */
export class DuplicateAttendanceError extends AttendanceServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateAttendanceError';
    Object.setPrototypeOf(this, DuplicateAttendanceError.prototype);
  }
}
