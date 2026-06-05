/**
 * SecureFace Edge AI - Employee Validation
 */

import { ValidationError } from '../repositories/errors';

/**
 * Validates Employee ID
 * min length 3, max length 50, alphanumeric, underscore, hyphen
 */
export function validateEmployeeId(id: string): void {
  if (!id || id.length < 3 || id.length > 50) {
    throw new ValidationError('Employee ID must be between 3 and 50 characters.');
  }
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(id)) {
    throw new ValidationError('Employee ID can only contain alphanumeric characters, underscores, and hyphens.');
  }
}

/**
 * Validates Employee Name
 * min length 2, max length 100
 */
export function validateEmployeeName(name: string): void {
  if (!name || name.length < 2 || name.length > 100) {
    throw new ValidationError('Employee name must be between 2 and 100 characters.');
  }
}

/**
 * Validates Embedding
 * Must not be empty, must be string, max 1MB
 */
export function validateEmbedding(embedding: string): void {
  if (!embedding || typeof embedding !== 'string' || embedding.trim().length === 0) {
    throw new ValidationError('Embedding must be a non-empty string.');
  }
  
  // 1MB = 1,048,576 characters (assuming UTF-8 approx)
  if (embedding.length > 1048576) {
    throw new ValidationError('Embedding size exceeds the 1MB limit.');
  }
}
