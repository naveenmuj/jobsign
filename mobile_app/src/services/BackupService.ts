import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { DatabaseService } from './DatabaseService';
import { JobSignBackupPayload, BackupPreview, BackupSettings, Quote } from '../types';
import { TelemetryService } from './TelemetryService';

const getQuoteStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useQuoteStore } = require('../store/useQuoteStore');
  return useQuoteStore;
};

export const MASTER_BACKUP_FILENAME = 'JobSign_Master_Backup.json';
export const MASTER_BACKUP_BASENAME = 'JobSign_Master_Backup';

export class BackupService {
  private static isAutoBackingUp = false;

  /**
   * Builds the complete backup payload from SQLite database and Zustand store.
   */
  public static async exportBackupData(): Promise<JobSignBackupPayload> {
    await DatabaseService.checkpointWAL();
    const quotes = await DatabaseService.getAllQuotes();
    const storeState = getQuoteStore().getState();
    const profile = storeState.profile;
    const presets = storeState.presets;

    const totalRevenueCents = quotes.reduce((acc, q) => acc + (q.totalAmountCents || 0), 0);

    const payloadWithoutChecksum: Omit<JobSignBackupPayload, 'metadata'> & {
      metadata: Omit<JobSignBackupPayload['metadata'], 'checksum'>;
    } = {
      app: 'JobSign',
      schemaVersion: 1,
      exportedAt: Date.now(),
      appVersion: '1.0.0',
      devicePlatform: Platform.OS,
      contractorProfile: { ...profile },
      quotes,
      presets,
      metadata: {
        totalQuotes: quotes.length,
        businessName: profile.businessName || 'Solo Contractor',
        totalRevenueCents,
      },
    };

    const rawJson = JSON.stringify(payloadWithoutChecksum);
    let checksum = '';
    try {
      checksum = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawJson);
    } catch {
      checksum = `chk_${Date.now()}`;
    }

    return {
      ...payloadWithoutChecksum,
      metadata: {
        ...payloadWithoutChecksum.metadata,
        checksum,
      },
    };
  }

  /**
   * Saves the backup payload to the local device application vault.
   * STRICT SINGLE-FILE POLICY: Always overwrites the single master file in-place.
   * Zero duplicate or timestamped files are created.
   */
  public static async saveToLocalVault(
    payload: JobSignBackupPayload
  ): Promise<{ uri: string; filename: string; sizeBytes: number }> {
    const baseDir = FileSystem.documentDirectory || (FileSystem as any).cacheDirectory || '';
    const backupDir = baseDir.endsWith('/') ? `${baseDir}backups/` : `${baseDir}/backups/`;
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }

    const filename = MASTER_BACKUP_FILENAME;
    const fileUri = `${backupDir}${filename}`;
    const jsonStr = JSON.stringify(payload, null, 2);

    // Overwrite the single master file in-place
    await FileSystem.writeAsStringAsync(fileUri, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Also keep latest_backup.json synced for backward compatibility
    const latestUri = `${backupDir}latest_backup.json`;
    await FileSystem.writeAsStringAsync(latestUri, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const sizeBytes = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : jsonStr.length;

    return { uri: fileUri, filename, sizeBytes };
  }

  /**
   * Automatically executes a backup on invoice creation/update if auto-backup is enabled.
   * Runs non-blockingly to guarantee zero UI latency.
   * STRICT SINGLE-FILE POLICY:
   * - Local vault: Overwrites JobSign_Master_Backup.json in-place.
   * - Cloud Drive (Google Drive/OneDrive): Overwrites the single JobSign_Master_Backup file in-place.
   * Never creates duplicate files or requires manual clicks.
   */
  public static async performAutoBackup(triggerReason: string = 'NEW_INVOICE'): Promise<boolean> {
    if (this.isAutoBackingUp) return false;
    this.isAutoBackingUp = true;

    try {
      const storeState = getQuoteStore().getState();
      const rawSettings = storeState.profile.backupSettings;
      const settings: BackupSettings = rawSettings || {
        autoBackupEnabled: true,
        backupTarget: 'LOCAL_VAULT',
      };

      // Only skip automated triggers if user explicitly turned it off
      if (triggerReason !== 'MANUAL_USER_REQUEST' && settings.autoBackupEnabled === false) {
        this.isAutoBackingUp = false;
        return false;
      }

      console.log(`[BackupService] Starting auto-backup triggered by ${triggerReason} (single-file sync)...`);
      const payload = await this.exportBackupData();
      const localResult = await this.saveToLocalVault(payload);

      let savedToDrive = false;
      let driveMasterFileUri = settings.driveMasterFileUri;

      // If user linked a Google Drive / OneDrive SAF folder on Android
      if (Platform.OS === 'android' && settings.driveFolderUri) {
        try {
          const saf = FileSystem.StorageAccessFramework;
          if (saf) {
            const jsonStr = JSON.stringify(payload, null, 2);
            let writeSuccess = false;

            // 1. If we already have a cached master file URI, overwrite directly in-place
            if (driveMasterFileUri) {
              try {
                await saf.writeAsStringAsync(driveMasterFileUri, jsonStr);
                writeSuccess = true;
                savedToDrive = true;
                console.log(`[BackupService] Auto-backup overwritten in-place at cached Drive URI: ${driveMasterFileUri}`);
              } catch (writeErr) {
                console.warn('[BackupService] Cached Drive master file write failed, will re-discover:', writeErr);
                driveMasterFileUri = undefined;
              }
            }

            // 2. If direct write didn't succeed, scan Drive folder for existing master file
            if (!writeSuccess) {
              try {
                const files = await saf.readDirectoryAsync(settings.driveFolderUri);
                const foundUri = files.find((uri: string) => {
                  const decoded = decodeURIComponent(uri);
                  return (
                    decoded.includes(MASTER_BACKUP_BASENAME) ||
                    decoded.endsWith(MASTER_BACKUP_FILENAME)
                  );
                });

                if (foundUri) {
                  driveMasterFileUri = foundUri;
                  await saf.writeAsStringAsync(driveMasterFileUri, jsonStr);
                  writeSuccess = true;
                  savedToDrive = true;
                  console.log(`[BackupService] Found and overwritten existing Drive master backup: ${driveMasterFileUri}`);
                }
              } catch (readDirErr) {
                console.warn('[BackupService] Reading Drive directory failed:', readDirErr);
              }
            }

            // 3. If file does not exist yet in cloud folder, create it once as JobSign_Master_Backup
            if (!writeSuccess) {
              try {
                const mimeType = 'application/json';
                driveMasterFileUri = await saf.createFileAsync(settings.driveFolderUri, MASTER_BACKUP_BASENAME, mimeType);
                await saf.writeAsStringAsync(driveMasterFileUri, jsonStr);
                writeSuccess = true;
                savedToDrive = true;
                console.log(`[BackupService] Created initial master backup in Cloud Drive: ${driveMasterFileUri}`);
              } catch (createErr) {
                console.error('[BackupService] Creating initial master backup in Cloud Drive failed:', createErr);
              }
            }
          }
        } catch (safErr) {
          console.warn('[BackupService] Cloud Drive SAF write failed, falling back to local vault:', safErr);
        }
      }

      // Update backup stats in store
      const updatedSettings: BackupSettings = {
        ...settings,
        driveMasterFileUri: driveMasterFileUri || settings.driveMasterFileUri,
        lastBackupTimestamp: payload.exportedAt,
        lastBackupInvoiceCount: payload.quotes.length,
        lastBackupSizeBytes: localResult.sizeBytes,
      };

      storeState.updateProfile({
        backupSettings: updatedSettings,
      });

      TelemetryService.logEvent('SETTINGS_CHANGE', 'auto_backup_completed', 'BACKUP_SERVICE', {
        trigger: triggerReason,
        invoiceCount: payload.quotes.length,
        sizeBytes: localResult.sizeBytes,
        savedToDrive,
        singleFileOverwrite: true,
      });

      console.log(`[BackupService] Auto-backup completed successfully (${payload.quotes.length} invoices in single master file).`);
      return true;
    } catch (err) {
      console.error('[BackupService] Auto-backup failed:', err);
      return false;
    } finally {
      this.isAutoBackingUp = false;
    }
  }

  /**
   * Prompts user with native Android Storage Access Framework (SAF) folder picker
   * to select any Google Drive, OneDrive, or device folder for automatic synchronization.
   */
  public static async pickDriveFolder(): Promise<{ uri: string; name: string } | null> {
    if (Platform.OS !== 'android') return null;

    try {
      const saf = FileSystem.StorageAccessFramework;
      if (!saf) return null;

      const permission = await saf.requestDirectoryPermissionsAsync();
      if (!permission.granted || !permission.directoryUri) {
        return null;
      }

      // Decode friendly folder name from SAF URI
      let folderName = 'Cloud / Local Drive Folder';
      try {
        const decodedUri = decodeURIComponent(permission.directoryUri);
        if (decodedUri.includes('com.google.android.apps.docs')) {
          folderName = 'Google Drive / JobSign';
        } else if (decodedUri.includes('onedrive')) {
          folderName = 'Microsoft OneDrive';
        } else {
          const parts = decodedUri.split(/[:/]/);
          const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
          if (lastPart) folderName = `📁 ${lastPart}`;
        }
      } catch {
        folderName = 'Selected Cloud Folder';
      }

      return {
        uri: permission.directoryUri,
        name: folderName,
      };
    } catch (err) {
      console.error('[BackupService] Error picking drive folder:', err);
      return null;
    }
  }

  /**
   * Triggers system share sheet to save or send the backup file to Google Drive, OneDrive,
   * WhatsApp, Gmail, or local Files app.
   */
  public static async shareBackupFile(): Promise<{ uri: string; sizeBytes: number }> {
    const payload = await this.exportBackupData();
    const localResult = await this.saveToLocalVault(payload);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localResult.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save / Sync JobSign Backup to Drive or Files',
      });
    }

    const storeState = getQuoteStore().getState();
    const settings = storeState.profile.backupSettings;
    storeState.updateProfile({
      backupSettings: {
        ...(settings || { autoBackupEnabled: true, backupTarget: 'SHARE_SHEET' }),
        lastBackupTimestamp: payload.exportedAt,
        lastBackupInvoiceCount: payload.quotes.length,
        lastBackupSizeBytes: localResult.sizeBytes,
      },
    });

    return { uri: localResult.uri, sizeBytes: localResult.sizeBytes };
  }

  /**
   * Helper to parse, validate, and summarize a JobSign backup payload string.
   */
  public static parseAndValidatePayload(rawContent: string): BackupPreview {
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error('The selected file is not a valid JSON document.');
    }

    // Validate schema & required application fields
    if (!parsed || parsed.app !== 'JobSign' || !Array.isArray(parsed.quotes)) {
      throw new Error('Invalid JobSign backup file format. Missing required invoice records.');
    }

    if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion < 1) {
      throw new Error('Unsupported backup schema version. Please update JobSign to the latest version.');
    }

    // Validate quote records data integrity
    const quotes: Quote[] = parsed.quotes;
    for (const q of quotes) {
      if (!q.id || typeof q.quoteNumber !== 'string' || typeof q.totalAmountCents !== 'number') {
        throw new Error(`Backup file contains corrupted quote record (${q.quoteNumber || 'unknown'}).`);
      }
      if (q.totalAmountCents < 0) {
        throw new Error(`Backup contains invalid negative pricing in quote #${q.quoteNumber}.`);
      }
    }

    const totalRevenueCents = quotes.reduce((acc: number, q: Quote) => acc + (q.totalAmountCents || 0), 0);

    return {
      valid: true,
      businessName: parsed.contractorProfile?.businessName || parsed.metadata?.businessName || 'Solo Contractor',
      invoiceCount: quotes.length,
      presetCount: Array.isArray(parsed.presets) ? parsed.presets.length : 0,
      exportedAt: parsed.exportedAt || Date.now(),
      appVersion: parsed.appVersion || '1.0.0',
      totalRevenueCents,
      currencySymbol: parsed.contractorProfile?.currencySymbol || '₹',
      payload: parsed as JobSignBackupPayload,
    };
  }

  /**
   * Directly inspects the device's single local master backup file.
   * Enables instant 1-tap restore without picking files manually.
   */
  public static async inspectLocalMasterBackup(): Promise<BackupPreview | null> {
    try {
      const baseDir = FileSystem.documentDirectory || (FileSystem as any).cacheDirectory || '';
      const backupDir = baseDir.endsWith('/') ? `${baseDir}backups/` : `${baseDir}/backups/`;

      const masterUri = `${backupDir}${MASTER_BACKUP_FILENAME}`;
      const masterInfo = await FileSystem.getInfoAsync(masterUri);
      if (masterInfo.exists) {
        const rawContent = await FileSystem.readAsStringAsync(masterUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return this.parseAndValidatePayload(rawContent);
      }

      const latestUri = `${backupDir}latest_backup.json`;
      const latestInfo = await FileSystem.getInfoAsync(latestUri);
      if (latestInfo.exists) {
        const rawContent = await FileSystem.readAsStringAsync(latestUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return this.parseAndValidatePayload(rawContent);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Launches native document picker so the user can pick a backup file (.json)
   * from Google Drive, OneDrive, or device downloads. Validates contents and returns preview.
   */
  public static async pickAndInspectBackupFile(): Promise<
    { cancelled: true } | { cancelled: false; preview: BackupPreview }
  > {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { cancelled: true };
      }

      const file = result.assets[0];
      const rawContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const preview = this.parseAndValidatePayload(rawContent);
      return { cancelled: false, preview };
    } catch (err: any) {
      throw new Error(err?.message || 'Could not inspect backup file.');
    }
  }

  /**
   * Restores data from a validated backup payload into SQLite and Zustand store.
   * Supports 'REPLACE' (disaster recovery / fresh install) or 'MERGE' (add missing invoices).
   */
  public static async restoreFromPayload(
    payload: JobSignBackupPayload,
    mode: 'REPLACE' | 'MERGE' = 'REPLACE'
  ): Promise<{ restoredQuotes: number; restoredPresets: number }> {
    console.log(`[BackupService] Restoring backup in ${mode} mode...`);

    // 1. Restore SQLite database quotes, line items, and change orders
    const restoredQuotes = await DatabaseService.restoreQuotes(payload.quotes, mode === 'REPLACE');
    await DatabaseService.checkpointWAL();

    const storeState = getQuoteStore().getState();

    // 2. Restore Profile
    if (mode === 'REPLACE') {
      if (payload.contractorProfile) {
        storeState.updateProfile({
          ...payload.contractorProfile,
          isOnboardingCompleted: true,
        });
      }
    } else {
      // In merge mode, preserve existing profile unless business name is empty
      if (!storeState.profile.hasCustomBusinessName && payload.contractorProfile) {
        storeState.updateProfile({
          ...payload.contractorProfile,
          isOnboardingCompleted: true,
        });
      }
    }

    // 3. Restore Presets
    let restoredPresets = 0;
    if (Array.isArray(payload.presets) && payload.presets.length > 0) {
      if (mode === 'REPLACE') {
        getQuoteStore().setState({ presets: payload.presets });
        restoredPresets = payload.presets.length;
      } else {
        const existingIds = new Set(storeState.presets.map((p: any) => p.title.toLowerCase()));
        const toAdd = payload.presets.filter((p: any) => !existingIds.has(p.title.toLowerCase()));
        getQuoteStore().setState({ presets: [...storeState.presets, ...toAdd] });
        restoredPresets = toAdd.length;
      }
    }

    // 4. Reload quotes into Zustand store
    await storeState.loadQuotes();

    TelemetryService.logEvent('SETTINGS_CHANGE', 'backup_restored', 'BACKUP_SERVICE', {
      mode,
      restoredQuotes,
      restoredPresets,
    });

    console.log(`[BackupService] Restore finished: ${restoredQuotes} quotes restored.`);
    return { restoredQuotes, restoredPresets };
  }
}
