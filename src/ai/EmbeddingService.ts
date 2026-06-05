/**
 * SecureFace Edge AI - Embedding Service
 * Purpose: Manage loading and caching of employee embeddings from the backend.
 * Responsibilities: Cache embeddings in memory, refresh cache, and provide data for recognition.
 */

import { EmployeeService } from '../services/employee/EmployeeService';
import { EmployeeRecord } from '../types/employee';
import { dbLogger } from '../database/types';
import { EmbeddingError } from './RecognitionErrors';

const CACHE_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class EmbeddingService {
  private static instance: EmbeddingService;
  private employeeService: EmployeeService;
  private cachedEmployees: EmployeeRecord[] = [];
  private lastFetchTime: number = 0;

  private constructor() {
    this.employeeService = new EmployeeService();
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Loads enrolled employees from the backend.
   * Uses in-memory cache with 5-minute TTL.
   */
  async getEnrolledEmployees(forceRefresh: boolean = false): Promise<EmployeeRecord[]> {
    const now = Date.now();
    
    if (!forceRefresh && this.cachedEmployees.length > 0 && (now - this.lastFetchTime < CACHE_REFRESH_INTERVAL_MS)) {
      return this.cachedEmployees;
    }

    try {
      dbLogger('INFO', 'Refreshing employee embedding cache...');
      const employees = await this.employeeService.listEmployees();
      
      this.cachedEmployees = employees;
      this.lastFetchTime = now;
      
      dbLogger('INFO', `Cache refreshed: ${employees.length} employees loaded.`);
      return this.cachedEmployees;
    } catch (err) {
      dbLogger('ERROR', 'Failed to load employees from backend');
      throw new EmbeddingError('Could not sync employee embeddings from storage', err);
    }
  }

  /**
   * Clears the in-memory cache.
   * Should be called after a new enrollment.
   */
  clearCache(): void {
    this.cachedEmployees = [];
    this.lastFetchTime = 0;
    dbLogger('INFO', 'Employee embedding cache cleared.');
  }

  /**
   * Helper to get a single employee embedding from cache.
   */
  async getEmployeeEmbedding(employeeId: string): Promise<string | null> {
    const employees = await this.getEnrolledEmployees();
    const employee = employees.find(e => e.employee_id === employeeId);
    return employee ? employee.embedding : null;
  }
}
