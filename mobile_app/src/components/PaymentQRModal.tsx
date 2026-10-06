import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';

export const PaymentQRModal: React.FC<{ quote: Quote; onClose: () => void }> = ({
  quote,
  onClose,
}) => {
  const { addQuote } = useQuoteStore();
  const [activeRail, setActiveRail] = useState<'ZELLE' | 'VENMO' | 'CASHAPP' | 'BANK'>('ZELLE');

  const amountFormatted = `$${(quote.totalAmountCents / 100).toFixed(2)}`;

  const handleMarkAsPaid = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated: Quote = {
      ...quote,
      status: 'PAID',
      updatedAt: Date.now(),
    };
    await addQuote(updated);
    Alert.alert('Payment Recorded! 🎉', `Job #${quote.quoteNumber} has been marked PAID and closed.`);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <div>
              <Text style={styles.title}>Direct Settlement (0% Fee)</Text>
              <Text style={styles.sub}>Client scans contractor phone screen</Text>
            </div>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Due Display */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>COLLECT FROM {quote.clientName.toUpperCase()}</Text>
            <Text style={styles.amountVal}>{amountFormatted}</Text>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.railTabs}>
            {(['ZELLE', 'VENMO', 'CASHAPP', 'BANK'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.railTab, activeRail === r && styles.railTabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveRail(r);
                }}
              >
                <Text style={[styles.railTabText, activeRail === r && styles.railTabTextActive]}>
                  {r === 'CASHAPP' ? 'Cash App' : r === 'BANK' ? 'Bank Wire' : r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Simulated High-Density QR Canvas */}
          <View style={styles.qrContainer}>
            <View style={styles.qrFrame}>
              {/* Visual simulated QR pattern */}
              <Svg height="180" width="180" viewBox="0 0 100 100">
                <Rect x="5" y="5" width="25" height="25" fill="#0F172A" />
                <Rect x="10" y="10" width="15" height="15" fill="#FFFFFF" />
                <Rect x="70" y="5" width="25" height="25" fill="#0F172A" />
                <Rect x="75" y="10" width="15" height="15" fill="#FFFFFF" />
                <Rect x="5" y="70" width="25" height="25" fill="#0F172A" />
                <Rect x="10" y="75" width="15" height="15" fill="#FFFFFF" />
                <Rect x="35" y="35" width="30" height="30" fill="#0F172A" />
                <Rect x="40" y="15" width="8" height="8" fill="#0F172A" />
                <Rect x="55" y="15" width="8" height="8" fill="#0F172A" />
                <Rect x="15" y="45" width="8" height="8" fill="#0F172A" />
                <Rect x="75" y="45" width="8" height="8" fill="#0F172A" />
                <Rect x="45" y="75" width="12" height="12" fill="#0F172A" />
              </Svg>
            </View>
            <Text style={styles.qrHint}>
              Have client open camera or {activeRail} app to pay {amountFormatted} directly.
            </Text>
          </View>

          {/* 1-Tap Confirmation */}
          <TouchableOpacity style={styles.confirmPaidBtn} onPress={handleMarkAsPaid}>
            <Text style={styles.confirmPaidText}>✔ CONFIRM PAID IN FULL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    padding: 24,
    paddingBottom: 44,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  sub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
  },
  amountBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  amountVal: {
    fontSize: 32,
    fontWeight: '900',
    color: Theme.colors.primary,
    marginTop: 4,
  },
  railTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  railTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  railTabActive: {
    backgroundColor: Theme.colors.accent,
    borderColor: Theme.colors.accent,
  },
  railTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  railTabTextActive: {
    color: '#FFFFFF',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
  },
  qrHint: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  confirmPaidBtn: {
    backgroundColor: Theme.colors.success,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmPaidText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
