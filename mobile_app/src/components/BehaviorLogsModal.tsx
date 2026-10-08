import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Share2, RefreshCw, Trash2, Globe, Shield, Terminal, ArrowUpRight } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { TelemetryService } from '../services/TelemetryService';
import { AlertService } from '../services/AlertService';
import { BehaviorLogEntry } from '../types';
import { useAppSafeArea } from '../utils/safeArea';
import { useKeyboard } from '../utils/useKeyboard';

interface BehaviorLogsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BehaviorLogsModal: React.FC<BehaviorLogsModalProps> = ({ visible, onClose }) => {
  const { isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  const [logs, setLogs] = useState<BehaviorLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [endpointInput, setEndpointInput] = useState('');
  const [isFlushing, setIsFlushing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const entries = await TelemetryService.getLogs(200);
      const count = await TelemetryService.getLogsCount();
      const currentEndpoint = await TelemetryService.getCustomEndpoint();
      setLogs(entries);
      setTotalCount(count);
      setEndpointInput(currentEndpoint);
    } catch (err) {
      console.warn('Error loading telemetry logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const handleSaveEndpoint = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await TelemetryService.setCustomEndpoint(endpointInput);
    AlertService.alert({
      title: 'Saved',
      message: 'Remote telemetry webhook endpoint updated.',
      type: 'SUCCESS',
    });
  };

  const handleFlush = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFlushing(true);
    try {
      const result = await TelemetryService.flush();
      await loadData();
      AlertService.alert({
        title: 'Telemetry Flush',
        message:
          result.sent > 0
            ? `Successfully transmitted ${result.sent} events to remote endpoint.`
            : 'No unsynced events or remote endpoint is not configured/reachable.',
        type: result.sent > 0 ? 'SUCCESS' : 'INFO',
      });
    } catch (e: any) {
      AlertService.alert({
        title: 'Flush Error',
        message: e?.message || 'Failed to dispatch logs',
        type: 'DANGER',
      });
    } finally {
      setIsFlushing(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await TelemetryService.shareLogs();
    } catch (e: any) {
      AlertService.alert({
        title: 'Export Error',
        message: e?.message || 'Could not export logs.',
        type: 'DANGER',
      });
    }
  };

  const handleClear = () => {
    AlertService.alert({
      title: 'Clear Log History',
      message: 'Are you sure you want to delete all local behavior logs?',
      type: 'DANGER',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await TelemetryService.clearLogs();
            await loadData();
          },
        },
      ],
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SCREEN_VIEW':
        return '#3B82F6'; // blue
      case 'USER_ACTION':
        return '#10B981'; // emerald
      case 'JOB_EVENT':
        return '#F59E0B'; // amber
      case 'PDF_EVENT':
        return '#8B5CF6'; // purple
      case 'ERROR':
        return '#EF4444'; // red
      default:
        return '#64748B'; // slate
    }
  };

  const renderLogItem = ({ item }: { item: BehaviorLogEntry }) => {
    const isExpanded = expandedLogId === item.id;
    const dateStr = new Date(item.timestamp).toLocaleTimeString();
    const catColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={styles.logItem}
        activeOpacity={0.7}
        onPress={() => setExpandedLogId(isExpanded ? null : item.id)}
      >
        <View style={styles.logHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: `${catColor}20`, borderColor: catColor }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>{item.category}</Text>
          </View>
          <Text style={styles.timeText}>{dateStr}</Text>
        </View>

        <Text style={styles.actionText}>{item.action}</Text>
        {item.screenName && <Text style={styles.screenText}>Screen: {item.screenName}</Text>}

        {isExpanded && item.payloadJson && (
          <View style={styles.payloadBox}>
            <Text style={styles.payloadTitle}>Event Payload:</Text>
            <Text style={styles.payloadContent}>{item.payloadJson}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={[styles.overlay, { paddingBottom: isKeyboardVisible ? keyboardHeight : 0 }]}>
        <View style={[styles.container, { paddingBottom: isKeyboardVisible ? 14 : 20 + insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>User Activity & Telemetry</Text>
              <Text style={styles.subtitle}>
                {totalCount} total behavior events recorded offline
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Webhook Endpoint Config */}
          <View style={styles.endpointCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Globe size={14} color={colors.amber} />
              <Text style={styles.endpointLabel}>Remote Webhook / Telemetry Ingest URL:</Text>
            </View>
            <View style={styles.endpointRow}>
              <TextInput
                style={styles.endpointInput}
                placeholder="https://webhook.site/... or custom server"
                placeholderTextColor={colors.textSecondary}
                value={endpointInput}
                onChangeText={setEndpointInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEndpoint}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Controls Bar */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolBtn} onPress={loadData}>
              <RefreshCw size={14} color={colors.textSecondary} />
              <Text style={styles.toolBtnText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleFlush} disabled={isFlushing}>
              {isFlushing ? (
                <ActivityIndicator size="small" color={colors.amber} />
              ) : (
                <>
                  <ArrowUpRight size={14} color={colors.amber} />
                  <Text style={[styles.toolBtnText, { color: colors.amber }]}>Flush Now</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleShare}>
              <Share2 size={14} color={colors.emerald} />
              <Text style={[styles.toolBtnText, { color: colors.emerald }]}>Export JSON</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleClear}>
              <Trash2 size={14} color={colors.rose} />
              <Text style={[styles.toolBtnText, { color: colors.rose }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Log List */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={colors.amber} />
              <Text style={styles.loadingText}>Reading SQLite behavior store...</Text>
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Terminal size={36} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No user activity logged yet.</Text>
            </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(item) => item.id}
              renderItem={renderLogItem}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
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
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '88%',
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
    },
    endpointCard: {
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    endpointLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    endpointRow: {
      flexDirection: 'row',
      gap: 8,
    },
    endpointInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 12,
      color: colors.textPrimary,
    },
    saveBtn: {
      backgroundColor: colors.amber,
      paddingHorizontal: 14,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnText: {
      color: '#0F172A',
      fontWeight: '700',
      fontSize: 12,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 12,
      gap: 6,
    },
    toolBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toolBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    centerLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    logItem: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    categoryBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    timeText: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    screenText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    payloadBox: {
      marginTop: 8,
      padding: 8,
      borderRadius: 4,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    payloadTitle: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.amber,
      marginBottom: 4,
    },
    payloadContent: {
      fontSize: 11,
      fontFamily: 'monospace',
      color: colors.textPrimary,
    },
  });
