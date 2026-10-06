import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { Quote } from '../types';

interface JobCardProps {
  quote: Quote;
  onPress: () => void;
  onSharePDF: () => void;
  onCollectPay: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  quote,
  onPress,
  onSharePDF,
  onCollectPay,
}) => {
  const isPaid = quote.status === 'PAID';
  const isLocked = quote.status === 'SIGNED_LOCKED';
  const isDraft = quote.status === 'DRAFT';

  const statusColor = isPaid
    ? Theme.colors.emerald
    : isLocked
    ? Theme.colors.primary
    : Theme.colors.amber;

  const statusLabel = isPaid
    ? 'PAID IN FULL'
    : isLocked
    ? 'SIGNED & LOCKED'
    : 'DRAFT ESTIMATE';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.cardWrapper}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <LinearGradient
        colors={['#1E293B', '#172033']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardContainer}
      >
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{quote.clientName}</Text>
            <Text style={styles.subText}>
              #{quote.quoteNumber} • {quote.jobDescription || 'Standard Service'}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>
              ${(quote.totalAmountCents / 100).toFixed(2)}
            </Text>
            <Text style={styles.dateText}>{new Date(quote.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Status Badge & Hash Fingerprint */}
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: 'rgba(15,23,42,0.6)' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {quote.changeOrders && quote.changeOrders.length > 0 && (
            <View style={styles.coBadge}>
              <Text style={styles.coText}>+{quote.changeOrders.length} Add-on</Text>
            </View>
          )}

          {quote.pdfSha256Hash && (
            <Text style={styles.hashText}>
              SHA: {quote.pdfSha256Hash.substring(0, 6)}...
            </Text>
          )}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={(e) => {
              e.stopPropagation();
              onSharePDF();
            }}
          >
            <Text style={styles.actionBtnSecondaryText}>📄 Send PDF</Text>
          </TouchableOpacity>

          {!isPaid && (
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={(e) => {
                e.stopPropagation();
                onCollectPay();
              }}
            >
              <Text style={styles.actionBtnPrimaryText}>💵 Collect Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 14,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.card,
  },
  cardContainer: {
    padding: 18,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  coBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: Theme.colors.purple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  coText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  hashText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Theme.colors.textMuted,
    marginLeft: 'auto',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minHeight: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: Theme.colors.emerald,
    minHeight: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
