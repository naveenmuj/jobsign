import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import { X } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { ChangeOrder, Quote } from '../types';
import { SignaturePad } from './SignaturePad';
import { PDFService } from '../services/PDFService';
import { AlertService } from '../services/AlertService';
import { useQuoteStore } from '../store/useQuoteStore';
import { useAppSafeArea } from '../utils/safeArea';
import { useKeyboard } from '../utils/useKeyboard';

interface ChangeOrderModalProps {
  quote: Quote;
  visible: boolean;
  onClose: () => void;
}

export const ChangeOrderModal: React.FC<ChangeOrderModalProps> = ({
  quote,
  visible,
  onClose,
}) => {
  const { addQuote, profile, isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  const curSymbol = quote.currencySymbol || profile?.currencySymbol || '$';

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parsedCents = Math.round((parseFloat(amountInput) || 0) * 100);
  const formattedAddOn = `${curSymbol}${(parsedCents / 100).toFixed(2)}`;
  const newTotalFormatted = `${curSymbol}${((quote.totalAmountCents + parsedCents) / 100).toFixed(2)}`;

  const handleProceedToSign = () => {
    if (!reason.trim()) {
      AlertService.alert({
        title: 'Reason Required',
        message: 'Please specify why this change order is needed (e.g. Hidden Pipe Leak).',
        type: 'WARNING',
      });
      return;
    }
    if (parsedCents <= 0) {
      AlertService.alert({
        title: 'Invalid Amount',
        message: 'Please enter a valid extra amount.',
        type: 'WARNING',
      });
      return;
    }
    setIsSigning(true);
  };

  const handleSaveSignature = async (svgPath: string) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const coId = Crypto.randomUUID();
      const newCO: ChangeOrder = {
        id: coId,
        quoteId: quote.id,
        orderNumber: (quote.changeOrders?.length || 0) + 1,
        reason: reason.trim(),
        addedItems: [
          {
            id: Crypto.randomUUID(),
            description: description.trim() || reason.trim(),
            unitPriceCents: parsedCents,
            quantity: 1,
            totalCents: parsedCents,
          },
        ],
        addedTotalCents: parsedCents,
        signatureSvg: svgPath,
        signatureTimestamp: Date.now(),
        pdfSha256Hash: '',
      };

      const updatedQuote: Quote = {
        ...quote,
        totalAmountCents: quote.totalAmountCents + parsedCents,
        subtotalCents: quote.subtotalCents + parsedCents,
        changeOrders: [...(quote.changeOrders || []), newCO],
        updatedAt: Date.now(),
      };

      const updatedHash = await PDFService.computeHash(updatedQuote);
      newCO.pdfSha256Hash = updatedHash;
      updatedQuote.pdfSha256Hash = updatedHash;

      await addQuote(updatedQuote);
      setIsSigning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AlertService.alert({
        title: 'Change Order Approved',
        message: `Add-on #${newCO.orderNumber} (${curSymbol}${(parsedCents / 100).toFixed(2)}) is locked. New job total is ${newTotalFormatted}.`,
        type: 'SUCCESS',
      });
      onClose();
    } catch (e: any) {
      AlertService.alert({
        title: 'Save Failed',
        message: e?.message || 'Could not save change order.',
        type: 'DANGER',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipSignature = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const nextOrderNum = (quote.changeOrders?.length || 0) + 1;

      const newCO: ChangeOrder = {
        id: Crypto.randomUUID(),
        quoteId: quote.id,
        orderNumber: nextOrderNum,
        reason: reason.trim(),
        addedItems: [
          {
            id: Crypto.randomUUID(),
            description: description.trim() || reason.trim(),
            unitPriceCents: parsedCents,
            quantity: 1,
            totalCents: parsedCents,
          },
        ],
        addedTotalCents: parsedCents,
        signatureSvg: '',
        signatureTimestamp: Date.now(),
        pdfSha256Hash: '',
      };

      const updatedQuote: Quote = {
        ...quote,
        totalAmountCents: quote.totalAmountCents + parsedCents,
        subtotalCents: quote.subtotalCents + parsedCents,
        changeOrders: [...(quote.changeOrders || []), newCO],
        updatedAt: Date.now(),
      };

      const updatedHash = await PDFService.computeHash(updatedQuote);
      newCO.pdfSha256Hash = updatedHash;
      updatedQuote.pdfSha256Hash = updatedHash;

      await addQuote(updatedQuote);
      setIsSigning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AlertService.alert({
        title: 'Change Order Added',
        message: `Add-on #${newCO.orderNumber} (${curSymbol}${(parsedCents / 100).toFixed(2)}) is added. New job total is ${newTotalFormatted}.`,
        type: 'SUCCESS',
      });
      onClose();
    } catch (e: any) {
      AlertService.alert({
        title: 'Save Failed',
        message: e?.message || 'Could not save change order.',
        type: 'DANGER',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  if (isSigning) {
    return (
      <Modal visible animationType="fade">
        <SignaturePad
          clientName={quote.clientName}
          totalFormatted={`${formattedAddOn} (New Total: ${newTotalFormatted})`}
          onCancel={() => setIsSigning(false)}
          onSave={handleSaveSignature}
          onSkip={handleSkipSignature}
          skipButtonText="Proceed without Signature"
        />
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingBottom: isKeyboardVisible ? keyboardHeight : 0 }]}>
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: isKeyboardVisible ? 14 : 20 + insets.bottom,
              maxHeight: isKeyboardVisible ? '100%' : '85%',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Change Order</Text>
              <Text style={styles.sub}>Agreement #{quote.quoteNumber} for {quote.clientName}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Explanation Banner */}
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>
                Protects against unpaid scope adjustments. Appends a signed rider to the original agreement.
              </Text>
            </View>

            {/* Form */}
            <Text style={styles.label}>UNFORESEEN SCOPE / REASON</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Subfloor moisture damage under tub"
              placeholderTextColor={colors.textMuted}
              value={reason}
              onChangeText={setReason}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>ADDITIONAL AMOUNT ({curSymbol})</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amountInput}
              onChangeText={setAmountInput}
            />

            {/* Live Total Comparison */}
            <View style={styles.comparisonBox}>
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Original Agreement:</Text>
                <Text style={styles.compareVal}>{curSymbol}{(quote.totalAmountCents / 100).toFixed(2)}</Text>
              </View>
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>This Add-On:</Text>
                <Text style={[styles.compareVal, { color: colors.amber }]}>+{formattedAddOn}</Text>
              </View>
              <View style={[styles.compareRow, styles.totalRow]}>
                <Text style={styles.newTotalLabel}>NEW AGREEMENT TOTAL:</Text>
                <Text style={styles.newTotalVal}>{newTotalFormatted}</Text>
              </View>
            </View>

            {/* Action */}
            <TouchableOpacity style={styles.signBtn} onPress={handleProceedToSign}>
              <Text style={styles.signBtnText}>Proceed to Client Signature</Text>
            </TouchableOpacity>
          </ScrollView>
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
      borderTopLeftRadius: Theme.borderRadius.xl,
      borderTopRightRadius: Theme.borderRadius.xl,
      padding: 24,
      paddingBottom: 40,
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
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    closeText: {
      fontSize: 18,
      color: colors.textMuted,
      fontWeight: 'bold',
    },
    infoBanner: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary + '33',
      padding: 12,
      borderRadius: Theme.borderRadius.sm,
      marginVertical: 14,
    },
    infoText: {
      fontSize: 12,
      color: colors.primary,
      lineHeight: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: Theme.borderRadius.sm,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
    },
    priceInput: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.emerald,
    },
    comparisonBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.md,
      padding: 14,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    compareRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    compareLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    compareVal: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    totalRow: {
      borderTopWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      paddingTop: 8,
    },
    newTotalLabel: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    newTotalVal: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.emerald,
    },
    signBtn: {
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    signBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
