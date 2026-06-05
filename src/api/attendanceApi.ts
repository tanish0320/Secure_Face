/**
 * SecureFace Edge AI - Attendance API (Mock)
 * Purpose: Simulate remote upload to AWS.
 * Success Rate: 90%
 */

import { AttendanceRecord } from '../types/attendance';
import { dbLogger } from '../database/types';

/**
 * Randomization helper for mock failures.
 */
function shouldSucceed(): boolean {
  return Math.random() < 0.90;
}

/**
 * Uploads attendance records to the remote server.
 */
export async function uploadAttendance(records: AttendanceRecord[]): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    dbLogger('INFO', `Uploading ${records.length} attendance records...`);
    
    // Simulate network delay
    setTimeout(() => {
      if (shouldSucceed()) {
        resolve({ success: true });
      } else {
        dbLogger('ERROR', 'Attendance upload failed (Mock Network Error)');
        resolve({ success: false });
      }
    }, 1500);
  });
}
