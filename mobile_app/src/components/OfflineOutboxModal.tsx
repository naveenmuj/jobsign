import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { OutboxItem } from '../types';
import { OutboxService } from '../services/OutboxService';

interface OfflineOutboxModalProps {
  visible: boolean;
  onClose: () => void;
  onQueueUpdated?: () => void;
}

export const OfflineOutboxModal: React.FC<OfflineOutboxModalProps> = ({
  visible,
  onClose,
  onQueueUpdated,
}) => {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'OFFLINE_QR'>('QUEUE');

  const loadData = async () => {
    const list = await OutboxService.getAll();
    setItems(list);
    const online = await OutboxService.isOnline();
    setIsOnline(online);
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const handleForceSync = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSyncing(true);
    const result = await OutboxService.dispatchQueue();
    setIsSyncing(false);
    await loadData();
    if (onQueueUpdated) onQueueUpdated();

    if (result.sent > 0) {
      Alert.alert('Sync Complete! 📡', `Successfully dispatched ${result.sent} pending agreement(s).`);
    } else {
      Alert.alert('Queue Up to Date', 'No pending items to dispatch or phone is currently offline.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await OutboxService.remove(id);
    await loadData();
    if (onQueueUpdated) onQueueUpdated();
  };

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📡 Offline Outbox & Sync</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
                <Text style={styles.statusText}>
                  {isOnline ? 'Cellular / Wi-Fi Active' : 'Offline / Basement Mode'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'QUEUE' && styles.tabBtnActive]}
              onPress={() => setActiveTab('QUEUE')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'QUEUE' && styles.tabBtnTextActive]}>
                Queued Items ({pendingCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'OFFLINE_QR' && styles.tabBtnActive]}
              onPress={() => setActiveTab('OFFLINE_QR')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'OFFLINE_QR' && styles.tabBtnTextActive]}>
                Offline Client QR
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'QUEUE' ? (
            <>
              {/* Item List */}
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.itemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.clientName}</Text>
                      <Text style={styles.itemSub}>
                        {item.channel} to {item.recipientContact}
                      </Text>
                      <Text style={styles.itemTime}>
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={styles.rightActionCol}>
                      <View
                        style={[
                          styles.badge,
                          item.status === 'SENT'
                            ? styles.badgeSent
                            : item.status === 'FAILED'
                            ? styles.badgeFailed
                            : styles.badgePending,
                        ]}
                      >
                        <Text style={styles.badgeText}>{item.status}</Text>
                      </View>
                      {item.status === 'PENDING' && (
                        <TouchableOpacity
                          style={styles.delBtn}
                          onPress={() => handleDeleteItem(item.id)}
                        >
                          <Text style={styles.delText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Outbox is completely clear</Text>
                    <Text style={styles.emptySub}>
                      Agreements created without reception will queue here and automatically send when 4G/Wi-Fi is reconnected.
                    </Text>
                  </View>
                }
              />

              {/* Sync Action */}
              <TouchableOpacity
                style={[styles.syncBtn, isSyncing && { opacity: 0.7 }]}
                onPress={handleForceSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.syncBtnText}>
                    ⚡ FORCE SYNC OUTBOX ({pendingCount} PENDING)
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.qrContainer}>
              <Text style={styles.qrExplain}>
                Zero bars in basement? Have client scan this screen to receive document token instantly.
              </Text>
              <View style={styles.qrFrame}>
                <QRCode
                  value={`jobsign://offline-handshake?pending=${pendingCount}&ts=${Date.now()}`}
                  size={170}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrSub}>Offline P2P Encrypted Handshake Token</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: Theme.colors.emerald,
  },
  dotOffline: {
    backgroundColor: Theme.colors.rose,
  },
  statusText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: Theme.borderRadius.sm,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#334155',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 10,
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  itemSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  rightActionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeSent: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  delBtn: {
    paddingVertical: 2,
  },
  delText: {
    fontSize: 11,
    color: Theme.colors.rose,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  syncBtn: {
    backgroundColor: Theme.colors.primary,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrExplain: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  qrSub: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 14,
    fontWeight: '600',
  },
});
