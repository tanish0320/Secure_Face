/**
 * SecureFace Edge AI - Attendance Validator
 */

import { AttendanceRequest } from './AttendanceTypes';
import { validateEmployeeId } from '../../validation/employeeValidation';
import { validateGPS, validateScore } from '../../validation/attendanceValidation';

/**
 * Validates the attendance request using Phase 2 validators.
 */
export function validateAttendanceRequest(request: AttendanceRequest): void {
  validateEmployeeId(request.employeeId);
  validateGPS(request.gps);
  validateScore(request.recognitionScore, 'recognitionScore');
  validateScore(request.livenessScore, 'livenessScore');
}
