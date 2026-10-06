import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';

export const PaymentQRModal: React.FC<{ quote: Quote; onClose: () => void }> = ({
  quote,
  onClose,
}) => {
  const { addQuote, profile, isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      'Confirm Payment Received',
      `Mark Agreement #${quote.quoteNumber} (${amountFormatted}) as paid in full?\n\nThis certifies receipt of funds and automatically releases the mechanic's lien on the digital receipt.`,
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
              Alert.alert('Payment Recorded', `Agreement #${quote.quoteNumber} has been marked as paid.`);
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
              <Text style={styles.title}>Direct Payment</Text>
              <Text style={styles.sub}>Client scans contractor screen directly</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Due Display */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>AMOUNT DUE FROM {quote.clientName.toUpperCase()}</Text>
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
                No {activeRail === 'CASHAPP' ? 'Cash App' : activeRail} username configured in Settings yet.
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
              Have client scan with their camera or {activeRail} app to settle {amountFormatted}.
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
              <Text style={styles.confirmPaidText}>Confirm Paid in Full</Text>
            )}
          </TouchableOpacity>
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
      borderTopLeftRadius: Theme.borderRadius.lg,
      borderTopRightRadius: Theme.borderRadius.lg,
      padding: 24,
      paddingBottom: 44,
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
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    closeText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textMuted,
    },
    amountBox: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: Theme.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      marginVertical: 16,
    },
    amountLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    amountVal: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.primary,
      marginTop: 4,
    },
    railTabs: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
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
      backgroundColor: colors.surface,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    railTabText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    railTabTextActive: {
      color: colors.primary,
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
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    qrHint: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
      lineHeight: 16,
    },
    confirmPaidBtn: {
      backgroundColor: colors.emerald,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    confirmPaidText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    warnBanner: {
      backgroundColor: colors.warningLight,
      borderWidth: 1,
      borderColor: colors.amber + '40',
      borderRadius: Theme.borderRadius.sm,
      padding: 10,
      marginBottom: 10,
    },
    warnText: {
      color: colors.amber,
      fontSize: 12,
      textAlign: 'center',
      fontWeight: '600',
    },
  });
