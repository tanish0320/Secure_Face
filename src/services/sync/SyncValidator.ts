/**
 * SecureFace Edge AI - Sync Validator
 */

import { SyncPayload } from './SyncTypes';
import { SyncValidationError } from './SyncErrors';

/**
 * Validates the sync payload before transmission.
 */
export function validateSyncPayload(payload: SyncPayload): void {
  if (!payload) {
    throw new SyncValidationError('Sync payload is missing.');
  }

  if (!Array.isArray(payload.attendance)) {
    throw new SyncValidationError('Attendance records must be an array.');
  }

  if (!Array.isArray(payload.auditLogs)) {
    throw new SyncValidationError('Audit logs must be an array.');
  }

  // Basic content check
  if (payload.attendance.length === 0 && payload.auditLogs.length === 0) {
    throw new SyncValidationError('Sync payload is empty.');
  }
}
