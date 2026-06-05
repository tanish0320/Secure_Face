/**
 * SecureFace Edge AI - Recognition Errors
 */

import { DatabaseError } from '../database/types';

export class RecognitionError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'RecognitionError';
    Object.setPrototypeOf(this, RecognitionError.prototype);
  }
}

export class LivenessError extends RecognitionError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'LivenessError';
    Object.setPrototypeOf(this, LivenessError.prototype);
  }
}

export class EmbeddingError extends RecognitionError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'EmbeddingError';
    Object.setPrototypeOf(this, EmbeddingError.prototype);
  }
}
