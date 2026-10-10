import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Linking,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Settings, WifiOff, Search, X, Check, FileSpreadsheet } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { ExportService } from '../services/ExportService';
import { AlertService } from '../services/AlertService';
import { CurrencyService } from '../services/CurrencyService';
import { RegionPaymentService } from '../services/RegionPaymentService';
import { JobCard } from '../components/JobCard';
import { PaymentQRModal } from '../components/PaymentQRModal';
import { OfflineOutboxModal } from '../components/OfflineOutboxModal';
import { PaywallModal } from '../components/PaywallModal';
import { CompanyNamePromptModal } from '../components/CompanyNamePromptModal';
import { OutboxService } from '../services/OutboxService';
import { BillingService } from '../services/BillingService';
import { TelemetryService } from '../services/TelemetryService';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { formatLocalDateDisplay } from '../utils/dateUtils';
import { useAppSafeArea } from '../utils/safeArea';
import { useKeyboard } from '../utils/useKeyboard';
import { isQuoteOverdue } from '../utils/dateUtils';

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
  const insets = useAppSafeArea();
  const { isKeyboardVisible } = useKeyboard();

  const [selectedPaymentQuote, setSelectedPaymentQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);
  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [pendingPdfQuote, setPendingPdfQuote] = useState<Quote | null>(null);
  const updateProfile = useQuoteStore((state) => state.updateProfile);

  const usage = getMonthlyQuoteUsage();

  const handleOpenPaywall = async () => {
    if (!FEATURE_FLAGS.PAYMENT_ENABLED) return;
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

  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      ALL: quotes.length,
      OVERDUE: 0,
      SIGNED_LOCKED: 0,
      INVOICED: 0,
      PAID: 0,
      DRAFT: 0,
    };
    for (const q of quotes) {
      if (q.status === 'PAID') {
        counts.PAID++;
      } else {
        if (isQuoteOverdue(q)) {
          counts.OVERDUE++;
        }
        if (q.status === 'SIGNED_LOCKED') counts.SIGNED_LOCKED++;
        else if (q.status === 'INVOICED') counts.INVOICED++;
        else if (q.status === 'DRAFT') counts.DRAFT++;
      }
    }
    return counts;
  }, [quotes]);

  const filteredQuotes = quotes.filter((q) => {
    const isOverdue = isQuoteOverdue(q);
    const matchesStatus =
      activeFilter === 'ALL'
        ? true
        : (activeFilter as string) === 'OVERDUE'
        ? isOverdue
        : q.status === activeFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const cleanNumQuery = query.replace(/[^0-9.]/g, '');

    // 1. Client Details
    if (q.clientName.toLowerCase().includes(query)) return true;
    if (String(q.quoteNumber).includes(cleanNumQuery || query)) return true;
    if (q.clientPhone && q.clientPhone.includes(cleanNumQuery || query)) return true;
    if (q.clientEmail && q.clientEmail.toLowerCase().includes(query)) return true;
    if (q.clientAddress && q.clientAddress.toLowerCase().includes(query)) return true;
    if (q.placeOfSupply && q.placeOfSupply.toLowerCase().includes(query)) return true;

    // 2. Scope & Notes
    if (q.jobDescription && q.jobDescription.toLowerCase().includes(query)) return true;
    if (q.notes && q.notes.toLowerCase().includes(query)) return true;
    if (q.paymentTerms && q.paymentTerms.toLowerCase().includes(query)) return true;

    // 3. Products / Line Items (Description, HSN/SAC, Unit)
    if (
      q.lineItems &&
      q.lineItems.some(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          (item.hsnSac && item.hsnSac.toLowerCase().includes(query)) ||
          (item.unit && item.unit.toLowerCase().includes(query))
      )
    ) {
      return true;
    }

    // 4. Change Order Add-ons
    if (
      q.changeOrders &&
      q.changeOrders.some(
        (co) =>
          co.reason.toLowerCase().includes(query) ||
          co.addedItems.some((item) => item.description.toLowerCase().includes(query))
      )
    ) {
      return true;
    }

    // 5. Price / Amount / Balance Search
    if (cleanNumQuery) {
      const totalRupees = (q.totalAmountCents / 100).toFixed(0);
      const totalDecimal = (q.totalAmountCents / 100).toFixed(2);
      if (totalRupees.includes(cleanNumQuery) || totalDecimal.includes(cleanNumQuery)) return true;

      const depositRupees = ((q.depositAmountCents || 0) / 100).toFixed(0);
      if (q.depositAmountCents && depositRupees.includes(cleanNumQuery)) return true;

      const balanceRupees = (Math.max(0, q.totalAmountCents - (q.depositAmountCents || 0)) / 100).toFixed(0);
      if (balanceRupees.includes(cleanNumQuery)) return true;

      // Item level prices
      if (
        q.lineItems &&
        q.lineItems.some(
          (item) =>
            (item.unitPriceCents / 100).toFixed(0).includes(cleanNumQuery) ||
            (item.totalCents / 100).toFixed(0).includes(cleanNumQuery)
        )
      ) {
        return true;
      }
    }

    // 6. SHA-256 Hash or Status
    if (q.pdfSha256Hash && q.pdfSha256Hash.toLowerCase().includes(query)) return true;
    if (q.status.toLowerCase().includes(query)) return true;

    return false;
  });

  const curSymbol = profile?.currencySymbol || '$';

  const totalUncollected = quotes
    .filter((q) => q.status === 'SIGNED_LOCKED' || q.status === 'INVOICED')
    .reduce((sum, q) => {
      const deposit = q.depositAmountCents || 0;
      return sum + Math.max(0, q.totalAmountCents - deposit);
    }, 0);

  const totalCollected = quotes
    .reduce((sum, q) => {
      if (q.status === 'PAID') {
        return sum + q.totalAmountCents;
      }
      return sum + (q.depositAmountCents || 0);
    }, 0);

  const handleShareWhatsApp = (quote: Quote) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const regionConfig = RegionPaymentService.getConfig(profile?.currencyCode, curSymbol, profile?.region);
    const isPaid = quote.status === 'PAID';
    const depositCents = quote.depositAmountCents || 0;
    const balanceDueCents = Math.max(0, quote.totalAmountCents - depositCents);
    const docTypeLabel =
      quote.documentType === 'TAX_INVOICE' || quote.status === 'INVOICED'
        ? 'Tax Invoice'
        : quote.documentType === 'BILL_OF_SUPPLY'
        ? 'Bill of Supply'
        : quote.documentType === 'DELIVERY_CHALLAN'
        ? 'Delivery Challan'
        : 'Quotation / Estimate';
    const amountStr = `${curSymbol}${(quote.totalAmountCents / 100).toFixed(2)}`;
    const balStr = `${curSymbol}${(balanceDueCents / 100).toFixed(2)}`;
    const dueText = quote.dueDateTimestamp
      ? `\n📅 Due Date: ${formatLocalDateDisplay(quote.dueDateTimestamp, regionConfig.locale)}`
      : '';
    const balanceText = isPaid
      ? '\n✅ Status: Paid in Full'
      : depositCents > 0
      ? `\n💰 Advance Paid: ${curSymbol}${(depositCents / 100).toFixed(2)}\n⚠️ Balance Due: ${balStr}`
      : `\n⚠️ Total Due: ${balStr}`;
    const upiDetails = profile.upiId ? `\n💳 Pay via UPI: ${profile.upiId}` : '';
    const bankDetails = profile.bankAccountNumber
      ? `\n🏦 Bank: ${profile.bankName || ''} A/C: ${profile.bankAccountNumber} (IFSC: ${profile.bankIfsc || ''})`
      : '';

    const msg = `Dear ${quote.clientName},\n\nPlease find your ${docTypeLabel} #${quote.quoteNumber} for ${amountStr} from ${profile.businessName || 'our business'}.${balanceText}${dueText}${upiDetails}${bankDetails}\n\nThank you for choosing our services!`;
    const cleanPhone = (quote.clientPhone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(waUrl)
      .then((canOpen) => {
        if (canOpen) return Linking.openURL(waUrl);
        if (cleanPhone) return Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
        return handleSharePDF(quote);
      })
      .catch(() => handleSharePDF(quote));
  };

  const handleSharePDF = async (quote: Quote) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const needsCompanyName =
      !profile.hasCustomBusinessName &&
      (!profile.businessName || profile.businessName.trim() === '');
    if (needsCompanyName) {
      setPendingPdfQuote(quote);
      setShowCompanyModal(true);
    } else {
      await PDFService.generateAndSharePDF(quote, profile);
    }
  };

  const handleCompanySave = async (enteredName: string, enteredAddress: string) => {
    setShowCompanyModal(false);
    const updated = {
      ...profile,
      businessName: enteredName || profile.businessName,
      address: enteredAddress || profile.address,
      hasCustomBusinessName: true,
    };
    updateProfile(updated);
    if (pendingPdfQuote) {
      await PDFService.generateAndSharePDF(pendingPdfQuote, updated);
    }
  };

  const handleCompanySkip = async () => {
    setShowCompanyModal(false);
    if (pendingPdfQuote) {
      await PDFService.generateAndSharePDF(pendingPdfQuote, profile);
    }
  };

  const handleExportCSV = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const res = await ExportService.exportQuotesToCSV(quotes, profile);
    if (res.success) {
      AlertService.alert(
        'Export Ready',
        `Successfully generated Daybook accounting spreadsheet for ${quotes.length} record(s). Ready to open in Excel or share.`,
        undefined,
        'SUCCESS'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>JobSign</Text>
          <Text style={styles.brandSub}>{profile.businessName || 'Estimates & Invoices'}</Text>
        </View>
        <View style={styles.headerRight}>
          {pendingOutboxCount > 0 && (
            <TouchableOpacity
              style={styles.outboxIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowOutboxModal(true);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <WifiOff size={18} color={colors.amber} />
              <View style={styles.outboxBadge}>
                <Text style={styles.outboxBadgeText}>{pendingOutboxCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          {FEATURE_FLAGS.PAYMENT_ENABLED && (
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
          )}
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={handleExportCSV}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Export daybook spreadsheet"
          >
            <FileSpreadsheet size={18} color={colors.textSecondary} />
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
            {pendingOutboxCount} {pendingOutboxCount === 1 ? 'estimate' : 'estimates'} awaiting cloud dispatch · Tap to send
          </Text>
        </TouchableOpacity>
      )}

      {/* High-Impact Metrics Dashboard */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Outstanding</Text>
          <Text style={[styles.metricVal, { color: colors.amber }]}>
            {CurrencyService.format(totalUncollected, curSymbol, profile.currencyCode)}
          </Text>
          <Text style={styles.metricSub}>Awaiting collection</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Collected</Text>
          <Text style={[styles.metricVal, { color: colors.emerald }]}>
            {CurrencyService.format(totalCollected, curSymbol, profile.currencyCode)}
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
          placeholder="Search client, product, price, bill #..."
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

      {/* Segmented Filter Pills with Live Counts and Overdue Alert */}
      <View style={styles.filterRow}>
        {(['ALL', 'OVERDUE', 'SIGNED_LOCKED', 'INVOICED', 'PAID', 'DRAFT'] as const).map((tab) => {
          const count = tabCounts[tab] || 0;
          const isOverdueTab = tab === 'OVERDUE';
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                activeFilter === (tab as any) && styles.filterChipActive,
                isOverdueTab && count > 0 && { borderColor: colors.rose, borderWidth: 1.5 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Keyboard.dismiss();
                setFilter(tab as any);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === (tab as any) && styles.filterChipTextActive,
                  isOverdueTab && count > 0 && activeFilter !== (tab as any) && { color: colors.rose, fontWeight: '800' },
                ]}
              >
                {tab === 'ALL'
                  ? `All (${count})`
                  : tab === 'OVERDUE'
                  ? `Overdue (${count})`
                  : tab === 'SIGNED_LOCKED'
                  ? `Signed (${count})`
                  : tab === 'INVOICED'
                  ? `Invoiced (${count})`
                  : tab === 'PAID'
                  ? `Paid (${count})`
                  : `Draft (${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
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
            onShareWhatsApp={() => handleShareWhatsApp(item)}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
              {searchQuery ? 'No matching estimates found' : 'No estimates yet'}
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
      {!isKeyboardVisible && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 18 + insets.bottom }]}
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          if (!isPro && usage.isExceeded) {
            AlertService.alert({
              title: 'Free plan limit reached',
              message: `You've used all ${usage.limit} free estimates this month.\n\nUpgrade to JobSign Pro for unlimited estimates, digital seals, and change orders.`,
              type: 'INFO',
              buttons: [
                { text: 'Later', style: 'cancel' },
                { text: 'View Pro Plans', onPress: handleOpenPaywall },
              ],
            });
            return;
          }
          onNewQuote();
        }}
      >
        <Text style={styles.fabText}>New Estimate</Text>
      </TouchableOpacity>
      )}

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

      {/* Company Name Prompt Modal before PDF Generation */}
      <CompanyNamePromptModal
        visible={showCompanyModal}
        initialName={profile.hasCustomBusinessName ? profile.businessName : ''}
        initialAddress={profile.address || ''}
        onSave={handleCompanySave}
        onSkip={handleCompanySkip}
        onClose={() => setShowCompanyModal(false)}
      />
    </View>
  );
};
