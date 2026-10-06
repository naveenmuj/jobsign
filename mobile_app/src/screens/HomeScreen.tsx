import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { JobCard } from '../components/JobCard';
import { PaymentQRModal } from '../components/PaymentQRModal';

interface HomeScreenProps {
  onNewQuote: () => void;
  onSelectQuote: (quote: Quote) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNewQuote, onSelectQuote }) => {
  const { quotes, loadQuotes, activeFilter, setFilter, isLoading } = useQuoteStore();
  const [selectedPaymentQuote, setSelectedPaymentQuote] = useState<Quote | null>(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  const filteredQuotes = quotes.filter((q) => {
    if (activeFilter === 'ALL') return true;
    return q.status === activeFilter;
  });

  const totalUncollected = quotes
    .filter((q) => q.status === 'SIGNED_LOCKED')
    .reduce((sum, q) => sum + q.totalAmountCents, 0);

  const totalCollected = quotes
    .filter((q) => q.status === 'PAID')
    .reduce((sum, q) => sum + q.totalAmountCents, 0);

  const handleSharePDF = async (quote: Quote) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await PDFService.generateAndSharePDF(quote);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>🔨 JobSign</Text>
          <Text style={styles.brandSub}>Field Agreement & Instant Settlement</Text>
        </View>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO ⭐️</Text>
        </View>
      </View>

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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadQuotes} tintColor="#38BDF8" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Zero active estimates in this view</Text>
            <Text style={styles.emptyDesc}>
              Tap below to assemble your first 60-second quote with client signature.
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
  proBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.amber,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
  },
  proBadgeText: {
    color: '#FBBF24',
    fontWeight: '900',
    fontSize: 12,
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
});
