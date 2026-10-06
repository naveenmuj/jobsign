import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { ChangeOrder, LineItem, Quote } from '../types';
import { SignaturePad } from './SignaturePad';
import { PDFService } from '../services/PDFService';
import { useQuoteStore } from '../store/useQuoteStore';

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
  const { addQuote } = useQuoteStore();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const parsedCents = Math.round((parseFloat(amountInput) || 0) * 100);
  const formattedAddOn = `$${(parsedCents / 100).toFixed(2)}`;
  const newTotalFormatted = `$${((quote.totalAmountCents + parsedCents) / 100).toFixed(2)}`;

  const handleProceedToSign = () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please specify why this change order is needed (e.g. Hidden Pipe Leak).');
      return;
    }
    if (parsedCents <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid extra dollar amount.');
      return;
    }
    setIsSigning(true);
  };

  const handleSaveSignature = async (svgPath: string) => {
    const newCO: ChangeOrder = {
      id: Math.random().toString(36).substring(7),
      quoteId: quote.id,
      orderNumber: (quote.changeOrders?.length || 0) + 1,
      reason: reason.trim(),
      addedItems: [
        {
          id: Math.random().toString(36).substring(7),
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

    newCO.pdfSha256Hash = await PDFService.computeHash(quote);

    const updatedQuote: Quote = {
      ...quote,
      totalAmountCents: quote.totalAmountCents + parsedCents,
      subtotalCents: quote.subtotalCents + parsedCents,
      changeOrders: [...(quote.changeOrders || []), newCO],
      updatedAt: Date.now(),
    };

    await addQuote(updatedQuote);
    setIsSigning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Change Order Approved! ✍️',
      `Add-on #${newCO.orderNumber} ($${(parsedCents / 100).toFixed(2)}) is locked. New job total is ${newTotalFormatted}.`
    );
    onClose();
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
        />
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>➕ Mid-Job Change Order</Text>
              <Text style={styles.sub}>Job #{quote.quoteNumber} for {quote.clientName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Explanation Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              Protects you against unpaid scope creep. Adds an approved amendment rider to the original agreement.
            </Text>
          </View>

          {/* Form */}
          <Text style={styles.label}>UNFORESEEN ISSUE / REASON</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Rotten subfloor found under tub"
            placeholderTextColor={Theme.colors.textMuted}
            value={reason}
            onChangeText={setReason}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>ADDITIONAL PRICE ($ USD)</Text>
          <TextInput
            style={[styles.input, styles.priceInput]}
            placeholder="180.00"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="decimal-pad"
            value={amountInput}
            onChangeText={setAmountInput}
          />

          {/* Live Total Comparison */}
          <View style={styles.comparisonBox}>
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>Original Agreement:</Text>
              <Text style={styles.compareVal}>${(quote.totalAmountCents / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>This Add-On:</Text>
              <Text style={[styles.compareVal, { color: Theme.colors.amber }]}>+{formattedAddOn}</Text>
            </View>
            <View style={[styles.compareRow, styles.totalRow]}>
              <Text style={styles.newTotalLabel}>NEW APPROVED TOTAL:</Text>
              <Text style={styles.newTotalVal}>{newTotalFormatted}</Text>
            </View>
          </View>

          {/* Action */}
          <TouchableOpacity style={styles.signBtn} onPress={handleProceedToSign}>
            <Text style={styles.signBtnText}>✍️ HAND PHONE TO CLIENT TO APPROVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  sub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
  },
  infoBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    padding: 12,
    borderRadius: Theme.borderRadius.sm,
    marginVertical: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#93C5FD',
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Theme.borderRadius.sm,
    padding: 12,
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  priceInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.emerald,
  },
  comparisonBox: {
    backgroundColor: '#0F172A',
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  compareLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  compareVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderColor: '#334155',
    marginTop: 8,
    paddingTop: 8,
  },
  newTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  newTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: Theme.colors.emerald,
  },
  signBtn: {
    backgroundColor: Theme.colors.primary,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glowPrimary,
  },
  signBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
