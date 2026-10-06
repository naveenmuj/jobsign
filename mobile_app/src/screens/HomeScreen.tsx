import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { PaymentQRModal } from '../components/PaymentQRModal';

export const HomeScreen: React.FC<{ onNewQuote: () => void }> = ({ onNewQuote }) => {
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

  const handleSharePDF = async (quote: Quote) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await PDFService.generateAndSharePDF(quote);
  };

  const renderQuoteCard = ({ item }: { item: Quote }) => {
    const isLocked = item.status === 'SIGNED_LOCKED';
    const isPaid = item.status === 'PAID';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.quoteSub}>#{item.quoteNumber} • {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.amount}>${(item.totalAmountCents / 100).toFixed(2)}</Text>
        </View>

        {/* Status Pill */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.pill,
              isPaid ? styles.pillPaid : isLocked ? styles.pillSigned : styles.pillDraft,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                isPaid ? styles.pillTextPaid : isLocked ? styles.pillTextSigned : styles.pillTextDraft,
              ]}
            >
              {isPaid ? '✔ PAID & SETTLED' : isLocked ? '🔒 SIGNED & LOCKED' : '📝 DRAFT'}
            </Text>
          </View>

          {item.pdfSha256Hash && (
            <Text style={styles.hashBadge}>SHA-256: {item.pdfSha256Hash.substring(0, 8)}...</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleSharePDF(item)}>
            <Text style={styles.actionBtnOutlineText}>📄 Share PDF</Text>
          </TouchableOpacity>

          {!isPaid && (
            <TouchableOpacity
              style={styles.actionBtnSolid}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedPaymentQuote(item);
              }}
            >
              <Text style={styles.actionBtnSolidText}>💵 Collect Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>🔨 JobSign</Text>
          <Text style={styles.brandSub}>Field Agreement & Settlement</Text>
        </View>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO ⭐️</Text>
        </View>
      </View>

      {/* Metrics Banner */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsLabel}>APPROVED & UNCOLLECTED</Text>
        <Text style={styles.metricsVal}>${(totalUncollected / 100).toFixed(2)}</Text>
        <Text style={styles.metricsSub}>{quotes.length} Total Jobs on Record (Offline SQLite)</Text>
      </View>

      {/* Filter Tabs */}
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

      {/* Quotes List */}
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={renderQuoteCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadQuotes} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No estimates in this view</Text>
            <Text style={styles.emptyDesc}>Tap the button below to build your first 60-second quote.</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
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
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderColor: Theme.colors.borderSubtle,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  proBadgeText: {
    color: '#B45309',
    fontWeight: '900',
    fontSize: 12,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  metricsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  metricsVal: {
    fontSize: 28,
    fontWeight: '900',
    color: Theme.colors.primary,
    marginTop: 4,
  },
  metricsSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  quoteSub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 3,
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  pillSigned: {
    backgroundColor: Theme.colors.accentLight,
  },
  pillPaid: {
    backgroundColor: Theme.colors.successLight,
  },
  pillDraft: {
    backgroundColor: Theme.colors.warningLight,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillTextSigned: {
    color: Theme.colors.accent,
  },
  pillTextPaid: {
    color: Theme.colors.success,
  },
  pillTextDraft: {
    color: Theme.colors.warning,
  },
  hashBadge: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  actionBtnSolid: {
    flex: 1,
    backgroundColor: Theme.colors.success,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionBtnSolidText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: Theme.colors.accent,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
