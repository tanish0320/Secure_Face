/**
 * SecureFace Edge AI - Employee Service Errors
 */

import { DatabaseError } from '../../database/types';

/**
 * Base error for employee service operations
 */
export class EmployeeServiceError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'EmployeeServiceError';
    Object.setPrototypeOf(this, EmployeeServiceError.prototype);
  }
}

/**
 * Thrown when an enrollment process fails
 */
export class EnrollmentError extends EmployeeServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'EnrollmentError';
    Object.setPrototypeOf(this, EnrollmentError.prototype);
  }
}

/**
 * Thrown when embedding encryption or decryption fails
 */
export class EmbeddingEncryptionError extends EmployeeServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'EmbeddingEncryptionError';
    Object.setPrototypeOf(this, EmbeddingEncryptionError.prototype);
  }
}
