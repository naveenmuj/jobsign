import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Settings, WifiOff, Search, X, Check } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { JobCard } from '../components/JobCard';
import { PaymentQRModal } from '../components/PaymentQRModal';
import { OfflineOutboxModal } from '../components/OfflineOutboxModal';
import { PaywallModal } from '../components/PaywallModal';
import { OutboxService } from '../services/OutboxService';
import { BillingService } from '../services/BillingService';

interface HomeScreenProps {
  onNewQuote: () => void;
  onSelectQuote: (quote: Quote) => void;
  onOpenSettings: () => void;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 54,
      paddingBottom: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    brandTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    brandSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    proBadge: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: Theme.borderRadius.full,
    },
    proBadgeActive: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: Theme.colors.amber,
    },
    proBadgeText: {
      color: colors.textMuted,
      fontWeight: '900',
      fontSize: 11,
    },
    proBadgeTextActive: {
      color: colors.amber,
    },
    settingsIconBtn: {
      padding: 6,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricsContainer: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    metricVal: {
      fontSize: 26,
      fontWeight: '900',
      marginVertical: 4,
    },
    metricSub: {
      fontSize: 11,
      color: colors.textMuted,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 10,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    listContent: {
      padding: 16,
      paddingBottom: 110,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      paddingHorizontal: 40,
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      ...Theme.shadows.primaryBtn,
    },
    fabText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    outboxIconBtn: {
      position: 'relative',
      padding: 6,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outboxBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.amber,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3,
    },
    outboxBadgeText: {
      color: colors.textPrimary,
      fontSize: 10,
      fontWeight: '900',
    },
    outboxBanner: {
      backgroundColor: colors.warningLight,
      borderBottomWidth: 1,
      borderColor: colors.amber + '4D',
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    outboxBannerText: {
      color: colors.amber,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: Theme.borderRadius.md,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      height: 42,
      color: colors.textPrimary,
      fontSize: 14,
    },
    clearSearchBtn: {
      padding: 6,
    },
    usageBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    usageBannerNormal: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary + '40',
    },
    usageBannerExceeded: {
      backgroundColor: colors.roseLight,
      borderColor: colors.rose + '66',
    },
    usageBannerPro: {
      backgroundColor: colors.successLight,
      borderColor: colors.emerald + '4D',
    },
    usageBannerText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.3,
    },
    usageBannerTextPro: {
      color: colors.emerald,
    },
  });

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewQuote,
  onSelectQuote,
  onOpenSettings,
}) => {
  console.log('[JobSign] HomeScreen component rendering...');
  const { quotes, loadQuotes, activeFilter, setFilter, profile, isPro, isLoading, getMonthlyQuoteUsage } = useQuoteStore();
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [selectedPaymentQuote, setSelectedPaymentQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const usage = getMonthlyQuoteUsage();

  const handleOpenPaywall = async () => {
    const presented = await BillingService.presentRevenueCatPaywall();
    if (!presented) {
      setShowPaywall(true);
    }
  };

  const refreshOutboxCount = async () => {
    const pending = await OutboxService.getPending();
    setPendingOutboxCount(pending.length);
  };

  useEffect(() => {
    loadQuotes();
    refreshOutboxCount();
    OutboxService.startAutoSync(() => {
      refreshOutboxCount();
    });
    return () => {
      OutboxService.stopAutoSync();
    };
  }, []);

  const filteredQuotes = quotes.filter((q) => {
    const matchesStatus = activeFilter === 'ALL' || q.status === activeFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      q.clientName.toLowerCase().includes(query) ||
      String(q.quoteNumber).includes(query) ||
      (q.jobDescription && q.jobDescription.toLowerCase().includes(query)) ||
      (q.clientPhone && q.clientPhone.includes(query))
    );
  });

  const totalUncollected = quotes
    .filter((q) => q.status === 'SIGNED_LOCKED')
    .reduce((sum, q) => sum + q.totalAmountCents, 0);

  const totalCollected = quotes
    .filter((q) => q.status === 'PAID')
    .reduce((sum, q) => sum + q.totalAmountCents, 0);

  const handleSharePDF = async (quote: Quote) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await PDFService.generateAndSharePDF(quote, profile);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>JobSign</Text>
          <Text style={styles.brandSub}>{profile.businessName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.outboxIconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowOutboxModal(true);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <WifiOff size={18} color={colors.textSecondary} />
            {pendingOutboxCount > 0 && (
              <View style={styles.outboxBadge}>
                <Text style={styles.outboxBadgeText}>{pendingOutboxCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.proBadge, isPro && styles.proBadgeActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isPro) {
                onOpenSettings();
              } else {
                handleOpenPaywall();
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {isPro && <Check size={12} color={colors.amber} strokeWidth={2.5} />}
              <Text style={[styles.proBadgeText, isPro && styles.proBadgeTextActive]}>
                {isPro ? 'Pro' : 'Upgrade'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={onOpenSettings}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Settings size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Outbox Alert Banner (If pending) */}
      {pendingOutboxCount > 0 && (
        <TouchableOpacity
          style={styles.outboxBanner}
          onPress={() => setShowOutboxModal(true)}
        >
          <Text style={styles.outboxBannerText}>
            {pendingOutboxCount} pending sync · Tap to sync now
          </Text>
        </TouchableOpacity>
      )}

      {/* High-Impact Metrics Dashboard */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Outstanding</Text>
          <Text style={[styles.metricVal, { color: colors.amber }]}>
            ${(totalUncollected / 100).toFixed(0)}
          </Text>
          <Text style={styles.metricSub}>Awaiting collection</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Collected</Text>
          <Text style={[styles.metricVal, { color: colors.emerald }]}>
            ${(totalCollected / 100).toFixed(0)}
          </Text>
          <Text style={styles.metricSub}>Zero-fee direct payment</Text>
        </View>
      </View>

      {/* Free Tier Usage Banner or Pro Active Status */}
      <TouchableOpacity
        style={[
          styles.usageBanner,
          isPro ? styles.usageBannerPro : usage.isExceeded ? styles.usageBannerExceeded : styles.usageBannerNormal,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (!isPro) handleOpenPaywall();
        }}
        activeOpacity={0.85}
      >
        <Text style={[styles.usageBannerText, isPro && styles.usageBannerTextPro]}>
          {isPro
            ? 'Pro — Unlimited Estimates Active'
            : usage.isExceeded
            ? `Free plan limit reached (${usage.count}/${usage.limit}) · Tap to upgrade`
            : `Free plan: ${usage.count} of ${usage.limit} estimates used this month`}
        </Text>
      </TouchableOpacity>

      {/* Live Search Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search client, agreement #, or notes..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Filter Pills */}
      <View style={styles.filterRow}>
        {(['ALL', 'SIGNED_LOCKED', 'PAID', 'DRAFT'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, activeFilter === tab && styles.filterChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(tab);
            }}
          >
            <Text style={[styles.filterChipText, activeFilter === tab && styles.filterChipTextActive]}>
              {tab === 'SIGNED_LOCKED' ? 'Signed' : tab === 'PAID' ? 'Paid' : tab === 'DRAFT' ? 'Draft' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Jobs Pipeline */}
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard
            quote={item}
            onPress={() => onSelectQuote(item)}
            onSharePDF={() => handleSharePDF(item)}
            onCollectPay={() => setSelectedPaymentQuote(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              loadQuotes();
              refreshOutboxCount();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching agreements found' : 'No estimates yet'}
            </Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? 'Try searching by a different name or quote number.'
                : 'Tap New Estimate to create your first client quote with digital signature.'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          if (!isPro && usage.isExceeded) {
            Alert.alert(
              'Free plan limit reached',
              `You've used all ${usage.limit} free estimates this month.\n\nUpgrade to JobSign Pro for unlimited estimates, digital seals, and change orders.`,
              [
                { text: 'Later', style: 'cancel' },
                { text: 'View Pro Plans', onPress: handleOpenPaywall },
              ]
            );
            return;
          }
          onNewQuote();
        }}
      >
        <Text style={styles.fabText}>New Estimate</Text>
      </TouchableOpacity>

      {/* Direct Payment QR Modal */}
      {selectedPaymentQuote && (
        <PaymentQRModal
          quote={selectedPaymentQuote}
          onClose={() => setSelectedPaymentQuote(null)}
        />
      )}

      {/* Offline Outbox Modal */}
      <OfflineOutboxModal
        visible={showOutboxModal}
        onClose={() => setShowOutboxModal(false)}
        onQueueUpdated={refreshOutboxCount}
      />

      {/* In-App Purchase Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </View>
  );
};
