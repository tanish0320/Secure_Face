/**
 * SecureFace Edge AI - Employee Repository
 */

import { getDB } from '../database/index';
import { dbLogger } from '../database/types';
import { EmployeeRecord } from '../types/employee';
import { 
  validateEmployeeId, 
  validateEmployeeName, 
  validateEmbedding 
} from '../validation/employeeValidation';
import { validateTimestamp } from '../validation/commonValidation';
import { 
  RepositoryError, 
  DuplicateRecordError, 
  NotFoundError 
} from './errors';

export const employeeRepository = {
  /**
   * Creates a new employee record
   */
  async create(employee: EmployeeRecord): Promise<void> {
    // 1. Validation
    validateEmployeeId(employee.employee_id);
    validateEmployeeName(employee.name);
    validateEmbedding(employee.embedding);
    validateTimestamp(employee.created_at, 'created_at');

    try {
      const db = await getDB();
      
      // Check for existence (Duplicate detection requirement)
      const isDuplicate = await this.exists(employee.employee_id);
      if (isDuplicate) {
        dbLogger('WARN', `Duplicate Employee Attempt: ${employee.employee_id}`);
        throw new DuplicateRecordError(`Employee with ID ${employee.employee_id} already exists.`);
      }

      await db.executeSql(
        'INSERT INTO employees (employee_id, name, embedding, created_at) VALUES (?, ?, ?, ?)',
        [employee.employee_id, employee.name, employee.embedding, employee.created_at]
      );

      dbLogger('INFO', `Employee Created: ${employee.employee_id}`);
    } catch (err) {
      if (err instanceof DuplicateRecordError) throw err;
      dbLogger('ERROR', `Employee Creation Failure: ${employee.employee_id}`);
      throw new RepositoryError('Failed to create employee record', err);
    }
  },

  /**
   * Retrieves all employee records
   * Required by AI module (Dev2)
   */
  async getAll(): Promise<EmployeeRecord[]> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql('SELECT * FROM employees ORDER BY created_at DESC');
      
      const employees: EmployeeRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        employees.push(results.rows.item(i));
      }
      
      return employees;
    } catch (err) {
      dbLogger('ERROR', 'Get All Employees Failure');
      throw new RepositoryError('Failed to retrieve all employees', err);
    }
  },

  /**
   * Finds an employee by ID
   */
  async findById(id: string): Promise<EmployeeRecord> {
    try {
      validateEmployeeId(id);
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT * FROM employees WHERE employee_id = ?',
        [id]
      );

      if (results.rows.length === 0) {
        throw new NotFoundError(`Employee with ID ${id} not found.`);
      }

      return results.rows.item(0);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      dbLogger('ERROR', `Employee Find Failure: ${id}`);
      throw new RepositoryError(`Failed to find employee with ID ${id}`, err);
    }
  },

  /**
   * Updates an employee record
   */
  async update(id: string, updates: Partial<Omit<EmployeeRecord, 'employee_id' | 'created_at'>>): Promise<void> {
    // Validation
    validateEmployeeId(id);
    if (updates.name) validateEmployeeName(updates.name);
    if (updates.embedding) validateEmbedding(updates.embedding);

    try {
      const db = await getDB();
      const existing = await this.findById(id);

      const updatedName = updates.name ?? existing.name;
      const updatedEmbedding = updates.embedding ?? existing.embedding;

      await db.executeSql(
        'UPDATE employees SET name = ?, embedding = ? WHERE employee_id = ?',
        [updatedName, updatedEmbedding, id]
      );

      dbLogger('INFO', `Employee Updated: ${id}`);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      dbLogger('ERROR', `Employee Update Failure: ${id}`);
      throw new RepositoryError(`Failed to update employee with ID ${id}`, err);
    }
  },

  /**
   * Deletes an employee record
   */
  async delete(id: string): Promise<void> {
    try {
      validateEmployeeId(id);
      const db = await getDB();
      const exists = await this.exists(id);
      if (!exists) {
        throw new NotFoundError(`Employee with ID ${id} not found.`);
      }

      await db.executeSql('DELETE FROM employees WHERE employee_id = ?', [id]);
      dbLogger('INFO', `Employee Deleted: ${id}`);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      dbLogger('ERROR', `Employee Deletion Failure: ${id}`);
      throw new RepositoryError(`Failed to delete employee with ID ${id}`, err);
    }
  },

  /**
   * Checks if an employee exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      validateEmployeeId(id);
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT 1 FROM employees WHERE employee_id = ?',
        [id]
      );
      return results.rows.length > 0;
    } catch (err) {
      throw new RepositoryError(`Error checking existence of employee ${id}`, err);
    }
  },

  /**
   * Counts total number of employees (Testing/Validation)
   */
  async countEmployees(): Promise<number> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql('SELECT COUNT(*) as count FROM employees');
      return results.rows.item(0).count;
    } catch (err) {
      throw new RepositoryError('Failed to count employees', err);
    }
  }
};
