import { getDB } from './index';
import { dbLogger, DatabaseError } from './types';

/**
 * Database Health Monitor & Integrity Verification
 * Purpose: Provide real-time status and verification of the database subsystem.
 * Responsibilities: Check connection, PRAGMAs, migration version, and physical integrity.
 */

export interface DatabaseHealthStatus {
  connected: boolean;
  foreignKeysEnabled: boolean;
  walEnabled: boolean;
  secureDeleteEnabled: boolean;
  tempStoreMemory: boolean;
  migrationVersion: number;
}

/**
 * Verifies the physical integrity of the database file.
 * Returns true if 'ok', otherwise throws DatabaseError.
 */
export async function verifyDatabaseIntegrity(): Promise<boolean> {
  try {
    const db = await getDB();
    const [results] = await db.executeSql('PRAGMA integrity_check;');
    const status = results.rows.item(0).integrity_check;

    if (status === 'ok') {
      dbLogger('INFO', 'Database Integrity Check: PASSED');
      return true;
    } else {
      throw new DatabaseError(`Database Integrity Check: FAILED with status: ${status}`);
    }
  } catch (err) {
    if (err instanceof DatabaseError) throw err;
    throw new DatabaseError('Database Integrity Check: EXCEPTION during execution', err);
  }
}

/**
 * Performs a comprehensive health check on the database subsystem.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  try {
    const db = await getDB();
    
    // 1. Check Foreign Keys
    const [fkResults] = await db.executeSql('PRAGMA foreign_keys;');
    const foreignKeysEnabled = fkResults.rows.item(0).foreign_keys === 1;

    // 2. Check Journal Mode
    const [walResults] = await db.executeSql('PRAGMA journal_mode;');
    const walEnabled = walResults.rows.item(0).journal_mode === 'wal';

    // 3. Check Secure Delete
    const [sdResults] = await db.executeSql('PRAGMA secure_delete;');
    const secureDeleteEnabled = sdResults.rows.item(0).secure_delete === 1;

    // 4. Check Temp Store
    const [tsResults] = await db.executeSql('PRAGMA temp_store;');
    const tempStoreMemory = tsResults.rows.item(0).temp_store === 2; // 2 = MEMORY

    // 5. Get Migration Version
    const [migResults] = await db.executeSql('SELECT MAX(version) as currentVersion FROM schema_migrations;');
    const migrationVersion = migResults.rows.item(0).currentVersion || 0;

    const status = {
      connected: true,
      foreignKeysEnabled,
      walEnabled,
      secureDeleteEnabled,
      tempStoreMemory,
      migrationVersion
    };

    dbLogger('INFO', `Health Check Result: ${JSON.stringify(status)}`);
    return status;
  } catch (err) {
    dbLogger('ERROR', `Health Check Failed: ${err instanceof Error ? err.message : String(err)}`);
    return {
      connected: false,
      foreignKeysEnabled: false,
      walEnabled: false,
      secureDeleteEnabled: false,
      tempStoreMemory: false,
      migrationVersion: -1
    };
  }
}
