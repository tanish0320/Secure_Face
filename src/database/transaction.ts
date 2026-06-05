import { SQLiteDatabase, Transaction } from 'react-native-sqlite-storage';
import { TransactionError, dbLogger } from './types';

/**
 * Transaction Helper
 * Purpose: Provide a safe, Promise-based wrapper for SQLite transactions.
 * Responsibilities: Handle BEGIN, COMMIT, and ROLLBACK logic.
 */

/**
 * Executes a set of operations within a single SQL transaction.
 * Uses a Promise-based wrapper to bridge the native callback API.
 * 
 * SAFETY AUDIT:
 * In react-native-sqlite-storage, using 'async' inside db.transaction is safe AS LONG AS
 * the transaction callback does not conclude before all desired async SQL operations are queued.
 * 
 * We use an 'isDone' flag and an explicit Promise to prevent:
 * 1. Double resolution/rejection if the success/error callbacks fire unexpectedly.
 * 2. Premature resolution before the database has finalized the commit.
 */
export async function executeTransaction<T>(
  db: SQLiteDatabase,
  callback: (tx: Transaction) => Promise<T> | T
): Promise<T> {
  let result: T;
  let isDone = false;

  return new Promise((resolve, reject) => {
    db.transaction(
      async (tx) => {
        try {
          result = await callback(tx);
        } catch (err) {
          if (!isDone) {
            isDone = true;
            reject(new TransactionError('Logic failure within transaction', err));
          }
        }
      },
      (error) => {
        if (!isDone) {
          isDone = true;
          dbLogger('ERROR', `Transaction Rollback: ${error.message}`);
          reject(new TransactionError('Transaction failed to commit and was rolled back', error));
        }
      },
      () => {
        // Success callback (Committed)
        if (!isDone) {
          isDone = true;
          dbLogger('INFO', 'Transaction Committed Successfully');
          resolve(result);
        }
      }
    );
  });
}
