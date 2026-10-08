import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BehaviorLogEntry, TelemetryCategory } from '../types';
import { DatabaseService } from './DatabaseService';
import { FEATURE_FLAGS } from '../config/featureFlags';

const TELEMETRY_ENDPOINT_KEY = 'jobsign_custom_telemetry_endpoint';

export class TelemetryService {
  private static sessionId: string = '';
  private static isInitialized = false;
  private static customEndpoint: string | null = null;
  private static flushInterval: any = null;

  public static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.sessionId = Crypto.randomUUID();

    try {
      const storedEndpoint = await AsyncStorage.getItem(TELEMETRY_ENDPOINT_KEY);
      this.customEndpoint = storedEndpoint || FEATURE_FLAGS.DEFAULT_TELEMETRY_ENDPOINT;
    } catch {
      this.customEndpoint = FEATURE_FLAGS.DEFAULT_TELEMETRY_ENDPOINT;
    }

    this.isInitialized = true;

    // Attach global JavaScript error listener
    this.attachGlobalErrorHandler();

    // Log session launch event
    await this.logEvent('APP_LIFECYCLE', 'APP_LAUNCH', 'APP', {
      platform: Platform.OS,
      osVersion: Platform.Version,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    });

    // Start auto flush loop if endpoint configured
    this.startAutoFlush();
  }

  public static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = Crypto.randomUUID();
    }
    return this.sessionId;
  }

  public static async getCustomEndpoint(): Promise<string> {
    if (this.customEndpoint !== null) return this.customEndpoint;
    try {
      const saved = await AsyncStorage.getItem(TELEMETRY_ENDPOINT_KEY);
      return saved || FEATURE_FLAGS.DEFAULT_TELEMETRY_ENDPOINT;
    } catch {
      return FEATURE_FLAGS.DEFAULT_TELEMETRY_ENDPOINT;
    }
  }

  public static async setCustomEndpoint(url: string): Promise<void> {
    this.customEndpoint = url.trim();
    await AsyncStorage.setItem(TELEMETRY_ENDPOINT_KEY, this.customEndpoint);
  }

  private static attachGlobalErrorHandler(): void {
    try {
      const globalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
      if ((globalThis as any).ErrorUtils) {
        (globalThis as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          TelemetryService.logError(
            isFatal ? 'FATAL_CRASH' : 'UNHANDLED_ERROR',
            error?.message || String(error),
            error?.stack
          );
          if (globalHandler) {
            globalHandler(error, isFatal);
          }
        });
      }
    } catch (e) {
      // Graceful fallback
    }
  }

  /**
   * Primary method to record any user behavior or system event.
   */
  public static async logEvent(
    category: TelemetryCategory,
    action: string,
    screenName?: string,
    payload?: Record<string, any>
  ): Promise<void> {
    if (!FEATURE_FLAGS.TELEMETRY_ENABLED) return;

    const entry: BehaviorLogEntry = {
      id: Crypto.randomUUID(),
      sessionId: this.getSessionId(),
      category,
      action,
      screenName,
      payloadJson: payload ? JSON.stringify(payload) : undefined,
      timestamp: Date.now(),
      synced: false,
    };

    if (FEATURE_FLAGS.CONSOLE_LOGS_ENABLED) {
      console.log(`[📊 Behavior][${category}] ${action}${screenName ? ` @ ${screenName}` : ''}`, payload || '');
    }

    if (FEATURE_FLAGS.OFFLINE_LOGGING_ENABLED) {
      try {
        await DatabaseService.saveBehaviorLog(entry);
      } catch (err) {
        console.warn('[TelemetryService] Failed to persist behavior log to SQLite:', err);
      }
    }
  }

  // --- Convenience Tracking Helpers ---

  public static async logScreenView(screenName: string, metadata?: Record<string, any>): Promise<void> {
    await this.logEvent('SCREEN_VIEW', `VIEW_${screenName}`, screenName, metadata);
  }

  public static async logAction(
    action: string,
    screenName?: string,
    payload?: Record<string, any>
  ): Promise<void> {
    await this.logEvent('USER_ACTION', action, screenName, payload);
  }

  public static async logJob(
    action: 'CREATED' | 'SIGNED' | 'PAID' | 'DELETED' | 'VIEWED' | 'FILTERED',
    quoteId: string,
    payload?: Record<string, any>
  ): Promise<void> {
    await this.logEvent('JOB_EVENT', `JOB_${action}`, undefined, {
      quoteId,
      ...payload,
    });
  }

  public static async logPDF(
    action: 'PREVIEW' | 'GENERATED' | 'SHARED',
    templateId: string,
    quoteId?: string,
    payload?: Record<string, any>
  ): Promise<void> {
    await this.logEvent('PDF_EVENT', `PDF_${action}`, undefined, {
      templateId,
      quoteId,
      ...payload,
    });
  }

  public static async logTax(action: string, payload?: Record<string, any>): Promise<void> {
    await this.logEvent('SETTINGS_CHANGE', `TAX_${action}`, 'SETTINGS', payload);
  }

  public static async logProfile(action: string, payload?: Record<string, any>): Promise<void> {
    await this.logEvent('SETTINGS_CHANGE', `PROFILE_${action}`, 'SETTINGS', payload);
  }

  public static async logError(errorName: string, errorMessage: string, stack?: string): Promise<void> {
    await this.logEvent('ERROR', errorName, undefined, {
      message: errorMessage,
      stack,
    });
  }

  // --- Remote Dispatch & Sync ---

  public static startAutoFlush(): void {
    if (this.flushInterval) return;
    this.flushInterval = setInterval(() => {
      this.flush().catch(() => {});
    }, 60000); // Check every 60s
  }

  public static stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Flushes unsynced logs to the configured remote endpoint (if online and endpoint available).
   */
  public static async flush(): Promise<{ sent: number; failed: number }> {
    const endpoint = await this.getCustomEndpoint();
    if (!endpoint || !endpoint.startsWith('http')) {
      return { sent: 0, failed: 0 };
    }

    try {
      const netState = await Network.getNetworkStateAsync();
      if (!netState.isConnected) return { sent: 0, failed: 0 };

      const unsynced = await DatabaseService.getUnsyncedBehaviorLogs(50);
      if (unsynced.length === 0) return { sent: 0, failed: 0 };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `JobSign-Mobile/1.0.0 (${Platform.OS})`,
        },
        body: JSON.stringify({
          batchSize: unsynced.length,
          sessionId: this.getSessionId(),
          timestamp: Date.now(),
          events: unsynced.map((u) => ({
            ...u,
            payload: u.payloadJson ? JSON.parse(u.payloadJson) : null,
          })),
        }),
      });

      if (response.ok) {
        const ids = unsynced.map((u) => u.id);
        await DatabaseService.markBehaviorLogsSynced(ids);
        return { sent: ids.length, failed: 0 };
      } else {
        return { sent: 0, failed: unsynced.length };
      }
    } catch (e) {
      return { sent: 0, failed: 0 };
    }
  }

  // --- Export and Inspection Helpers ---

  public static async getLogs(limit: number = 100): Promise<BehaviorLogEntry[]> {
    return DatabaseService.getBehaviorLogs(limit);
  }

  public static async getLogsCount(): Promise<number> {
    return DatabaseService.getBehaviorLogsCount();
  }

  public static async clearLogs(): Promise<void> {
    return DatabaseService.clearBehaviorLogs();
  }

  public static async exportLogsAsJSON(): Promise<string> {
    const logs = await DatabaseService.getBehaviorLogs(1000);
    const exportObject = {
      app: 'JobSign',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      sessionId: this.getSessionId(),
      totalEvents: logs.length,
      logs: logs.map((l) => ({
        ...l,
        timestampFormatted: new Date(l.timestamp).toISOString(),
        payload: l.payloadJson ? JSON.parse(l.payloadJson) : null,
      })),
    };
    return JSON.stringify(exportObject, null, 2);
  }

  public static async shareLogs(): Promise<void> {
    const jsonStr = await this.exportLogsAsJSON();
    const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
    const fileName = `jobsign_behavior_logs_${Date.now()}.json`;
    const filePath = `${cacheDir}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export JobSign User Behavior Logs',
        UTI: 'public.json',
      });
    }
  }
}
