import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { X, Check, Edit3, ShieldCheck, AlertCircle, Building2, Smartphone, Landmark } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { NotificationService } from '../services/NotificationService';
import { AlertService } from '../services/AlertService';
import { useAppSafeArea } from '../utils/safeArea';

export const PaymentQRModal: React.FC<{ quote: Quote; onClose: () => void }> = ({
  quote,
  onClose,
}) => {
  const { addQuote, profile, updateProfile, isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();

  const curSymbol = quote.currencySymbol || profile?.currencySymbol || '$';
  const isIndia = curSymbol === '₹' || profile?.currencyCode === 'INR';

  type RailType = 'UPI' | 'ZELLE' | 'VENMO' | 'CASHAPP' | 'BANK';
  const [activeRail, setActiveRail] = useState<RailType>(isIndia ? 'UPI' : 'ZELLE');
  const [isProcessing, setIsProcessing] = useState(false);

  // Inline UPI editing state
  const [isEditingUpi, setIsEditingUpi] = useState(!profile?.upiId && isIndia);
  const [upiInput, setUpiInput] = useState(profile?.upiId || '');
  const [upiNameInput, setUpiNameInput] = useState(
    profile?.upiPayeeName || profile?.businessName || profile?.ownerName || 'JobSign Contractor'
  );
  const [upiError, setUpiError] = useState('');

  const amountDecimal = (quote.totalAmountCents / 100).toFixed(2);
  const amountFormatted = `${curSymbol}${amountDecimal}`;

  const handleSaveUpi = () => {
    const trimmedId = upiInput.trim().toLowerCase();
    if (!trimmedId) {
      setUpiError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm)');
      return;
    }
    if (!trimmedId.includes('@')) {
      setUpiError('UPI ID must include an @ handle (e.g. name@okhdfcbank, mobile@paytm)');
      return;
    }
    setUpiError('');
    updateProfile({
      upiId: trimmedId,
      upiPayeeName: upiNameInput.trim() || profile?.businessName || profile?.ownerName || 'JobSign Contractor',
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditingUpi(false);
  };

  const getPayload = (): string => {
    const amtStr = (quote.totalAmountCents / 100).toFixed(2);
    switch (activeRail) {
      case 'UPI': {
        const upiId = (profile?.upiId || '').trim();
        const payeeName = (
          profile?.upiPayeeName ||
          profile?.businessName ||
          profile?.ownerName ||
          'JobSign Contractor'
        ).trim();
        if (!upiId) return '';
        // Standard NPCI UPI Intent Format:
        // upi://pay?pa={UPI_ID}&pn={NAME}&am={AMOUNT}&cu=INR&tn={NOTE}
        return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
          payeeName
        )}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(`Payment for Quote #${quote.quoteNumber}`)}`;
      }
      case 'ZELLE':
        return profile?.zelleAccount
          ? `zelle:${profile.zelleAccount}?amount=${amtStr}`
          : `zelle:payments@jobsign.app?amount=${amtStr}`;
      case 'VENMO':
        return profile?.venmoAccount
          ? `https://venmo.com/${profile.venmoAccount.replace('@', '')}?txn=pay&amount=${amtStr}&note=Agreement%20${quote.quoteNumber}`
          : 'https://venmo.com';
      case 'CASHAPP':
        return profile?.cashAppAccount
          ? `https://cash.app/${profile.cashAppAccount.replace('$', '')}/${amtStr}`
          : 'https://cash.app';
      case 'BANK': {
        if (isIndia && (profile?.bankAccountNumber || profile?.bankIfsc)) {
          return `Bank Transfer (IMPS/NEFT):\nBeneficiary: ${
            profile?.upiPayeeName || profile?.businessName
          }\nA/C: ${profile?.bankAccountNumber || 'N/A'}\nIFSC: ${profile?.bankIfsc || 'N/A'}\nBank: ${
            profile?.bankName || 'N/A'
          }\nAmount: ${curSymbol}${amtStr}\nRef: Quote #${quote.quoteNumber}`;
        }
        return `Direct Bank Settlement for ${profile?.businessName}\nAmount Due: ${curSymbol}${amtStr}\nRef: Agreement #${quote.quoteNumber}`;
      }
    }
  };

  const handleMarkAsPaid = () => {
    AlertService.alert({
      title: 'Confirm Payment Received',
      message: `Mark Agreement #${quote.quoteNumber} (${amountFormatted}) as paid in full?\n\nThis certifies receipt of funds and automatically releases the mechanic's lien on the digital receipt.`,
      type: 'INFO',
      buttons: [
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
              await NotificationService.notifyPaymentReceived(
                quote.quoteNumber,
                quote.clientName,
                quote.totalAmountCents
              );
              await NotificationService.cancelReminder(quote.id);
              AlertService.alert({
                title: 'Payment Recorded',
                message: `Agreement #${quote.quoteNumber} has been marked as paid.`,
                type: 'SUCCESS',
              });
              onClose();
            } catch (err: any) {
              AlertService.alert({
                title: 'Error',
                message: err?.message || 'Could not update payment status.',
                type: 'DANGER',
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    });
  };

  const currentPayload = getPayload();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Direct Payment</Text>
              <Text style={styles.sub}>
                {isIndia
                  ? 'Client scans to pay directly into your bank via UPI'
                  : 'Client scans contractor screen directly'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Amount Due Display */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>AMOUNT DUE FROM {quote.clientName.toUpperCase()}</Text>
              <Text style={styles.amountVal}>{amountFormatted}</Text>
              <Text style={styles.amountSubtext}>Pre-filled automatically on client device</Text>
            </View>

            {/* Payment Method Selector */}
            {isIndia ? (
              <View style={styles.railTabs}>
                <TouchableOpacity
                  style={[styles.railTab, activeRail === 'UPI' && styles.railTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveRail('UPI');
                  }}
                >
                  <Text style={[styles.railTabText, activeRail === 'UPI' && styles.railTabTextActive]}>
                    ⚡ UPI (GPay • PhonePe • Paytm)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.railTab, activeRail === 'BANK' && styles.railTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveRail('BANK');
                  }}
                >
                  <Text style={[styles.railTabText, activeRail === 'BANK' && styles.railTabTextActive]}>
                    🏛️ Bank (IMPS/NEFT)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
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
            )}

            {/* UPI INLINE CONFIGURATION / QR CODE */}
            {activeRail === 'UPI' && (
              <>
                {!profile?.upiId || isEditingUpi ? (
                  /* UPI Setup Card */
                  <View style={styles.upiSetupCard}>
                    <View style={styles.setupCardHeader}>
                      <ShieldCheck size={20} color={colors.emerald} />
                      <Text style={styles.setupCardTitle}>Configure Your Receiving UPI ID</Text>
                    </View>
                    <Text style={styles.setupCardDesc}>
                      Enter your UPI ID so payments transfer 100% directly into your bank account.
                      The exact amount ({amountFormatted}) will be locked & pre-filled when your client scans.
                    </Text>

                    {upiError ? (
                      <View style={styles.errorBox}>
                        <AlertCircle size={14} color={colors.rose} />
                        <Text style={styles.errorText}>{upiError}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.fieldLabel}>Your UPI ID (VPA):</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 9876543210@paytm, contractor@okhdfcbank"
                      placeholderTextColor={colors.textMuted}
                      value={upiInput}
                      onChangeText={(t) => {
                        setUpiInput(t);
                        if (upiError) setUpiError('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                      Payee / Business Name (shown to client):
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Apex Electricals or Your Name"
                      placeholderTextColor={colors.textMuted}
                      value={upiNameInput}
                      onChangeText={setUpiNameInput}
                    />

                    <View style={styles.setupActions}>
                      <TouchableOpacity style={styles.saveUpiBtn} onPress={handleSaveUpi}>
                        <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveUpiBtnText}>Save & Generate UPI QR</Text>
                      </TouchableOpacity>

                      {profile?.upiId ? (
                        <TouchableOpacity
                          style={styles.cancelUpiBtn}
                          onPress={() => {
                            setUpiInput(profile.upiId || '');
                            setIsEditingUpi(false);
                          }}
                        >
                          <Text style={styles.cancelUpiBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <Text style={styles.securityNote}>
                      🔒 Zero Middleman • Instant Bank-to-Bank Transfer • 0% Fees
                    </Text>
                  </View>
                ) : (
                  /* Live UPI QR Display */
                  <View style={styles.qrContainer}>
                    <View style={styles.qrFrame}>
                      <QRCode
                        value={currentPayload}
                        size={190}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                      />
                    </View>

                    {/* Payee Verification Badge */}
                    <View style={styles.verifiedPayeeCard}>
                      <View style={styles.payeeInfo}>
                        <Text style={styles.payeeLabel}>RECEIVING BANK ACCOUNT</Text>
                        <Text style={styles.payeeUpi}>{profile.upiId}</Text>
                        <Text style={styles.payeeName}>
                          Name: {profile.upiPayeeName || profile.businessName || 'JobSign Contractor'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editUpiBtn}
                        onPress={() => {
                          setUpiInput(profile.upiId || '');
                          setUpiNameInput(
                            profile.upiPayeeName || profile.businessName || profile.ownerName || ''
                          );
                          setIsEditingUpi(true);
                        }}
                      >
                        <Edit3 size={14} color={colors.primary} />
                        <Text style={styles.editUpiBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Apps list & features */}
                    <View style={styles.appSupportBox}>
                      <Text style={styles.appSupportTitle}>
                        SCAN WITH ANY UPI APP
                      </Text>
                      <Text style={styles.appSupportList}>
                        Google Pay • PhonePe • Paytm • BHIM • Cred • Any Bank App
                      </Text>
                      <View style={styles.appGuarantees}>
                        <Text style={styles.guaranteeItem}>✓ Pre-filled exact amount: {amountFormatted}</Text>
                        <Text style={styles.guaranteeItem}>✓ Money transfers directly to your bank account</Text>
                        <Text style={styles.guaranteeItem}>✓ No middleman or commission deducted</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* BANK WIRE / IMPS RAIL */}
            {activeRail === 'BANK' && (
              <View style={styles.bankContainer}>
                {isIndia && profile?.bankAccountNumber ? (
                  <View style={styles.bankDetailsCard}>
                    <View style={styles.bankHeader}>
                      <Landmark size={20} color={colors.primary} />
                      <Text style={styles.bankTitle}>Direct Bank Transfer (NEFT / IMPS)</Text>
                    </View>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Beneficiary:</Text>
                      <Text style={styles.bankVal}>
                        {profile.upiPayeeName || profile.businessName || profile.ownerName}
                      </Text>
                    </View>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Account Number:</Text>
                      <Text style={[styles.bankVal, styles.monoVal]}>{profile.bankAccountNumber}</Text>
                    </View>
                    {profile.bankIfsc ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>IFSC Code:</Text>
                        <Text style={[styles.bankVal, styles.monoVal]}>{profile.bankIfsc}</Text>
                      </View>
                    ) : null}
                    {profile.bankName ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>Bank Name:</Text>
                        <Text style={styles.bankVal}>{profile.bankName}</Text>
                      </View>
                    ) : null}
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Amount:</Text>
                      <Text style={[styles.bankVal, { color: colors.emerald, fontWeight: '800' }]}>
                        {amountFormatted}
                      </Text>
                    </View>
                  </View>
                ) : (
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
                      {isIndia
                        ? 'Add Bank Account & IFSC code in Settings to show direct transfer details.'
                        : `Have client scan or initiate wire to settle ${amountFormatted}.`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* INTERNATIONAL RAILS (Zelle, Venmo, CashApp) */}
            {activeRail !== 'UPI' && activeRail !== 'BANK' && (
              <>
                {((activeRail === 'ZELLE' && !profile.zelleAccount) ||
                  (activeRail === 'VENMO' && !profile.venmoAccount) ||
                  (activeRail === 'CASHAPP' && !profile.cashAppAccount)) && (
                  <View style={styles.warnBanner}>
                    <Text style={styles.warnText}>
                      No {activeRail === 'CASHAPP' ? 'Cash App' : activeRail} username configured in Settings yet.
                    </Text>
                  </View>
                )}

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
              </>
            )}

            {/* 1-Tap Confirmation Button */}
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
      maxHeight: '90%',
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
      marginBottom: 12,
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
    amountBox: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: Theme.borderRadius.md,
      padding: 14,
      alignItems: 'center',
      marginBottom: 14,
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
      marginTop: 2,
    },
    amountSubtext: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '600',
    },
    railTabs: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.sm,
      padding: 4,
      marginBottom: 16,
      gap: 4,
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
      textAlign: 'center',
    },
    railTabTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    upiSetupCard: {
      backgroundColor: colors.card,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      marginBottom: 14,
    },
    setupCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    setupCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    setupCardDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      marginBottom: 14,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.rose + '15',
      borderWidth: 1,
      borderColor: colors.rose + '30',
      borderRadius: 6,
      padding: 8,
      marginBottom: 10,
    },
    errorText: {
      fontSize: 11,
      color: colors.rose,
      fontWeight: '600',
      flex: 1,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
    },
    setupActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    saveUpiBtn: {
      flex: 1,
      backgroundColor: colors.emerald,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveUpiBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    cancelUpiBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelUpiBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
    },
    securityNote: {
      fontSize: 11,
      color: colors.emerald,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 12,
    },
    qrContainer: {
      alignItems: 'center',
      paddingVertical: 8,
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
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    verifiedPayeeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.emerald + '40',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      width: '100%',
      marginBottom: 12,
    },
    payeeInfo: {
      flex: 1,
    },
    payeeLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.emerald,
      letterSpacing: 0.6,
    },
    payeeUpi: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 2,
    },
    payeeName: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    editUpiBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.primary + '15',
    },
    editUpiBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    appSupportBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      width: '100%',
      marginBottom: 12,
    },
    appSupportTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
      textAlign: 'center',
      marginBottom: 4,
    },
    appSupportList: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
    },
    appGuarantees: {
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 8,
      gap: 3,
    },
    guaranteeItem: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    bankContainer: {
      paddingVertical: 8,
    },
    bankDetailsCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
    },
    bankHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderColor: colors.border,
      paddingBottom: 8,
    },
    bankTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    bankRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    bankLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    bankVal: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    monoVal: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      letterSpacing: 0.5,
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
      marginTop: 8,
      marginBottom: 10,
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
