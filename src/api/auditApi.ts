/**
 * SecureFace Edge AI - Audit API (Mock)
 * Purpose: Simulate remote upload to AWS.
 * Success Rate: 90%
 */

import { AuditRecord } from '../types/audit';
import { dbLogger } from '../database/types';

/**
 * Randomization helper for mock failures.
 */
function shouldSucceed(): boolean {
  return Math.random() < 0.90;
}

/**
 * Uploads audit logs to the remote server.
 */
export async function uploadAuditLogs(logs: AuditRecord[]): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    dbLogger('INFO', `Uploading ${logs.length} audit logs...`);
    
    // Simulate network delay
    setTimeout(() => {
      if (shouldSucceed()) {
        resolve({ success: true });
      } else {
        dbLogger('ERROR', 'Audit upload failed (Mock Network Error)');
        resolve({ success: false });
      }
    }, 1200);
  });
}
