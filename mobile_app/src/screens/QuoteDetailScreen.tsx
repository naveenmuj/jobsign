import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote } from '../types';
import { PDFService } from '../services/PDFService';
import { ChangeOrderModal } from '../components/ChangeOrderModal';
import { PaymentQRModal } from '../components/PaymentQRModal';
import { useQuoteStore } from '../store/useQuoteStore';
import { ChevronLeft, Trash2, FileText, Phone, MessageSquare, Plus, Check } from 'lucide-react-native';

interface QuoteDetailScreenProps {
  quote: Quote;
  onBack: () => void;
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
      paddingHorizontal: 16,
      paddingTop: 54,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    backBtn: {
      padding: 6,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    shareBtn: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    shareText: {
      color: colors.textPrimary,
      fontWeight: 'bold',
      fontSize: 13,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    securityCard: {
      padding: 16,
      borderRadius: Theme.borderRadius.md,
      marginBottom: 16,
      borderWidth: 1.5,
    },
    secLocked: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    secPaid: {
      backgroundColor: colors.successLight,
      borderColor: colors.emerald,
    },
    secShield: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    secDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 16,
    },
    hashBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      backgroundColor: colors.backgroundSecondary,
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hashLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.textMuted,
    },
    hashVal: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: colors.textHighlight,
      flex: 1,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Theme.borderRadius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 14,
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    coCard: {
      borderColor: colors.purple + '66',
      backgroundColor: colors.purpleLight,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    clientName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    clientDetail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    clientDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.borderSubtle,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    itemSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    coRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.purple + '33',
    },
    coTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    coDate: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    coAmount: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.amber,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    sumLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    sumVal: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    totalRow: {
      borderTopWidth: 1.5,
      borderColor: colors.border,
      marginTop: 8,
      paddingTop: 10,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    totalVal: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.emerald,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: 16,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    coBtn: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 6,
    },
    coBtnText: {
      color: colors.textPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
    payBtn: {
      flex: 2,
      backgroundColor: colors.emerald,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    payBtnText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 15,
    },
    receiptBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    receiptBtnText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 15,
    },
    clientHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    contactActionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    contactBtn: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    contactBtnSms: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    contactBtnText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    photoPreview: {
      width: '100%',
      height: 180,
      borderRadius: Theme.borderRadius.sm,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: 8,
    },
    photoCaption: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    trashBtn: {
      padding: 8,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.roseLight,
      borderWidth: 1,
      borderColor: colors.rose + '40',
    },
    notesText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    auditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderColor: colors.borderSubtle,
    },
    auditLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    auditVal: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '500',
    },
  });

export const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({ quote: initialQuote, onBack }) => {
  const { quotes, profile, deleteQuote } = useQuoteStore();
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const quote = quotes.find((q) => q.id === initialQuote.id) || initialQuote;

  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const [showChangeOrder, setShowChangeOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const isPaid = quote.status === 'PAID';
  const isLocked = quote.status === 'SIGNED_LOCKED';

  const handleSharePDF = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await PDFService.generateAndSharePDF(quote, profile);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Agreement?',
      `Are you sure you want to permanently delete Agreement #${quote.quoteNumber} for ${quote.clientName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteQuote(quote.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <ChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agreement #{quote.quoteNumber}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.trashBtn}
            onPress={handleDelete}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Trash2 size={18} color={colors.rose} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleSharePDF}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <FileText size={14} color={colors.textPrimary} />
            <Text style={styles.shareText}>Share PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Security Banner */}
        <View style={[styles.securityCard, isPaid ? styles.secPaid : styles.secLocked]}>
          <Text style={styles.secShield}>{isPaid ? 'Paid in Full' : 'Digitally Sealed'}</Text>
          <Text style={styles.secDesc}>
            {isPaid
              ? 'This job has been paid in full and released.'
              : 'Affirmative client consent captured on glass. Tamper-evident SHA-256 seal active.'}
          </Text>
          {quote.pdfSha256Hash && (
            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>HASH:</Text>
              <Text style={styles.hashVal}>{quote.pdfSha256Hash}</Text>
            </View>
          )}
        </View>

        {/* Client & Scope Card */}
        <View style={styles.card}>
          <View style={styles.clientHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Client</Text>
              <Text style={styles.clientName}>{quote.clientName}</Text>
            </View>
            {quote.clientPhone && (
              <View style={styles.contactActionsRow}>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`tel:${quote.clientPhone}`);
                  }}
                >
                  <Phone size={12} color={colors.textPrimary} />
                  <Text style={styles.contactBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactBtn, styles.contactBtnSms]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`sms:${quote.clientPhone}?body=Hi ${quote.clientName}, regarding agreement #${quote.quoteNumber}...`);
                  }}
                >
                  <MessageSquare size={12} color={colors.primary} />
                  <Text style={[styles.contactBtnText, { color: colors.primary }]}>Text</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {quote.clientPhone && <Text style={styles.clientDetail}>{quote.clientPhone}</Text>}
          {quote.jobDescription && (
            <Text style={styles.clientDetail}>{quote.jobDescription}</Text>
          )}
          <Text style={styles.clientDate}>Created: {new Date(quote.createdAt).toLocaleString()}</Text>
        </View>

        {/* Worksite Evidence Photo (If captured) */}
        {quote.photoUri && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Worksite Photo</Text>
            <Image
              source={{ uri: quote.photoUri }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <Text style={styles.photoCaption}>
              Captured before work started. Sealed inside PDF Exhibit A.
            </Text>
          </View>
        )}

        {/* Line Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Approved Line Items ({quote.lineItems.length})</Text>
          {quote.lineItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.description}</Text>
                <Text style={styles.itemSub}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemAmount}>${(item.totalCents / 100).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Change Orders Card (If any exist) */}
        {quote.changeOrders && quote.changeOrders.length > 0 && (
          <View style={[styles.card, styles.coCard]}>
            <Text style={[styles.cardLabel, { color: colors.purple }]}>
              Change Orders ({quote.changeOrders.length})
            </Text>
            {quote.changeOrders.map((co) => (
              <View key={co.id} style={styles.coRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coTitle}>Add-On #{co.orderNumber}: {co.reason}</Text>
                  <Text style={styles.coDate}>{new Date(co.signatureTimestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.coAmount}>+${(co.addedTotalCents / 100).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals Summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Original Scope</Text>
            <Text style={styles.sumVal}>${(quote.subtotalCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>
              Sales Tax ({((quote.taxRateBasisPoints ?? 825) / 100).toFixed(2)}%)
            </Text>
            <Text style={styles.sumVal}>${(quote.taxAmountCents / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT DUE</Text>
            <Text style={styles.totalVal}>${(quote.totalAmountCents / 100).toFixed(2)}</Text>
          </View>
        </View>

        {/* Legal Terms & Work Conditions (If specified) */}
        {quote.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Terms & Warranty</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Courtroom Audit Attribution */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Digital Audit Certificate</Text>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Signing Timestamp:</Text>
            <Text style={styles.auditVal}>
              {quote.signatureTimestamp ? new Date(quote.signatureTimestamp).toLocaleString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>GPS Verification:</Text>
            <Text style={styles.auditVal}>
              {quote.signatureGpsLat && quote.signatureGpsLng
                ? `${quote.signatureGpsLat.toFixed(5)}°, ${quote.signatureGpsLng.toFixed(5)}° (On-Site)`
                : 'Offline Field Stamped'}
            </Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Integrity Seal:</Text>
            <Text style={[styles.auditVal, { color: colors.emerald, fontWeight: 'bold' }]}>
              LOCKED_IMMUTABLE (SHA-256)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        {!isPaid && (
          <TouchableOpacity
            style={styles.coBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowChangeOrder(true);
            }}
          >
            <Plus size={16} color={colors.textPrimary} />
            <Text style={styles.coBtnText}>Add Change Order</Text>
          </TouchableOpacity>
        )}

        {!isPaid ? (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setShowPayment(true);
            }}
          >
            <Text style={styles.payBtnText}>Collect Payment</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.receiptBtn} onPress={handleSharePDF}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.receiptBtnText}>Send Receipt</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      {showChangeOrder && (
        <ChangeOrderModal
          quote={quote}
          visible={showChangeOrder}
          onClose={() => setShowChangeOrder(false)}
        />
      )}

      {showPayment && (
        <PaymentQRModal
          quote={quote}
          onClose={() => setShowPayment(false)}
        />
      )}
    </View>
  );
};
