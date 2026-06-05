/**
 * SecureFace Edge AI - Sync Service Errors
 */

import { DatabaseError } from '../../database/types';

/**
 * Base error for sync service operations
 */
export class SyncServiceError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'SyncServiceError';
    Object.setPrototypeOf(this, SyncServiceError.prototype);
  }
}

/**
 * Thrown when the device is offline during a sync attempt
 */
export class ConnectivityError extends SyncServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectivityError';
    Object.setPrototypeOf(this, ConnectivityError.prototype);
  }
}

/**
 * Thrown when the sync payload fails validation
 */
export class SyncValidationError extends SyncServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'SyncValidationError';
    Object.setPrototypeOf(this, SyncValidationError.prototype);
  }
}

/**
 * Thrown when the remote upload fails after all retries
 */
export class UploadFailureError extends SyncServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'UploadFailureError';
    Object.setPrototypeOf(this, UploadFailureError.prototype);
  }
}
