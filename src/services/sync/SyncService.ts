/**
 * SecureFace Edge AI - Sync Service
 * Purpose: Orchestrate offline-first data synchronization.
 * Responsibilities: Connectivity checks, Data retrieval, Upload orchestration, Retry logic, and Persistence updates.
 */

import { attendanceRepository } from '../../repositories/attendanceRepository';
import { auditRepository } from '../../repositories/auditRepository';
import { ConnectivityMonitor } from './ConnectivityMonitor';
import { uploadAttendance } from '../../api/attendanceApi';
import { uploadAuditLogs } from '../../api/auditApi';
import { validateSyncPayload } from './SyncValidator';
import { SyncResult, SyncStatistics, SyncConfigurationStatus } from './SyncTypes';
import { ConnectivityError, UploadFailureError, SyncServiceError } from './SyncErrors';
import { EncryptionService } from '../../security/encryptionService';
import { dbLogger } from '../../database/types';

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

export class SyncService {
  /**
   * Synchronizes all pending local data with the remote server.
   * Requirement: Mark as synced only if BOTH attendance and audit logs succeed.
   */
  async syncPending(): Promise<SyncResult> {
    try {
      // 1. Check Connectivity
      const online = await ConnectivityMonitor.isOnline();
      if (!online) {
        throw new ConnectivityError('Device is currently offline.');
      }

      // 2. Load Pending Data
      const pendingAttendance = await attendanceRepository.getPending();
      const pendingAuditLogs = await auditRepository.getPending();

      // 3. Validate Payload
      validateSyncPayload({
        attendance: pendingAttendance,
        auditLogs: pendingAuditLogs
      });

      // 4. Upload Attendance with Retry
      let attendanceSuccess = false;
      if (pendingAttendance.length > 0) {
        attendanceSuccess = await this.retryUpload(
          () => uploadAttendance(pendingAttendance),
          'Attendance'
        );
      } else {
        attendanceSuccess = true;
      }

      // 5. Upload Audit Logs with Retry
      let auditSuccess = false;
      if (pendingAuditLogs.length > 0) {
        auditSuccess = await this.retryUpload(
          () => uploadAuditLogs(pendingAuditLogs),
          'Audit'
        );
      } else {
        auditSuccess = true;
      }

      // 6. Final Sync Success Policy (Issue 2)
      // Mark as synced locally ONLY if both uploads were successful
      if (attendanceSuccess && auditSuccess) {
        // Attendance Persistence Update
        if (pendingAttendance.length > 0) {
          const attendanceIds = pendingAttendance.map(a => a.id);
          await attendanceRepository.markSynced(attendanceIds);
          
          // Issue 5: Sync Consistency Validation
          const syncedCount = await attendanceRepository.countBySyncStatus('synced');
          // (Basic validation - just an info log as requested)
          dbLogger('INFO', `Sync Consistency Check: Marked ${attendanceIds.length} records as synced.`);
        }

        // Audit Persistence Update (Issue 1)
        if (pendingAuditLogs.length > 0) {
          const auditIds = pendingAuditLogs.map(a => a.id);
          await auditRepository.markSynced(auditIds);
        }

        dbLogger('INFO', `Sync Success: ${pendingAttendance.length} Attendance, ${pendingAuditLogs.length} Audits`);

        return {
          success: true,
          uploadedAttendance: pendingAttendance.length,
          uploadedAuditLogs: pendingAuditLogs.length,
          failedRecords: 0
        };
      } else {
        // If either failed, we don't mark anything synced and throw error
        const failedModule = !attendanceSuccess ? 'Attendance' : 'Audit';
        throw new UploadFailureError(`Sync failure: ${failedModule} module failed to upload after retries.`);
      }

    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      dbLogger('ERROR', `Sync Failed: ${reason}`);
      
      if (err instanceof ConnectivityError || err instanceof SyncServiceError) {
        throw err;
      }
      throw new SyncServiceError('Synchronization failed due to unexpected error', err);
    }
  }

  /**
   * Retries an upload function with exponential backoff.
   * Issue 6: Improved retry telemetry.
   */
  private async retryUpload(
    uploadFn: () => Promise<{ success: boolean }>,
    label: string
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { success } = await uploadFn();
        if (success) return true;
        
        dbLogger('WARN', `${label} Upload Attempt ${attempt}/${MAX_RETRIES} failed.`);
      } catch (err) {
        dbLogger('ERROR', `${label} Upload Attempt ${attempt}/${MAX_RETRIES} exception: ${err}`);
      }

      if (attempt < MAX_RETRIES) {
        const delay = BACKOFF_MS[attempt - 1];
        dbLogger('INFO', `Retry Attempt ${attempt + 1}/${MAX_RETRIES} | Retry Delay ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    dbLogger('ERROR', `${label} Upload Failed After ${MAX_RETRIES} Attempts`);
    return false;
  }

  /**
   * Attempts an automatic sync if connected and pending data exists.
   * Issue 7: Improved Auto-Sync diagnostics.
   */
  async attemptAutoSync(): Promise<void> {
    try {
      const online = await ConnectivityMonitor.isOnline();
      if (!online) {
        dbLogger('INFO', 'Auto Sync Skipped (Offline)');
        return;
      }

      const pendingAttendance = await attendanceRepository.countBySyncStatus('pending');
      const pendingAudits = await auditRepository.getPending(); // Using list for audits as fallback
      
      if (pendingAttendance > 0 || pendingAudits.length > 0) {
        dbLogger('INFO', 'Auto Sync Triggered: Pending records found.');
        await this.syncPending();
      } else {
        dbLogger('INFO', 'Auto Sync Skipped (No Pending Records)');
      }
    } catch (err) {
      dbLogger('WARN', `Auto Sync attempt failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Returns synchronization statistics.
   */
  async getSyncStatistics(): Promise<SyncStatistics> {
    try {
      const [pending, total] = await Promise.all([
        attendanceRepository.countBySyncStatus('pending'),
        attendanceRepository.countAttendance()
      ]);

      return {
        pendingAttendance: pending,
        syncedAttendance: total - pending,
        totalAttendance: total
      };
    } catch (err) {
      throw new SyncServiceError('Failed to retrieve sync statistics', err);
    }
  }

  /**
   * Performs startup diagnostics for the sync service.
   * Issue 4: Expanded diagnostics report.
   */
  async validateSyncConfiguration(): Promise<SyncConfigurationStatus & { diagnosticsPassed: boolean }> {
    let connectivityReady = false;
    let repositoriesReady = false;
    let diagnosticsPassed = false;

    try {
      const isOnline = await ConnectivityMonitor.isOnline();
      const info = await ConnectivityMonitor.getConnectionInfo();
      connectivityReady = true;
      dbLogger('INFO', `Connectivity Diagnostic: Online=${isOnline}, Type=${info.connectionType}`);
    } catch (err) {
      connectivityReady = false;
    }

    try {
      const attCount = await attendanceRepository.countAttendance();
      await attendanceRepository.countBySyncStatus('pending');
      const auditCount = await auditRepository.countAuditLogs();
      repositoriesReady = true;
      dbLogger('INFO', `Repository Diagnostic: Attendance=${attCount}, Audits=${auditCount}`);
    } catch (err) {
      repositoriesReady = false;
    }

    const attendanceApiReady = typeof uploadAttendance === 'function';
    const auditApiReady = typeof uploadAuditLogs === 'function';

    diagnosticsPassed = connectivityReady && repositoriesReady && attendanceApiReady && auditApiReady;

    return {
      connectivityReady,
      attendanceApiReady,
      auditApiReady,
      repositoriesReady,
      diagnosticsPassed
    };
  }
}
