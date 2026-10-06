import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { LineItem, Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { SignaturePad } from '../components/SignaturePad';
import { PDFService } from '../services/PDFService';

export const QuoteBuilderScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { presets, addQuote } = useQuoteStore();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [isSigning, setIsSigning] = useState(false);

  // 1-Tap Preset Addition
  const handleAddPreset = (preset: (typeof presets)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItem: LineItem = {
      id: Math.random().toString(36).substring(7),
      description: preset.title,
      unitPriceCents: preset.priceCents,
      quantity: 1,
      totalCents: preset.priceCents,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const taxBasisPoints = 825; // 8.25% default
  const taxAmountCents = Math.round((subtotalCents * taxBasisPoints) / 10000);
  const totalAmountCents = subtotalCents + taxAmountCents;

  const totalFormatted = `$${(totalAmountCents / 100).toFixed(2)}`;

  const handleStartSignature = () => {
    if (!clientName.trim()) {
      Alert.alert('Missing Client Name', 'Please enter client name before signing.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('No Line Items', 'Please add at least one line item to the estimate.');
      return;
    }
    setIsSigning(true);
  };

  const handleSaveSignature = async (svgPath: string) => {
    const newQuote: Quote = {
      id: Math.random().toString(36).substring(7),
      quoteNumber: Math.floor(1000 + Math.random() * 9000),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      status: 'SIGNED_LOCKED',
      subtotalCents,
      taxRateBasisPoints: taxBasisPoints,
      taxAmountCents,
      totalAmountCents,
      signatureSvg: svgPath,
      signatureTimestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lineItems: items,
    };

    // Seal and compute SHA-256
    newQuote.pdfSha256Hash = await PDFService.computeHash(newQuote);

    await addQuote(newQuote);
    setIsSigning(false);

    // Prompt to share PDF immediately
    Alert.alert(
      'Estimate Locked & Approved! 🔒',
      `Quote #${newQuote.quoteNumber} for ${newQuote.clientName} is legally sealed. Would you like to text or email the PDF to the client now?`,
      [
        { text: 'Later', style: 'cancel', onPress: onBack },
        {
          text: 'Send PDF Now',
          onPress: async () => {
            await PDFService.generateAndSharePDF(newQuote);
            onBack();
          },
        },
      ]
    );
  };

  if (isSigning) {
    return (
      <SignaturePad
        clientName={clientName}
        totalFormatted={totalFormatted}
        onCancel={() => setIsSigning(false)}
        onSave={handleSaveSignature}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>⬅ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New 60-Sec Estimate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Client Input */}
        <View style={styles.card}>
          <Text style={styles.label}>CLIENT DETAILS</Text>
          <TextInput
            style={styles.input}
            placeholder="Client Name (e.g. Sarah Jenkins)"
            placeholderTextColor={Theme.colors.textMuted}
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Phone Number (optional)"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="phone-pad"
            value={clientPhone}
            onChangeText={setClientPhone}
          />
        </View>

        {/* 1-Tap Item Presets Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1-TAP ITEM PRESETS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetChip}
              onPress={() => handleAddPreset(preset)}
            >
              <Text style={styles.presetTitle}>+ {preset.title}</Text>
              <Text style={styles.presetPrice}>${(preset.priceCents / 100).toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Items */}
        <View style={styles.card}>
          <Text style={styles.label}>ESTIMATE LINE ITEMS ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Tap a preset above to quickly add items.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  <Text style={styles.itemSub}>Qty: {item.quantity} × ${(item.unitPriceCents / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.itemTotal}>${(item.totalCents / 100).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>${(subtotalCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Tax (8.25%)</Text>
            <Text style={styles.summaryVal}>${(taxAmountCents / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalVal}>{totalFormatted}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.signButton} onPress={handleStartSignature}>
          <Text style={styles.signButtonText}>✍️ HAND PHONE TO CLIENT TO SIGN</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderColor: Theme.colors.borderSubtle,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    padding: 12,
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  presetScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.accent,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  presetPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  itemSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginRight: 12,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderColor: Theme.colors.primary,
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1.5,
    borderColor: Theme.colors.borderSubtle,
  },
  signButton: {
    backgroundColor: Theme.colors.success,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  signButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
