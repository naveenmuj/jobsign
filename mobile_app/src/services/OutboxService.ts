import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';
import { DatabaseService } from './DatabaseService';
import { OutboxItem, Quote } from '../types';

export class OutboxService {
  private static isSyncing = false;
  private static listenerSubscription: any = null;

  public static async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return Boolean(state.isConnected && state.isInternetReachable);
    } catch {
      return true; // Fallback to optimistic
    }
  }

  public static async enqueue(
    quote: Quote,
    recipientContact: string,
    channel: 'SMS' | 'EMAIL' | 'SHARE'
  ): Promise<OutboxItem> {
    const item: OutboxItem = {
      id: Math.random().toString(36).substring(7),
      quoteId: quote.id,
      clientName: quote.clientName,
      recipientContact,
      channel,
      createdAt: Date.now(),
      status: 'PENDING',
    };

    await DatabaseService.saveOutboxItem(item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return item;
  }

  public static async getPending(): Promise<OutboxItem[]> {
    const all = await DatabaseService.getAllOutboxItems();
    return all.filter((item) => item.status === 'PENDING');
  }

  public static async getAll(): Promise<OutboxItem[]> {
    return await DatabaseService.getAllOutboxItems();
  }

  public static async dispatchQueue(
    onProgress?: (sent: number, total: number) => void
  ): Promise<{ sent: number; failed: number }> {
    if (this.isSyncing) return { sent: 0, failed: 0 };
    this.isSyncing = true;

    try {
      const online = await this.isOnline();
      if (!online) {
        this.isSyncing = false;
        return { sent: 0, failed: 0 };
      }

      const pending = await this.getPending();
      if (pending.length === 0) {
        this.isSyncing = false;
        return { sent: 0, failed: 0 };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        try {
          // Simulate or perform native dispatch transport
          await new Promise((resolve) => setTimeout(resolve, 600));
          await DatabaseService.updateOutboxStatus(item.id, 'SENT');
          sentCount++;
          if (onProgress) onProgress(sentCount, pending.length);
        } catch (err: any) {
          failedCount++;
          await DatabaseService.updateOutboxStatus(
            item.id,
            'FAILED',
            err?.message || 'Network dispatch failed'
          );
        }
      }

      if (sentCount > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      this.isSyncing = false;
      return { sent: sentCount, failed: failedCount };
    } catch {
      this.isSyncing = false;
      return { sent: 0, failed: 0 };
    }
  }

  public static startAutoSync(onSyncComplete?: (sent: number) => void) {
    if (this.listenerSubscription) return;

    this.listenerSubscription = Network.addNetworkStateListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        const result = await this.dispatchQueue();
        if (result.sent > 0 && onSyncComplete) {
          onSyncComplete(result.sent);
        }
      }
    });
  }

  public static stopAutoSync() {
    if (this.listenerSubscription && typeof this.listenerSubscription.remove === 'function') {
      this.listenerSubscription.remove();
      this.listenerSubscription = null;
    }
  }

  public static async remove(id: string): Promise<void> {
    await DatabaseService.deleteOutboxItem(id);
  }
}
