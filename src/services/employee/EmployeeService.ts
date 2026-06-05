import type { EmployeeRecord } from '../../types';

/**
 * Mock Employee service – provides enrollment and list endpoints.
 * In a production app this would call a backend API. Here we simulate
 * successful enrollment and return an empty list for queries.
 */
export const employeeService = {
  async enrollEmployee(payload: {
    employeeId: string;
    name: string;
    images: any[]; // ImageData[] – ignored in the mock
  }): Promise<EmployeeRecord> {
    // Simulate generating an embedding – here a static placeholder string.
    const embedding = '';
    return {
      employee_id: payload.employeeId,
      name: payload.name,
      embedding,
      created_at: new Date().toISOString(),
    };
  },

  async listEmployees(): Promise<EmployeeRecord[]> {
    // No persistence in the mock – return empty array.
    return [];
  },
};
