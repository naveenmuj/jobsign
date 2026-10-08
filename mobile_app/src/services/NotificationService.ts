import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQuoteStore } from '../store/useQuoteStore';
import { TelemetryService } from './TelemetryService';
import { Quote } from '../types';

export class NotificationService {
  private static isInitialized = false;
  private static hasPermission = false;
  private static recentAlertsCache = new Set<string>();

  /**
   * Initializes notification channels and handlers.
   */
  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    // Configure foreground presentation behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      try {
        // Channel 1: Outbox Sync
        await Notifications.setNotificationChannelAsync('outbox_sync', {
          name: 'Offline Outbox Delivery',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D97706',
          description: 'Alerts when offline contracts are automatically delivered upon reconnection.',
        });

        // Channel 2: Job Legal Seals
        await Notifications.setNotificationChannelAsync('job_seals', {
          name: 'Seal & Signature Confirmations',
          importance: Notifications.AndroidImportance.DEFAULT,
          lightColor: '#2563EB',
          description: 'Instant confirmation when client signs and SHA-256 seal locks.',
        });

        // Channel 3: Payment Follow-up Reminders
        await Notifications.setNotificationChannelAsync('payment_reminders', {
          name: 'Payment & Follow-up Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          lightColor: '#10B981',
          description: 'Polite, non-spammy reminders for uncollected approved estimates.',
        });
      } catch (err) {
        console.warn('[NotificationService] Channel setup note:', err);
      }
    }

    // Check / request permission gracefully
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      this.hasPermission = finalStatus === 'granted';
    } catch {
      this.hasPermission = false;
    }

    this.isInitialized = true;
  }

  /**
   * Anti-spam debounce check: ensures we don't spam duplicate alerts within a session.
   */
  private static shouldTrigger(key: string): boolean {
    if (this.recentAlertsCache.has(key)) return false;
    this.recentAlertsCache.add(key);
    setTimeout(() => {
      this.recentAlertsCache.delete(key);
    }, 60000); // 1 minute throttle per event
    return true;
  }

  /**
   * Notification 1: Agreement legally signed & locked with cryptographic seal.
   */
  public static async notifySealCompleted(
    quoteNumber: number,
    clientName: string,
    totalAmountCents: number
  ): Promise<void> {
    const prefs = useQuoteStore.getState().profile.notificationPreferences;
    if (prefs && !prefs.sealConfirmations) return;

    const cacheKey = `seal_${quoteNumber}`;
    if (!this.shouldTrigger(cacheKey)) return;

    const profile = useQuoteStore.getState().profile;
    const curSymbol = profile?.currencySymbol || '$';
    const amountStr = `${curSymbol}${(totalAmountCents / 100).toFixed(2)}`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Agreement Legally Sealed 🛡️',
          body: `Estimate #${quoteNumber} for ${clientName} (${amountStr}) is locked with SHA-256 seal. Courtroom audit certificate is ready.`,
          data: { quoteNumber, type: 'SEAL_COMPLETED' },
          sound: true,
          channelId: 'job_seals',
        } as any,
        trigger: null, // Send immediately
      });

      TelemetryService.logAction('NOTIFICATION_SENT', undefined, {
        type: 'SEAL_COMPLETED',
        quoteNumber,
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to present seal notification:', err);
    }
  }

  /**
   * Notification 2: Offline Outbox auto-dispatched when returning online.
   */
  public static async notifyOutboxDispatched(count: number, clientName?: string): Promise<void> {
    const prefs = useQuoteStore.getState().profile.notificationPreferences;
    if (prefs && !prefs.outboxAlerts) return;

    const cacheKey = `outbox_${count}_${Date.now()}`;
    if (!this.shouldTrigger(cacheKey)) return;

    const bodyText = clientName
      ? `Estimate for ${clientName} has been delivered now that you're back online.`
      : `Successfully delivered ${count} offline agreement${count > 1 ? 's' : ''} to clients now that cell signal is restored.`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Offline Outbox Dispatched ⚡',
          body: bodyText,
          data: { count, type: 'OUTBOX_DISPATCHED' },
          sound: true,
          channelId: 'outbox_sync',
        } as any,
        trigger: null,
      });

      TelemetryService.logAction('NOTIFICATION_SENT', undefined, {
        type: 'OUTBOX_DISPATCHED',
        count,
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to present outbox notification:', err);
    }
  }

  /**
   * Notification 3: Payment recorded / job marked paid.
   */
  public static async notifyPaymentReceived(
    quoteNumber: number,
    clientName: string,
    totalAmountCents: number
  ): Promise<void> {
    const cacheKey = `paid_${quoteNumber}`;
    if (!this.shouldTrigger(cacheKey)) return;

    const profile = useQuoteStore.getState().profile;
    const curSymbol = profile?.currencySymbol || '$';
    const amountStr = `${curSymbol}${(totalAmountCents / 100).toFixed(2)}`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Payment Recorded 🎉',
          body: `Estimate #${quoteNumber} for ${clientName} (${amountStr}) is marked as Paid in Full.`,
          data: { quoteNumber, type: 'PAYMENT_RECEIVED' },
          sound: true,
          channelId: 'job_seals',
        } as any,
        trigger: null,
      });

      TelemetryService.logAction('NOTIFICATION_SENT', undefined, {
        type: 'PAYMENT_RECEIVED',
        quoteNumber,
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to present payment notification:', err);
    }
  }

  /**
   * Notification 4: Gentle Follow-up reminder (scheduled 3 days after signing if unpaid).
   * Scheduled politely with zero spam.
   */
  public static async schedulePaymentReminder(quote: Quote): Promise<void> {
    const prefs = useQuoteStore.getState().profile.notificationPreferences;
    if (prefs && !prefs.paymentReminders) return;

    const curSymbol = quote.currencySymbol || useQuoteStore.getState().profile?.currencySymbol || '$';
    const amountStr = `${curSymbol}${(quote.totalAmountCents / 100).toFixed(2)}`;
    const identifier = `reminder_quote_${quote.id}`;

    try {
      // Cancel any existing reminder for this quote first
      await Notifications.cancelScheduledNotificationAsync(identifier);

      // Schedule for 3 days later (in seconds)
      const secondsInThreeDays = 3 * 24 * 60 * 60;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Payment Follow-up: ${quote.clientName}`,
          body: `Estimate #${quote.quoteNumber} (${amountStr}) was approved 3 days ago. Tap to send a polite reminder or record payment.`,
          data: { quoteId: quote.id, quoteNumber: quote.quoteNumber, type: 'PAYMENT_REMINDER' },
          sound: true,
          channelId: 'payment_reminders',
        } as any,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsInThreeDays,
        },
      });

      TelemetryService.logAction('REMINDER_SCHEDULED', undefined, {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
      });
    } catch (err) {
      console.warn('[NotificationService] Reminder scheduling note:', err);
    }
  }

  /**
   * Cancels a scheduled reminder (e.g. when paid).
   */
  public static async cancelReminder(quoteId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(`reminder_quote_${quoteId}`);
    } catch {
      // Ignore if not found
    }
  }
}
