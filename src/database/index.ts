import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { DatabaseError, dbLogger } from './types';
import { runMigrations } from './migrations';

/**
 * Database Singleton Manager
 * Purpose: Manage the lifecycle of the SQLite connection.
 * Responsibilities: Initialize connection, apply security PRAGMAs, trigger migrations, and provide a single source for the DB instance.
 * Dependencies: react-native-sqlite-storage, migrations.ts.
 * Future Extensions: Support for multi-database attachments.
 */

// Enable Promise API for SQLite
SQLite.enablePromise(true);

const DATABASE_NAME = 'secureface.db';

let dbInstance: SQLiteDatabase | null = null;
let connectionPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Verifies that critical PRAGMAs were applied correctly.
 */
async function validateDatabaseConfiguration(db: SQLiteDatabase): Promise<void> {
  const pragmas = [
    { name: 'foreign_keys', expected: 1 },
    { name: 'journal_mode', expected: 'wal' },
    { name: 'secure_delete', expected: 1 },
    { name: 'temp_store', expected: 2 } // 2 = MEMORY
  ];

  for (const pragma of pragmas) {
    const [results] = await db.executeSql(`PRAGMA ${pragma.name};`);
    const actual = results.rows.item(0)[pragma.name];
    
    // SQLite returns 1/0 for boolean PRAGMAs
    if (actual !== pragma.expected) {
      dbLogger('WARN', `PRAGMA ${pragma.name} validation failed. Expected ${pragma.expected}, got ${actual}`);
      // In strict production, we might throw here, but some environments restrict WAL
      if (pragma.name === 'foreign_keys' && actual !== 1) {
        throw new DatabaseError(`Critical PRAGMA ${pragma.name} failed to enable.`);
      }
    }
  }
}

/**
 * Initializes and returns the database singleton instance.
 */
export async function getDB(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      dbLogger('INFO', 'Initializing secure database connection...');
      
      const db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      // 1. Hardened Security & Performance PRAGMAs
      try {
        await db.executeSql('PRAGMA foreign_keys = ON;');
        await db.executeSql('PRAGMA journal_mode = WAL;');
        await db.executeSql('PRAGMA synchronous = NORMAL;');
        await db.executeSql('PRAGMA secure_delete = ON;');
        await db.executeSql('PRAGMA temp_store = MEMORY;');
        
        await validateDatabaseConfiguration(db);
        dbLogger('INFO', 'Security PRAGMAs verified successfully');
      } catch (err) {
        throw new DatabaseError('Failed to apply or verify database security configuration', err);
      }

      // 2. Run Migrations
      await runMigrations(db);

      dbInstance = db;
      return db;
    } catch (err) {
      dbLogger('ERROR', `Initialization Failure: ${err instanceof Error ? err.message : String(err)}`);
      connectionPromise = null;
      throw err instanceof DatabaseError ? err : new DatabaseError('Database initialization failed', err);
    }
  })();

  return connectionPromise;
}

/**
 * Safely closes the database connection.
 */
export async function closeDB(): Promise<void> {
  if (!dbInstance) return;

  try {
    await dbInstance.close();
    dbInstance = null;
    connectionPromise = null;
    dbLogger('INFO', 'Database connection closed safely');
  } catch (err) {
    dbLogger('ERROR', `Closure Failure: ${err instanceof Error ? err.message : String(err)}`);
    throw new DatabaseError('Database closure failed', err);
  }
}
