/**
 * SecureFace Edge AI - Database Types
 * Purpose: Centralized type definitions and error hierarchy.
 * Responsibilities: Define interfaces for migrations, records, and custom errors.
 */

declare const __DEV__: boolean;

export interface Migration {
  version: number;
  name: string;
  statements: string[];
}

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
  execution_time_ms: number;
}

export interface DatabaseConfig {
  name: string;
  location: string;
}

/**
 * Base Database Error class
 */
export class DatabaseError extends Error {
  public readonly cause?: unknown;
  public readonly timestamp: string;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = cause;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Error thrown during migration process
 */
export class MigrationError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'MigrationError';
    Object.setPrototypeOf(this, MigrationError.prototype);
  }
}

/**
 * Error thrown during transaction execution
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'TransactionError';
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}

/**
 * Error thrown for features not yet implemented
 */
export class NotImplementedError extends Error {
  public readonly timestamp: string;

  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(
      this,
      NotImplementedError.prototype
    );
  }
}

/**
 * Logger levels for centralized logging
 */
export type LogLevel = 'INFO' | 'ERROR' | 'WARN';

/**
 * Centralized logger for database operations
 */
export function dbLogger(level: LogLevel, message: string): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[DB][${level}][${timestamp}] ${message}`;
  
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}

/**
 * Database Status Type
 */
export type SyncStatus = 'pending' | 'synced';
