/**
 * SecureFace Edge AI - Audit Types
 */

export interface AuditRecord {
  id: string;
  employee_id: string | null;
  action: string;
  status: string;
  reason: string | null;
  timestamp: string;
}
