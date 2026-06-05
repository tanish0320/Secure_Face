/**
 * SecureFace Edge AI - Enrollment Types
 */

export interface EnrollmentRequest {
  employeeId: string;
  name: string;
  embedding: string;
}

export interface EnrollmentResult {
  success: boolean;
  employeeId: string;
  enrolledAt: string;
}
