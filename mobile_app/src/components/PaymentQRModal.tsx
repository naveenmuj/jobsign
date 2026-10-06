import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';

export const PaymentQRModal: React.FC<{ quote: Quote; onClose: () => void }> = ({
  quote,
  onClose,
}) => {
  const { addQuote, profile } = useQuoteStore();
  const [activeRail, setActiveRail] = useState<'ZELLE' | 'VENMO' | 'CASHAPP' | 'BANK'>('ZELLE');
  const [isProcessing, setIsProcessing] = useState(false);

  const amountFormatted = `$${(quote.totalAmountCents / 100).toFixed(2)}`;

  const getPayload = (): string => {
    const amtStr = (quote.totalAmountCents / 100).toFixed(2);
    switch (activeRail) {
      case 'ZELLE':
        return profile.zelleAccount
          ? `zelle:${profile.zelleAccount}?amount=${amtStr}`
          : `zelle:payments@jobsign.app?amount=${amtStr}`;
      case 'VENMO':
        return profile.venmoAccount
          ? `https://venmo.com/${profile.venmoAccount.replace('@', '')}?txn=pay&amount=${amtStr}&note=Agreement%20${quote.quoteNumber}`
          : 'https://venmo.com';
      case 'CASHAPP':
        return profile.cashAppAccount
          ? `https://cash.app/${profile.cashAppAccount.replace('$', '')}/${amtStr}`
          : 'https://cash.app';
      case 'BANK':
        return `Direct Bank Settlement for ${profile.businessName}\nAmount Due: $${amtStr}\nRef: Agreement #${quote.quoteNumber}`;
    }
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Confirm Settlement Received',
      `Mark Agreement #${quote.quoteNumber} (${amountFormatted}) as PAID IN FULL?\n\nThis certifies receipt of funds and automatically generates an audited Mechanic's Lien Waiver and Release on the receipt.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Release Lien',
          style: 'default',
          onPress: async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const updated: Quote = {
                ...quote,
                status: 'PAID',
                updatedAt: Date.now(),
              };
              await addQuote(updated);
              Alert.alert('Payment Recorded! 🎉', `Job #${quote.quoteNumber} has been marked PAID and closed.`);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not update payment status.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const currentPayload = getPayload();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Direct Settlement (0% Fee)</Text>
              <Text style={styles.sub}>Client scans contractor phone screen</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
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

          {/* Missing Handle Warning */}
          {((activeRail === 'ZELLE' && !profile.zelleAccount) ||
            (activeRail === 'VENMO' && !profile.venmoAccount) ||
            (activeRail === 'CASHAPP' && !profile.cashAppAccount)) && (
            <View style={styles.warnBanner}>
              <Text style={styles.warnText}>
                ⚠️ You haven't added your {activeRail === 'CASHAPP' ? 'Cash App' : activeRail} username in Settings yet.
              </Text>
            </View>
          )}

          {/* Dynamic High-Density QR Canvas */}
          <View style={styles.qrContainer}>
            <View style={styles.qrFrame}>
              <QRCode
                value={currentPayload}
                size={180}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrHint}>
              Have client open camera or {activeRail} app to pay {amountFormatted} directly.
            </Text>
          </View>

          {/* 1-Tap Confirmation */}
          <TouchableOpacity
            style={[styles.confirmPaidBtn, isProcessing && { opacity: 0.7 }]}
            onPress={handleMarkAsPaid}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmPaidText}>✔ CONFIRM PAID IN FULL</Text>
            )}
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
    backgroundColor: '#F1F5F9',
    borderRadius: Theme.borderRadius.sm,
    padding: 4,
    marginBottom: 16,
  },
  railTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  railTabActive: {
    backgroundColor: '#FFFFFF',
    ...Theme.shadows.card,
  },
  railTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  railTabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  qrFrame: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    marginBottom: 12,
  },
  qrHint: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  confirmPaidBtn: {
    backgroundColor: Theme.colors.emerald,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...Theme.shadows.glowSuccess,
  },
  confirmPaidText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  warnBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: Theme.borderRadius.sm,
    padding: 10,
    marginBottom: 10,
  },
  warnText: {
    color: '#FBBF24',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
