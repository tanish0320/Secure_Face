import { DatabaseError } from '../database/types';

/**
 * Repository layer base error
 */
export class RepositoryError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'RepositoryError';
    Object.setPrototypeOf(this, RepositoryError.prototype);
  }
}

/**
 * Thrown when validation fails before database operation
 */
export class ValidationError extends RepositoryError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Thrown when a record is not found
 */
export class NotFoundError extends RepositoryError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Thrown when a record already exists
 */
export class DuplicateRecordError extends RepositoryError {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateRecordError';
    Object.setPrototypeOf(this, DuplicateRecordError.prototype);
  }
}
