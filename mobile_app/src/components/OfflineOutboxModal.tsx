import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { OutboxItem } from '../types';
import { OutboxService } from '../services/OutboxService';
import { AlertService } from '../services/AlertService';
import { useQuoteStore } from '../store/useQuoteStore';
import { useAppSafeArea } from '../utils/safeArea';
import { formatLocalTime } from '../utils/dateUtils';

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
  const { isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();

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
      AlertService.alert({
        title: 'Sync Complete',
        message: `Successfully dispatched ${result.sent} pending agreement(s).`,
        type: 'SUCCESS',
      });
    } else {
      AlertService.alert({
        title: 'Queue Up to Date',
        message: 'No pending items to dispatch or device is currently offline.',
        type: 'INFO',
      });
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
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Sync Status</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
                <Text style={styles.statusText}>
                  {isOnline ? 'Online (Cellular / Wi-Fi Active)' : 'Offline (Field Mode)'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <X size={18} color={colors.textSecondary} />
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
                Offline QR Handshake
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
                        {formatLocalTime(item.createdAt)}
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
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Text style={styles.delText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Outbox is clear</Text>
                    <Text style={styles.emptySub}>
                      Agreements created without reception queue here and automatically send when connection is restored.
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
                    Sync Now ({pendingCount} Pending)
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.qrContainer}>
              <Text style={styles.qrExplain}>
                No mobile signal? Have the client scan this screen to receive their document token directly.
              </Text>
              <View style={styles.qrFrame}>
                <QRCode
                  value={`jobsign://offline-handshake?pending=${pendingCount}&ts=${Date.now()}`}
                  size={170}
                  color="#0F172A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={styles.qrSub}>Encrypted Offline Handshake Token</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Theme.borderRadius.lg,
      borderTopRightRadius: Theme.borderRadius.lg,
      padding: 24,
      paddingBottom: 40,
      maxHeight: '85%',
      borderTopWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
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
      color: colors.textPrimary,
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
      backgroundColor: colors.emerald,
    },
    dotOffline: {
      backgroundColor: colors.rose,
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    closeBtn: {
      padding: 6,
    },
    closeText: {
      fontSize: 18,
      color: colors.textMuted,
      fontWeight: 'bold',
    },
    tabsRow: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
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
      backgroundColor: colors.surface,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    tabBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabBtnTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    listContent: {
      paddingBottom: 16,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: Theme.borderRadius.md,
      marginBottom: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    itemSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemTime: {
      fontSize: 11,
      color: colors.textMuted,
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
      backgroundColor: colors.warningLight,
    },
    badgeSent: {
      backgroundColor: colors.successLight,
    },
    badgeFailed: {
      backgroundColor: colors.roseLight,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    delBtn: {
      paddingVertical: 2,
    },
    delText: {
      fontSize: 11,
      color: colors.rose,
      fontWeight: '600',
    },
    emptyBox: {
      padding: 30,
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    emptySub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
    syncBtn: {
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    syncBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.3,
    },
    qrContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    qrExplain: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 18,
    },
    qrFrame: {
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    qrSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 14,
      fontWeight: '600',
    },
  });
