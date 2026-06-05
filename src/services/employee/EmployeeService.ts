/**
 * SecureFace Edge AI - Employee Service
 * Purpose: Orchestrate employee enrollment and lifecycle management.
 * Responsibilities: Validation, Encryption, Persistence, and Auditing.
 */

import { employeeRepository } from '../../repositories/employeeRepository';
import { auditRepository } from '../../repositories/auditRepository';
import { dbLogger } from '../../database/types';
import { EmployeeRecord } from '../../types/employee';
import { EnrollmentRequest, EnrollmentResult } from './EnrollmentTypes';
import { EmployeeServiceError, EnrollmentError, EmbeddingEncryptionError } from './EmployeeErrors';
import { validateEnrollmentRequest } from './EnrollmentValidator';
import { EncryptionService } from '../../security/encryptionService';
import { SecurityValidator } from '../../security/securityValidator';
import { EncryptedData } from '../../security/securityTypes';

/**
 * Simple UUID v4 generator for audit IDs.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class EmployeeService {
  /**
   * Enrolls a new employee into the system.
   * Requirement: Enrollment must behave as one logical unit (Audit + Employee).
   */
  async enrollEmployee(request: EnrollmentRequest): Promise<EnrollmentResult> {
    const timestamp = new Date().toISOString();
    let employeeCreated = false;
    
    try {
      // 1. Validate request
      validateEnrollmentRequest(request);

      // 2. Check for duplicate employee
      const exists = await employeeRepository.exists(request.employeeId);
      if (exists) {
        throw new Error('Duplicate Employee');
      }

      // 3. Encrypt embedding (Phase 6: Using EncryptionService)
      const encrypted = await EncryptionService.encrypt(request.embedding);

      // 4. Create employee record
      await employeeRepository.create({
        employee_id: request.employeeId,
        name: request.name,
        embedding: JSON.stringify(encrypted),
        created_at: timestamp
      });
      employeeCreated = true;

      // 5. Create audit record (Success)
      await auditRepository.create({
        id: generateUUID(),
        employee_id: request.employeeId,
        action: 'ENROLLMENT',
        status: 'SUCCESS',
        reason: null,
        timestamp
      });

      dbLogger('INFO', `Enrollment Successful: ${request.employeeId}`);

      return {
        success: true,
        employeeId: request.employeeId,
        enrolledAt: timestamp
      };

    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      
      // Rollback Strategy (Issue 3 - Option B)
      if (employeeCreated) {
        try {
          await employeeRepository.delete(request.employeeId);
          dbLogger('WARN', `Enrollment Rollback: Deleted orphaned employee ${request.employeeId}`);
        } catch (rollbackErr) {
          dbLogger('ERROR', `CRITICAL: Failed to rollback orphaned employee ${request.employeeId}`);
        }
      }

      // Record Failure in Audit Log
      try {
        await auditRepository.create({
          id: generateUUID(),
          employee_id: request.employeeId || null,
          action: 'ENROLLMENT',
          status: 'FAILURE',
          reason: reason,
          timestamp
        });
      } catch (auditErr) {
        dbLogger('ERROR', `Failed to log audit for enrollment failure: ${reason}`);
      }

      // Issue 5: Standardized Failure Logging
      dbLogger('ERROR', `Enrollment Failed: ${request.employeeId} Reason: ${reason}`);
      throw new EnrollmentError(`Failed to enroll employee ${request.employeeId}`, err);
    }
  }

  /**
   * Retrieves a single employee and decrypts their embedding.
   * Issue 1: Never return mixed or encrypted states.
   */
  async getEmployee(id: string): Promise<EmployeeRecord> {
    try {
      const record = await employeeRepository.findById(id);
      
      try {
        const encrypted: EncryptedData = JSON.parse(record.embedding);
        const rawEmbedding = await EncryptionService.decrypt(encrypted);

        return {
          ...record,
          embedding: rawEmbedding
        };
      } catch (decryptErr) {
        // Issue 1: Guarantee all returned embeddings are decrypted or fail.
        throw new EmbeddingEncryptionError(`Decryption failed for employee ${id}.`, decryptErr);
      }
    } catch (err) {
      dbLogger('ERROR', `Get Employee Failed: ${id}`);
      throw err instanceof EmbeddingEncryptionError ? err : new EmployeeServiceError(`Failed to retrieve employee ${id}`, err);
    }
  }

  /**
   * Lists all employees with decrypted embeddings.
   * Issue 1: Fails if any record cannot be decrypted (No mixed states).
   */
  async listEmployees(): Promise<EmployeeRecord[]> {
    try {
      const records = await employeeRepository.getAll();
      
      const decryptedRecords: EmployeeRecord[] = [];
      
      for (const record of records) {
        try {
          const encrypted: EncryptedData = JSON.parse(record.embedding);
          const rawEmbedding = await EncryptionService.decrypt(encrypted);
          
          decryptedRecords.push({
            ...record,
            embedding: rawEmbedding
          });
        } catch (decryptErr) {
          // Issue 1: Stop and fail if any record is corrupt or cannot be decrypted.
          dbLogger('ERROR', `Integrity Breach: Failed to decrypt embedding for employee ${record.employee_id}`);
          throw new EmbeddingEncryptionError(`Data integrity breach: Employee ${record.employee_id} has unreadable embedding.`, decryptErr);
        }
      }

      return decryptedRecords;
    } catch (err) {
      dbLogger('ERROR', 'List Employees Failed due to decryption or data integrity issues');
      throw err instanceof EmbeddingEncryptionError ? err : new EmployeeServiceError('Failed to list employees', err);
    }
  }

  /**
   * Deletes an employee and records the action.
   */
  async deleteEmployee(id: string): Promise<void> {
    const timestamp = new Date().toISOString();
    try {
      await employeeRepository.delete(id);
      
      await auditRepository.create({
        id: generateUUID(),
        employee_id: id,
        action: 'EMPLOYEE_DELETE',
        status: 'SUCCESS',
        reason: null,
        timestamp
      });

      dbLogger('INFO', `Employee Deleted: ${id}`);
    } catch (err) {
      dbLogger('ERROR', `Delete Employee Failed: ${id}`);
      throw err;
    }
  }

  /**
   * Performs startup diagnostics for the employee service.
   */
  async validateEmployeeServiceConfiguration(): Promise<{
    encryptionReady: boolean;
    employeeRepositoryReady: boolean;
    auditRepositoryReady: boolean;
  }> {
    const status = await SecurityValidator.validateSecurityConfiguration();
    
    let auditRepositoryReady = false;
    try {
      await auditRepository.countAuditLogs();
      auditRepositoryReady = true;
    } catch (err) {
      auditRepositoryReady = false;
    }

    return {
      encryptionReady: status.encryptionReady,
      employeeRepositoryReady: status.repositoriesReady,
      auditRepositoryReady
    };
  }

  /**
   * Returns enrollment statistics.
   */
  async getEnrollmentStatistics(): Promise<{ totalEmployees: number }> {
    try {
      const total = await employeeRepository.countEmployees();
      return { totalEmployees: total };
    } catch (err) {
      dbLogger('ERROR', 'Get Statistics Failed');
      throw err;
    }
  }
}
