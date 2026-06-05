/**
 * SecureFace Edge AI - Database Schema
 * Purpose: Define the source of truth for the database structure.
 * Responsibilities: Maintain SQL strings for tables, indexes, and triggers.
 * Dependencies: None.
 * Future Extensions: Add support for views and virtual tables (FTS5).
 */

export const SCHEMA = {
  TABLES: {
    MIGRATIONS: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        execution_time_ms INTEGER NOT NULL DEFAULT 0
      );
    `,
    EMPLOYEES: `
      CREATE TABLE IF NOT EXISTS employees (
        employee_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `,
    ATTENDANCE: `
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        gps TEXT NOT NULL,
        recognition_score REAL,
        liveness_score REAL,
        sync_status TEXT NOT NULL CHECK (
            sync_status IN ('pending','synced')
        ),
        FOREIGN KEY(employee_id)
            REFERENCES employees(employee_id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
      );
    `,
    AUDIT_LOGS: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        timestamp TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (
            sync_status IN ('pending','synced')
        )
      );
    `
  },
  INDEXES: {
    ATTENDANCE_EMPLOYEE: `CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);`,
    ATTENDANCE_SYNC_STATUS: `CREATE INDEX IF NOT EXISTS idx_attendance_sync_status ON attendance(sync_status);`,
    ATTENDANCE_TIMESTAMP: `CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);`,
    AUDIT_EMPLOYEE: `CREATE INDEX IF NOT EXISTS idx_audit_employee ON audit_logs(employee_id);`,
    AUDIT_TIMESTAMP: `CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);`
  }
};
