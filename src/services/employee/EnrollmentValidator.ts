/**
 * SecureFace Edge AI - Enrollment Validator
 */

import { EnrollmentRequest } from './EnrollmentTypes';
import { 
  validateEmployeeId, 
  validateEmployeeName, 
  validateEmbedding 
} from '../../validation/employeeValidation';

/**
 * Validates the enrollment request using standard employee validators.
 */
export function validateEnrollmentRequest(request: EnrollmentRequest): void {
  validateEmployeeId(request.employeeId);
  validateEmployeeName(request.name);
  validateEmbedding(request.embedding);
}
