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
import { Theme } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { JobCard } from '../components/JobCard';
import { PaymentQRModal } from '../components/PaymentQRModal';
import { OfflineOutboxModal } from '../components/OfflineOutboxModal';
import { PaywallModal } from '../components/PaywallModal';
import { OutboxService } from '../services/OutboxService';

interface HomeScreenProps {
  onNewQuote: () => void;
  onSelectQuote: (quote: Quote) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNewQuote,
  onSelectQuote,
  onOpenSettings,
}) => {
  console.log('[JobSign] HomeScreen component rendering...');
  const { quotes, loadQuotes, activeFilter, setFilter, profile, isPro, isLoading, getMonthlyQuoteUsage } = useQuoteStore();
  const [selectedPaymentQuote, setSelectedPaymentQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const usage = getMonthlyQuoteUsage();

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
          <Text style={styles.brandTitle}>🔨 JobSign</Text>
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
            <Text style={styles.outboxIconText}>📡</Text>
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
                setShowPaywall(true);
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <Text style={[styles.proBadgeText, isPro && styles.proBadgeTextActive]}>
              {isPro ? 'PRO ⭐️' : 'UPGRADE'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={onOpenSettings}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.settingsIconText}>⚙️</Text>
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
            📡 {pendingOutboxCount} Agreement(s) in Offline Outbox • Tap to Sync
          </Text>
        </TouchableOpacity>
      )}

      {/* High-Impact Metrics Dashboard */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TO COLLECT</Text>
          <Text style={[styles.metricVal, { color: Theme.colors.amber }]}>
            ${(totalUncollected / 100).toFixed(0)}
          </Text>
          <Text style={styles.metricSub}>Approved on glass</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>PAID IN FULL</Text>
          <Text style={[styles.metricVal, { color: Theme.colors.emerald }]}>
            ${(totalCollected / 100).toFixed(0)}
          </Text>
          <Text style={styles.metricSub}>Direct 0% fee P2P</Text>
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
          if (!isPro) setShowPaywall(true);
        }}
        activeOpacity={0.85}
      >
        <Text style={[styles.usageBannerText, isPro && styles.usageBannerTextPro]}>
          {isPro
            ? '⭐️ PRO PROTECTION ACTIVE • UNLIMITED ESTIMATES & AUDIT SEALS'
            : usage.isExceeded
            ? `⚠️ FREE LIMIT REACHED (${usage.count}/${usage.limit} quotes) • TAP TO UPGRADE ⭐️`
            : `⚡ FREE TIER: ${usage.count} of ${usage.limit} quotes used this month • Upgrade for $2.50/mo ⭐️`}
        </Text>
      </TouchableOpacity>

      {/* Live Search Bar */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search client, agreement #, or notes..."
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.clearSearchText}>✕</Text>
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
            tintColor="#38BDF8"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching agreements found' : 'Zero active estimates in this view'}
            </Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? 'Try searching by a different name or quote number.'
                : 'Tap below to assemble your first 60-second quote with client signature.'}
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
              'Free Plan Limit Reached ⚠️',
              `You have reached the free tier limit of ${usage.limit} quotes this month.\n\nUpgrade to JobSign Pro to unlock unlimited courtroom-sealed estimates, change orders, and direct settlement QR codes.`,
              [
                { text: 'Later', style: 'cancel' },
                { text: 'View Early-Bird Plans ⭐️', onPress: () => setShowPaywall(true) },
              ]
            );
            return;
          }
          onNewQuote();
        }}
      >
        <Text style={styles.fabText}>➕ NEW 60-SEC QUOTE</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: '#64748B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
  },
  proBadgeActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Theme.colors.amber,
  },
  proBadgeText: {
    color: '#94A3B8',
    fontWeight: '900',
    fontSize: 11,
  },
  proBadgeTextActive: {
    color: '#FBBF24',
  },
  settingsIconBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsIconText: {
    fontSize: 15,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  metricVal: {
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 11,
    color: Theme.colors.textMuted,
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
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
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
    color: Theme.colors.textPrimary,
  },
  emptyDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: Theme.colors.primary,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glowPrimary,
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
    backgroundColor: '#1E293B',
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  outboxIconText: {
    fontSize: 15,
  },
  outboxBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Theme.colors.amber,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  outboxBadgeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },
  outboxBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  outboxBannerText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  usageBannerExceeded: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  usageBannerPro: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  usageBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  usageBannerTextPro: {
    color: Theme.colors.emerald,
  },
});
