import type { AttendanceRecord } from '../../types';

/**
 * Mock Attendance service – records attendance data locally.
 * In a real app this would persist to a backend and support sync.
 */
export const attendanceService = {
  async recordAttendance(payload: { employeeId: string; gps: string }): Promise<AttendanceRecord> {
    const id = Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();
    return {
      id,
      employee_id: payload.employeeId,
      timestamp,
      gps: payload.gps,
      sync_status: 'pending',
    };
  },

  async listAttendance(): Promise<AttendanceRecord[]> {
    // Mock – empty list
    return [];
  },

  async syncPending(): Promise<void> {
    // No‑op mock – immediately resolves.
    return;
  },
};
