import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FileText, CreditCard, ChevronRight, MessageCircle } from 'lucide-react-native';
import { Theme, getThemeColors } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { CurrencyService } from '../services/CurrencyService';

interface JobCardProps {
  quote: Quote;
  onPress: () => void;
  onSharePDF: () => void;
  onCollectPay: () => void;
  onShareWhatsApp?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  quote,
  onPress,
  onSharePDF,
  onCollectPay,
  onShareWhatsApp,
}) => {
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);

  const isPaid = quote.status === 'PAID';
  const isInvoiced = quote.status === 'INVOICED';
  const isSigned = quote.status === 'SIGNED_LOCKED';
  const isDraft = quote.status === 'DRAFT';

  const badgeBg = isPaid
    ? colors.successLight
    : isInvoiced
    ? colors.primaryLight
    : isSigned
    ? colors.warningLight || colors.backgroundSecondary
    : colors.slateInfoLight;

  const badgeTextColor = isPaid
    ? colors.emerald
    : isInvoiced
    ? colors.primary
    : isSigned
    ? colors.amber
    : colors.slateInfo;

  const badgeLabel = isPaid ? 'Paid' : isInvoiced ? 'Invoice Issued' : isSigned ? 'Signed & Locked' : 'Draft';

  const profile = useQuoteStore((state) => state.profile);
  const curSymbol = quote.currencySymbol || profile?.currencySymbol || '$';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {/* Header Row: Client Name & Amount */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.clientName, { color: colors.textPrimary }]} numberOfLines={1}>
            {quote.clientName}
          </Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]} numberOfLines={1}>
            #{quote.quoteNumber} • {quote.jobDescription || 'Standard Service'}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, { color: colors.textPrimary }]}>
            {CurrencyService.format(quote.totalAmountCents, curSymbol)}
          </Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {new Date(quote.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Status Pill & Metadata Row */}
      <View style={styles.badgeRow}>
        <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
          <View style={[styles.statusDot, { backgroundColor: badgeTextColor }]} />
          <Text style={[styles.statusText, { color: badgeTextColor }]}>{badgeLabel}</Text>
        </View>

        {quote.changeOrders && quote.changeOrders.length > 0 && (
          <View style={[styles.coBadge, { backgroundColor: colors.purpleLight }]}>
            <Text style={[styles.coText, { color: colors.purple }]}>
              +{quote.changeOrders.length} Add-on
            </Text>
          </View>
        )}

        {quote.pdfSha256Hash && (
          <Text style={[styles.hashText, { color: colors.textMuted }]}>
            SHA: {quote.pdfSha256Hash.substring(0, 8)}
          </Text>
        )}

        <View style={{ marginLeft: 'auto' }}>
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={[styles.actionRow, { borderTopColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.actionBtnSecondary,
            {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.backgroundSecondary,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onSharePDF();
          }}
          activeOpacity={0.8}
        >
          <FileText size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={[styles.actionBtnSecondaryText, { color: colors.textSecondary }]}>
            PDF
          </Text>
        </TouchableOpacity>

        {onShareWhatsApp && (
          <TouchableOpacity
            style={[
              styles.actionBtnSecondary,
              {
                backgroundColor: '#25D366' + '18',
                borderColor: '#25D366' + '50',
              },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onShareWhatsApp();
            }}
            activeOpacity={0.8}
          >
            <MessageCircle size={14} color="#25D366" style={{ marginRight: 4 }} />
            <Text style={[styles.actionBtnSecondaryText, { color: '#25D366', fontWeight: '800' }]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        )}

        {!isPaid && (
          <TouchableOpacity
            style={[styles.actionBtnPrimary, { backgroundColor: colors.emerald }]}
            onPress={(e) => {
              e.stopPropagation();
              onCollectPay();
            }}
            activeOpacity={0.85}
          >
            <CreditCard size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
            <Text style={styles.actionBtnPrimaryText}>Collect Payment</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    ...Theme.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subText: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  coText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hashText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
