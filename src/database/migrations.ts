import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Migration, MigrationError, dbLogger } from './types';
import { SCHEMA } from './schema';

/**
 * Migration Engine
 * Purpose: Handle database schema versioning and updates.
 * Responsibilities: Run migrations in order, track applied versions, and ensure atomicity.
 * Dependencies: react-native-sqlite-storage, schema.ts.
 * Future Extensions: Migration rollbacks (if needed), migration checksums.
 */

const migrations: Migration[] = [
  {
    version: 1,
    name: 'Initial Schema',
    statements: [
      SCHEMA.TABLES.EMPLOYEES,
      SCHEMA.TABLES.ATTENDANCE,
      SCHEMA.TABLES.AUDIT_LOGS,
      SCHEMA.INDEXES.ATTENDANCE_EMPLOYEE,
      SCHEMA.INDEXES.ATTENDANCE_SYNC_STATUS,
      SCHEMA.INDEXES.ATTENDANCE_TIMESTAMP,
      SCHEMA.INDEXES.AUDIT_EMPLOYEE,
      SCHEMA.INDEXES.AUDIT_TIMESTAMP
    ]
  },
  {
    version: 2,
    name: 'Harden Foreign Keys',
    statements: [
      // SQLite does not support ALTER TABLE to change FK constraints.
      // Strategy: Rename, Recreate, Copy, Drop.
      `ALTER TABLE attendance RENAME TO attendance_old;`,
      SCHEMA.TABLES.ATTENDANCE, // Recreates with CASCADE
      `INSERT INTO attendance (id, employee_id, timestamp, gps, recognition_score, liveness_score, sync_status)
       SELECT id, employee_id, timestamp, gps, recognition_score, liveness_score, sync_status FROM attendance_old;`,
      `DROP TABLE attendance_old;`,
      SCHEMA.INDEXES.ATTENDANCE_EMPLOYEE,
      SCHEMA.INDEXES.ATTENDANCE_SYNC_STATUS,
      SCHEMA.INDEXES.ATTENDANCE_TIMESTAMP
    ]
  },
  {
    version: 3,
    name: 'Audit Log Sync Lifecycle',
    statements: [
      `ALTER TABLE audit_logs ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending';`
    ]
  }
];

/**
 * Ensures schema_migrations table is up to date with new columns
 */
async function upgradeMigrationTable(db: SQLiteDatabase): Promise<void> {
  // Check if name column exists
  const [results] = await db.executeSql("PRAGMA table_info(schema_migrations);");
  let hasName = false;
  let hasExecTime = false;
  
  for (let i = 0; i < results.rows.length; i++) {
    const col = results.rows.item(i);
    if (col.name === 'name') hasName = true;
    if (col.name === 'execution_time_ms') hasExecTime = true;
  }

  if (!hasName) {
    await db.executeSql("ALTER TABLE schema_migrations ADD COLUMN name TEXT NOT NULL DEFAULT 'unknown';");
  }
  if (!hasExecTime) {
    await db.executeSql("ALTER TABLE schema_migrations ADD COLUMN execution_time_ms INTEGER NOT NULL DEFAULT 0;");
  }
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  dbLogger('INFO', 'Migration Started');

  try {
    // 1. Initialize or Upgrade Migration Table
    await db.executeSql(SCHEMA.TABLES.MIGRATIONS);
    await upgradeMigrationTable(db);

    // 2. Get currently applied version
    const [results] = await db.executeSql(
      'SELECT MAX(version) as currentVersion FROM schema_migrations'
    );
    const currentVersion = results.rows.item(0).currentVersion || 0;
    
    // 3. Filter pending migrations
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      dbLogger('INFO', 'No pending migrations');
      return;
    }

    // 4. Run each migration in its own transaction
    for (const migration of pendingMigrations) {
      dbLogger('INFO', `Applying migration version ${migration.version}: ${migration.name}`);
      const startTime = Date.now();

      await new Promise<void>((resolve, reject) => {
        db.transaction(async (tx) => {
          try {
            for (const statement of migration.statements) {
              await tx.executeSql(statement);
            }

            const executionTime = Date.now() - startTime;
            
            // Validate that we reached the end of statements before recording
            dbLogger('INFO', `Migration Validation Passed for version ${migration.version}`);

            await tx.executeSql(
              'INSERT INTO schema_migrations (version, name, applied_at, execution_time_ms) VALUES (?, ?, ?, ?)',
              [migration.version, migration.name, new Date().toISOString(), executionTime]
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        }, (error) => {
          dbLogger('ERROR', `Migration Failed at version ${migration.version}: ${error.message}`);
          reject(new MigrationError(`Failed to apply migration ${migration.version}`, error));
        }, () => {
          dbLogger('INFO', `Migration Applied: ${migration.name}`);
        });
      });
    }
    
    dbLogger('INFO', 'All migrations completed successfully');
  } catch (err) {
    if (err instanceof MigrationError) throw err;
    throw new MigrationError('Migration execution failed', err);
  }
}
