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
import {
  X,
  Check,
  Edit3,
  ShieldCheck,
  AlertCircle,
  Building2,
  Smartphone,
  Landmark,
  Plus,
} from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote, SavedBankAccount, SavedUpiAccount } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { NotificationService } from '../services/NotificationService';
import { AlertService } from '../services/AlertService';
import { RegionPaymentService } from '../services/RegionPaymentService';
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
  const isIndia = (profile?.region === 'IN') || (profile?.region !== 'US' && (curSymbol === '₹' || profile?.currencyCode === 'INR'));

  type RailType = 'UPI' | 'ZELLE' | 'VENMO' | 'CASHAPP' | 'BANK';

  const regionConfig = useMemo(() => {
    return RegionPaymentService.getConfig(profile?.currencyCode, curSymbol, profile?.region);
  }, [profile?.currencyCode, curSymbol, profile?.region]);

  const availableRails = useMemo(() => {
    if (regionConfig.region === 'IN') {
      return [
        { key: 'UPI' as RailType, label: profile?.customPaymentLabel || regionConfig.instantRailLabel },
        { key: 'BANK' as RailType, label: regionConfig.bankRailLabel },
      ];
    }
    if (regionConfig.region === 'US') {
      return [
        ...(profile?.upiId ? [{ key: 'UPI' as RailType, label: profile.customPaymentLabel || '⚡ Instant Pay' }] : []),
        { key: 'ZELLE' as RailType, label: 'Zelle' },
        { key: 'VENMO' as RailType, label: 'Venmo' },
        { key: 'CASHAPP' as RailType, label: 'Cash App' },
        { key: 'BANK' as RailType, label: regionConfig.bankRailLabel },
      ];
    }
    // Region-specific (UK, Europe, Canada, Australia, Global)
    return [
      { key: 'UPI' as RailType, label: profile?.customPaymentLabel || regionConfig.instantRailLabel },
      { key: 'BANK' as RailType, label: regionConfig.bankRailLabel },
      ...(profile?.zelleAccount ? [{ key: 'ZELLE' as RailType, label: 'Zelle' }] : []),
      ...(profile?.venmoAccount ? [{ key: 'VENMO' as RailType, label: 'Venmo' }] : []),
      ...(profile?.cashAppAccount ? [{ key: 'CASHAPP' as RailType, label: 'Cash App' }] : []),
    ];
  }, [regionConfig, profile]);

  const [activeRail, setActiveRail] = useState<RailType>(() => {
    if (regionConfig.region === 'IN') return 'UPI';
    if (regionConfig.region === 'US') return 'ZELLE';
    return 'UPI';
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Saved accounts lists
  const savedUpiList = useMemo(() => {
    const list = [...(profile?.savedUpiAccounts || [])];
    if (profile?.upiId && !list.some((item) => item.upiId.toLowerCase() === profile.upiId?.toLowerCase())) {
      list.unshift({
        id: 'primary-upi',
        upiId: profile.upiId,
        payeeName: profile.upiPayeeName || profile.businessName || profile.ownerName,
      });
    }
    return list;
  }, [profile?.savedUpiAccounts, profile?.upiId, profile?.upiPayeeName, profile?.businessName, profile?.ownerName]);

  const savedBankList = useMemo(() => {
    const list = [...(profile?.savedBankAccounts || [])];
    if (profile?.bankAccountNumber && !list.some((item) => item.accountNumber === profile.bankAccountNumber)) {
      list.unshift({
        id: 'primary-bank',
        accountNumber: profile.bankAccountNumber,
        ifscOrRouting: profile.bankIfsc,
        bankName: profile.bankName,
        beneficiaryName: profile.upiPayeeName || profile.businessName || profile.ownerName,
      });
    }
    return list;
  }, [profile?.savedBankAccounts, profile?.bankAccountNumber, profile?.bankIfsc, profile?.bankName, profile?.upiPayeeName, profile?.businessName, profile?.ownerName]);

  // Inline Instant QR editing state
  const isUS = regionConfig.region === 'US';
  const [isEditingUpi, setIsEditingUpi] = useState(!profile?.upiId && (isIndia || (!isUS && !profile?.zelleAccount)));
  const [upiInput, setUpiInput] = useState(profile?.upiId || '');
  const [upiNameInput, setUpiNameInput] = useState(
    profile?.upiPayeeName || profile?.businessName || profile?.ownerName || 'JobSign Contractor'
  );
  const [upiError, setUpiError] = useState('');

  // Inline Bank editing state
  const [isEditingBank, setIsEditingBank] = useState(!profile?.bankAccountNumber);
  const [bankAccountInput, setBankAccountInput] = useState(profile?.bankAccountNumber || '');
  const [bankIfscInput, setBankIfscInput] = useState(profile?.bankIfsc || '');
  const [bankNameInput, setBankNameInput] = useState(profile?.bankName || '');
  const [bankBeneficiaryInput, setBankBeneficiaryInput] = useState(
    profile?.upiPayeeName || profile?.businessName || profile?.ownerName || 'JobSign Contractor'
  );
  const [bankError, setBankError] = useState('');

  const depositCents = quote.depositAmountCents || 0;
  const balanceDueCents = Math.max(0, quote.totalAmountCents - depositCents);
  const amountToCollectCents = depositCents > 0 && balanceDueCents > 0 ? balanceDueCents : quote.totalAmountCents;
  const amountDecimal = (amountToCollectCents / 100).toFixed(2);
  const amountFormatted = depositCents > 0 && balanceDueCents > 0
    ? `${curSymbol}${amountDecimal} (${regionConfig.balanceDueLabel})`
    : `${curSymbol}${amountDecimal}`;

  const [paymentAmountStr, setPaymentAmountStr] = useState(amountDecimal);
  const [settlementMode, setSettlementMode] = useState<'UPI' | 'CASH' | 'BANK' | 'CHEQUE'>('UPI');
  const [paymentRefInput, setPaymentRefInput] = useState('');

  const enteredAmountNum = parseFloat(paymentAmountStr) || 0;
  const enteredAmountCents = Math.round(enteredAmountNum * 100);
  const isPartialPayment = enteredAmountCents > 0 && enteredAmountCents < amountToCollectCents;
  const remainingAfterPaymentCents = Math.max(0, amountToCollectCents - enteredAmountCents);

  const handleSelectUpi = (acc: SavedUpiAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({
      upiId: acc.upiId,
      upiPayeeName: acc.payeeName,
    });
    setUpiInput(acc.upiId);
    setUpiNameInput(acc.payeeName || profile?.businessName || profile?.ownerName || 'JobSign Contractor');
    setIsEditingUpi(false);
  };

  const handleSelectBank = (acc: SavedBankAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({
      bankAccountNumber: acc.accountNumber,
      bankIfsc: acc.ifscOrRouting,
      bankName: acc.bankName,
      upiPayeeName: acc.beneficiaryName,
    });
    setBankAccountInput(acc.accountNumber);
    setBankIfscInput(acc.ifscOrRouting || '');
    setBankNameInput(acc.bankName || '');
    setBankBeneficiaryInput(acc.beneficiaryName || profile?.businessName || profile?.ownerName || 'JobSign Contractor');
    setIsEditingBank(false);
  };

  const handleSaveUpi = () => {
    const trimmedId = upiInput.trim().toLowerCase();
    if (!trimmedId) {
      setUpiError(`Please enter a valid ${regionConfig.instantRailName} ID`);
      return;
    }
    if (regionConfig.region === 'IN' && !trimmedId.includes('@')) {
      setUpiError('Payment ID must include an @ handle (e.g. name@bank, mobile@bank)');
      return;
    }
    setUpiError('');
    const payee = upiNameInput.trim() || profile?.businessName || profile?.ownerName || 'JobSign Contractor';

    const newUpi: SavedUpiAccount = {
      id: Date.now().toString(),
      upiId: trimmedId,
      payeeName: payee,
    };

    const existing = profile?.savedUpiAccounts || [];
    const filtered = existing.filter((u) => u.upiId.toLowerCase() !== trimmedId);
    const updatedList = [newUpi, ...filtered];

    updateProfile({
      upiId: trimmedId,
      upiPayeeName: payee,
      savedUpiAccounts: updatedList,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditingUpi(false);
  };

  const handleSaveBank = () => {
    const trimmedAcc = bankAccountInput.trim();
    if (!trimmedAcc || trimmedAcc.length < 4) {
      setBankError('Please enter a valid bank account number');
      return;
    }
    setBankError('');
    const beneficiary = bankBeneficiaryInput.trim() || profile?.businessName || profile?.ownerName || 'JobSign Contractor';
    const routing = bankIfscInput.trim().toUpperCase();
    const bName = bankNameInput.trim();

    const newAccount: SavedBankAccount = {
      id: Date.now().toString(),
      accountNumber: trimmedAcc,
      ifscOrRouting: routing,
      bankName: bName,
      beneficiaryName: beneficiary,
    };

    const existing = profile?.savedBankAccounts || [];
    const filtered = existing.filter((b) => b.accountNumber !== trimmedAcc);
    const updatedList = [newAccount, ...filtered];

    updateProfile({
      bankAccountNumber: trimmedAcc,
      bankIfsc: routing,
      bankName: bName,
      upiPayeeName: beneficiary,
      savedBankAccounts: updatedList,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditingBank(false);
  };

  const getPayload = (): string => {
    const effectiveCollectCents = enteredAmountCents > 0 ? enteredAmountCents : amountToCollectCents;
    const amtStr = (effectiveCollectCents / 100).toFixed(2);
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
        )}&am=${amtStr}&cu=${profile?.currencyCode || 'INR'}&tn=${encodeURIComponent(`Payment for Quote #${quote.quoteNumber}`)}`;
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
        if (profile?.bankAccountNumber || profile?.bankIfsc) {
          return `${regionConfig.bankTitle}:\nBeneficiary: ${
            profile?.upiPayeeName || profile?.businessName || profile?.ownerName
          }\n${regionConfig.bankAccountLabel.replace('*', '').trim()}: ${profile?.bankAccountNumber || 'N/A'}\n${
            regionConfig.bankCodeLabel.replace('*', '').trim()
          }: ${profile?.bankIfsc || 'N/A'}\nBank: ${
            profile?.bankName || 'N/A'
          }\nAmount: ${curSymbol}${amtStr}\nRef: Quote #${quote.quoteNumber}${
            profile?.customPaymentNote ? `\nInstructions: ${profile.customPaymentNote}` : ''
          }`;
        }
        return `Direct Bank Settlement for ${profile?.businessName || profile?.ownerName}\nAmount Due: ${curSymbol}${amtStr}\nRef: Agreement #${quote.quoteNumber}`;
      }
    }
  };

  const handleMarkAsPaid = () => {
    if (enteredAmountCents <= 0) {
      AlertService.alert('Invalid Amount', 'Please enter a valid payment amount.', undefined, 'WARNING');
      return;
    }

    const modeLabels: Record<string, string> = {
      UPI: isUS ? 'Zelle' : isIndia ? 'UPI' : 'Instant Pay',
      CASH: 'Cash',
      BANK: isUS ? 'ACH / Direct Deposit' : 'Direct Bank Transfer',
      CHEQUE: isUS ? 'Check' : 'Cheque',
    };
    const modeLabel = modeLabels[settlementMode] || settlementMode;

    if (isPartialPayment) {
      AlertService.alert({
        title: 'Record Partial Payment',
        message: `Record ${curSymbol}${(enteredAmountCents / 100).toFixed(2)} received via ${modeLabel} for Agreement #${quote.quoteNumber}?\n\nClient balance will update to ${curSymbol}${(remainingAfterPaymentCents / 100).toFixed(2)}.`,
        type: 'INFO',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Payment',
            style: 'default',
            onPress: async () => {
              if (isProcessing) return;
              setIsProcessing(true);
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const updated: Quote = {
                  ...quote,
                  depositAmountCents: (quote.depositAmountCents || 0) + enteredAmountCents,
                  updatedAt: Date.now(),
                };
                await addQuote(updated);
                await NotificationService.notifyPaymentReceived(
                  quote.quoteNumber,
                  quote.clientName,
                  enteredAmountCents,
                  true,
                  remainingAfterPaymentCents
                );
                AlertService.alert({
                  title: 'Partial Payment Recorded',
                  message: `Received ${curSymbol}${(enteredAmountCents / 100).toFixed(2)} via ${modeLabel}.\nRemaining balance: ${curSymbol}${(remainingAfterPaymentCents / 100).toFixed(2)}.`,
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
      return;
    }

    // Full Payment
    const dischargeText = isIndia
      ? 'This certifies receipt of funds in full and issues an official zero-balance payment receipt / no-dues confirmation.'
      : "This certifies receipt of funds and automatically releases the mechanic's lien on the digital receipt.";
    const confirmBtnText = isIndia ? 'Confirm & Issue Receipt' : 'Confirm & Release Lien';

    AlertService.alert({
      title: 'Confirm Payment Received',
      message: `Mark Agreement #${quote.quoteNumber} (${curSymbol}${(enteredAmountCents / 100).toFixed(2)}) as paid in full via ${modeLabel}?\n\n${dischargeText}`,
      type: 'INFO',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmBtnText,
          style: 'default',
          onPress: async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const updated: Quote = {
                ...quote,
                status: 'PAID',
                depositAmountCents: quote.totalAmountCents,
                updatedAt: Date.now(),
              };
              await addQuote(updated);
              await NotificationService.notifyPaymentReceived(
                quote.quoteNumber,
                quote.clientName,
                quote.totalAmountCents,
                false,
                0
              );
              await NotificationService.cancelReminder(quote.id);
              AlertService.alert({
                title: 'Payment Recorded',
                message: `Agreement #${quote.quoteNumber} has been marked as paid in full.`,
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
                Client scans to pay directly into contractor bank account
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
            <View style={styles.railTabs}>
              {availableRails.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.railTab, activeRail === r.key && styles.railTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveRail(r.key);
                  }}
                >
                  <Text style={[styles.railTabText, activeRail === r.key && styles.railTabTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* INSTANT QR INLINE CONFIGURATION / DISPLAY */}
            {activeRail === 'UPI' && (
              <>
                {/* Account Switcher / Quick Select */}
                {savedUpiList.length > 0 && !isEditingUpi && (
                  <View style={styles.accountSwitcher}>
                    <Text style={styles.switcherLabel}>SELECT PAYMENT ID:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherRow}>
                      {savedUpiList.map((acc) => {
                        const isSelected = profile?.upiId?.toLowerCase() === acc.upiId.toLowerCase();
                        return (
                          <TouchableOpacity
                            key={acc.id || acc.upiId}
                            style={[styles.accountChip, isSelected && styles.accountChipActive]}
                            onPress={() => handleSelectUpi(acc)}
                          >
                            <Text style={[styles.accountChipText, isSelected && styles.accountChipTextActive]}>
                              ⚡ {acc.upiId}
                            </Text>
                            {isSelected && <Check size={12} color={colors.primary} style={{ marginLeft: 2 }} />}
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={styles.addAccountChip}
                        onPress={() => {
                          setUpiInput('');
                          setUpiNameInput(profile?.businessName || profile?.ownerName || '');
                          setIsEditingUpi(true);
                        }}
                      >
                        <Plus size={12} color={colors.primary} />
                        <Text style={styles.addAccountChipText}>+ Add ID</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}

                {!profile?.upiId || isEditingUpi ? (
                  /* Setup Card */
                  <View style={styles.upiSetupCard}>
                    <View style={styles.setupCardHeader}>
                      <ShieldCheck size={20} color={colors.emerald} />
                      <Text style={styles.setupCardTitle}>Configure {regionConfig.instantRailName} Payment</Text>
                    </View>
                    <Text style={styles.setupCardDesc}>
                      Enter your {regionConfig.instantIdLabel.replace('*', '').trim()} so funds transfer 100% directly into your bank account.
                      The exact amount ({amountFormatted}) will be locked & pre-filled when your client scans.
                    </Text>

                    {upiError ? (
                      <View style={styles.errorBox}>
                        <AlertCircle size={14} color={colors.rose} />
                        <Text style={styles.errorText}>{upiError}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.fieldLabel}>{regionConfig.instantIdLabel}:</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={regionConfig.instantIdPlaceholder}
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
                      placeholder="e.g. Apex Electricals or Contractor Name"
                      placeholderTextColor={colors.textMuted}
                      value={upiNameInput}
                      onChangeText={setUpiNameInput}
                    />

                    <View style={styles.setupActions}>
                      <TouchableOpacity style={styles.saveUpiBtn} onPress={handleSaveUpi}>
                        <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveUpiBtnText}>Save & Generate QR</Text>
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
                      🔒 Zero Middleman • Instant Bank Settlement • 0% Fees
                    </Text>
                  </View>
                ) : (
                  /* Live QR Display */
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
                        <Text style={styles.payeeLabel}>RECEIVING {regionConfig.instantRailName.toUpperCase()} ACCOUNT</Text>
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
                        {regionConfig.scannerTitle}
                      </Text>
                      <Text style={styles.appSupportList}>
                        {regionConfig.scannerApps}
                      </Text>
                      <View style={styles.appGuarantees}>
                        <Text style={styles.guaranteeItem}>✓ Pre-filled exact amount: {amountFormatted}</Text>
                        <Text style={styles.guaranteeItem}>✓ Direct transfer to contractor bank account</Text>
                        <Text style={styles.guaranteeItem}>✓ Zero middleman fees or transaction deductions</Text>
                      </View>
                      {profile?.customPaymentNote ? (
                        <View style={styles.customNoteBox}>
                          <Text style={styles.customNoteLabel}>INVOICE PAYMENT INSTRUCTIONS:</Text>
                          <Text style={styles.customNoteText}>{profile.customPaymentNote}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* DIRECT BANK TRANSFER RAIL */}
            {activeRail === 'BANK' && (
              <View style={styles.bankContainer}>
                {/* Account Switcher / Quick Select */}
                {savedBankList.length > 0 && !isEditingBank && (
                  <View style={styles.accountSwitcher}>
                    <Text style={styles.switcherLabel}>SELECT BANK ACCOUNT:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherRow}>
                      {savedBankList.map((acc) => {
                        const isSelected = profile?.bankAccountNumber === acc.accountNumber;
                        const shortAcc = acc.accountNumber.length > 4 ? `••••${acc.accountNumber.slice(-4)}` : acc.accountNumber;
                        return (
                          <TouchableOpacity
                            key={acc.id || acc.accountNumber}
                            style={[styles.accountChip, isSelected && styles.accountChipActive]}
                            onPress={() => handleSelectBank(acc)}
                          >
                            <Landmark size={12} color={isSelected ? colors.primary : colors.textMuted} />
                            <Text style={[styles.accountChipText, isSelected && styles.accountChipTextActive]}>
                              {acc.bankName ? `${acc.bankName} (${shortAcc})` : shortAcc}
                            </Text>
                            {isSelected && <Check size={12} color={colors.primary} style={{ marginLeft: 2 }} />}
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={styles.addAccountChip}
                        onPress={() => {
                          setBankAccountInput('');
                          setBankIfscInput('');
                          setBankNameInput('');
                          setBankBeneficiaryInput(profile?.businessName || profile?.ownerName || '');
                          setIsEditingBank(true);
                        }}
                      >
                        <Plus size={12} color={colors.primary} />
                        <Text style={styles.addAccountChipText}>+ Add Bank</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}

                {!profile?.bankAccountNumber || isEditingBank ? (
                  /* Bank Inline Setup Card - Simple & Beautiful! */
                  <View style={styles.upiSetupCard}>
                    <View style={styles.setupCardHeader}>
                      <Building2 size={20} color={colors.emerald} />
                      <Text style={styles.setupCardTitle}>
                        {profile?.bankAccountNumber ? 'Edit ' + regionConfig.bankTitle : 'Enter ' + regionConfig.bankTitle}
                      </Text>
                    </View>
                    <Text style={styles.setupCardDesc}>
                      Enter your bank account details for direct client transfers. Exact settlement amount ({amountFormatted}) will be displayed to the client.
                    </Text>

                    {bankError ? (
                      <View style={styles.errorBox}>
                        <AlertCircle size={14} color={colors.rose} />
                        <Text style={styles.errorText}>{bankError}</Text>
                      </View>
                    ) : null}

                    <Text style={styles.fieldLabel}>Account Beneficiary / Name:</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Account holder or business name"
                      placeholderTextColor={colors.textMuted}
                      value={bankBeneficiaryInput}
                      onChangeText={setBankBeneficiaryInput}
                    />

                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>{regionConfig.bankAccountLabel}:</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={regionConfig.bankAccountPlaceholder}
                      placeholderTextColor={colors.textMuted}
                      value={bankAccountInput}
                      onChangeText={(t) => {
                        setBankAccountInput(t);
                        if (bankError) setBankError('');
                      }}
                      keyboardType="numeric"
                    />

                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                      {regionConfig.bankCodeLabel}:
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={regionConfig.bankCodePlaceholder}
                      placeholderTextColor={colors.textMuted}
                      value={bankIfscInput}
                      onChangeText={setBankIfscInput}
                      autoCapitalize="characters"
                    />

                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Bank Name (Optional):</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={isIndia ? 'e.g. HDFC Bank, SBI' : 'e.g. Chase, Barclays, RBC, ANZ'}
                      placeholderTextColor={colors.textMuted}
                      value={bankNameInput}
                      onChangeText={setBankNameInput}
                    />

                    <View style={styles.setupActions}>
                      <TouchableOpacity style={styles.saveUpiBtn} onPress={handleSaveBank}>
                        <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveUpiBtnText}>Save & Display Bank Details</Text>
                      </TouchableOpacity>

                      {profile?.bankAccountNumber ? (
                        <TouchableOpacity
                          style={styles.cancelUpiBtn}
                          onPress={() => {
                            setBankAccountInput(profile.bankAccountNumber || '');
                            setBankIfscInput(profile.bankIfsc || '');
                            setBankNameInput(profile.bankName || '');
                            setBankBeneficiaryInput(profile.upiPayeeName || profile.businessName || profile.ownerName || '');
                            setIsEditingBank(false);
                          }}
                        >
                          <Text style={styles.cancelUpiBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <Text style={styles.securityNote}>
                      🔒 100% Direct Bank Settlement • Stored Securely on Device
                    </Text>
                  </View>
                ) : (
                  /* Verified Bank Details Card with Edit & Switch option! */
                  <View style={styles.bankDetailsCard}>
                    <View style={styles.bankHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Landmark size={20} color={colors.primary} />
                        <Text style={styles.bankTitle}>{regionConfig.bankTitle}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.editBankBtn}
                        onPress={() => {
                          setBankAccountInput(profile.bankAccountNumber || '');
                          setBankIfscInput(profile.bankIfsc || '');
                          setBankNameInput(profile.bankName || '');
                          setBankBeneficiaryInput(
                            profile.upiPayeeName || profile.businessName || profile.ownerName || ''
                          );
                          setIsEditingBank(true);
                        }}
                      >
                        <Edit3 size={14} color={colors.primary} />
                        <Text style={styles.editBankBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Beneficiary:</Text>
                      <Text style={styles.bankVal}>
                        {profile.upiPayeeName || profile.businessName || profile.ownerName}
                      </Text>
                    </View>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>{regionConfig.bankAccountLabel.replace('*', '').trim()}:</Text>
                      <Text style={[styles.bankVal, styles.monoVal]}>{profile.bankAccountNumber}</Text>
                    </View>
                    {profile.bankIfsc ? (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>
                          {regionConfig.bankCodeLabel.replace('*', '').trim()}:
                        </Text>
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

                    <View style={styles.bankFooterGuarantee}>
                      <Text style={styles.guaranteeItem}>✓ Pre-filled exact amount: {amountFormatted}</Text>
                      <Text style={styles.guaranteeItem}>✓ Direct bank transfer with 0% middleman fees</Text>
                      <Text style={styles.guaranteeItem}>✓ Client transfers via any mobile banking app</Text>
                      {profile?.customPaymentNote ? (
                        <View style={styles.customNoteBox}>
                          <Text style={styles.customNoteLabel}>INVOICE PAYMENT INSTRUCTIONS:</Text>
                          <Text style={styles.customNoteText}>{profile.customPaymentNote}</Text>
                        </View>
                      ) : null}
                    </View>
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

            {/* Settlement & Payment Mode Recording Section */}
            <View style={styles.settlementCard}>
              <Text style={styles.settlementSectionTitle}>RECORD SETTLEMENT / PAYMENT MODE</Text>

              {/* Mode Selector */}
              <View style={styles.modeSelectorRow}>
                {(['UPI', 'CASH', 'BANK', 'CHEQUE'] as const).map((m) => {
                  const isSelected = settlementMode === m;
                  const icon = m === 'UPI' ? '⚡' : m === 'CASH' ? '💵' : m === 'BANK' ? '🏛️' : '📜';
                  const label = m === 'UPI'
                    ? (isUS ? 'Zelle' : isIndia ? 'UPI' : 'Instant')
                    : m === 'CASH'
                    ? 'Cash'
                    : m === 'BANK'
                    ? (isUS ? 'ACH' : 'Bank')
                    : (isUS ? 'Check' : 'Cheque');
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modeChip, isSelected && styles.modeChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSettlementMode(m);
                      }}
                    >
                      <Text style={[styles.modeChipText, isSelected && styles.modeChipTextActive]}>
                        {icon} {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount to Record Input */}
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencyPrefix}>{curSymbol}</Text>
                <TextInput
                  style={styles.settlementAmountInput}
                  value={paymentAmountStr}
                  onChangeText={setPaymentAmountStr}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Quick Amount Presets */}
              <View style={styles.quickAmountRow}>
                <TouchableOpacity
                  style={styles.quickChip}
                  onPress={() => {
                    setPaymentAmountStr(amountDecimal);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.quickChipText}>Full ({curSymbol}{amountDecimal})</Text>
                </TouchableOpacity>
                {amountToCollectCents > 200000 && (
                  <TouchableOpacity
                    style={styles.quickChip}
                    onPress={() => {
                      setPaymentAmountStr(((amountToCollectCents * 0.5) / 100).toFixed(2));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.quickChipText}>50% Advance</Text>
                  </TouchableOpacity>
                )}
                {amountToCollectCents > 100000 && (
                  <TouchableOpacity
                    style={styles.quickChip}
                    onPress={() => {
                      setPaymentAmountStr('5000.00');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.quickChipText}>+ {curSymbol}5,000</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Reference / Note Input for Bank/Cheque */}
              {(settlementMode === 'BANK' || settlementMode === 'CHEQUE') && (
                <TextInput
                  style={styles.refInput}
                  value={paymentRefInput}
                  onChangeText={setPaymentRefInput}
                  placeholder={settlementMode === 'CHEQUE' ? 'Cheque # & Bank Name (e.g. #004123 HDFC)' : 'UTR / IMPS Reference #'}
                  placeholderTextColor={colors.textMuted}
                />
              )}

              {/* Dynamic Status / Balance Summary */}
              <View style={styles.balanceSummaryBox}>
                {isPartialPayment ? (
                  <Text style={[styles.balanceSummaryText, { color: colors.amber }]}>
                    ⚠️ Partial Payment: {curSymbol}{((enteredAmountCents) / 100).toFixed(2)} • Remaining: {curSymbol}{((remainingAfterPaymentCents) / 100).toFixed(2)}
                  </Text>
                ) : (
                  <Text style={[styles.balanceSummaryText, { color: colors.emerald }]}>
                    ✓ Full Settlement ({curSymbol}{((enteredAmountCents) / 100).toFixed(2)}) • Balance Due will be {curSymbol}0.00
                  </Text>
                )}
              </View>
            </View>

            {/* 1-Tap Confirmation Button */}
            <TouchableOpacity
              style={[
                styles.confirmPaidBtn,
                isPartialPayment && { backgroundColor: colors.primary },
                isProcessing && { opacity: 0.7 },
              ]}
              onPress={handleMarkAsPaid}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmPaidText}>
                  {isPartialPayment
                    ? `Record Partial Payment (${curSymbol}${(enteredAmountCents / 100).toFixed(2)})`
                    : 'Confirm Paid in Full'}
                </Text>
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
    accountSwitcher: {
      marginBottom: 12,
    },
    switcherLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
      marginBottom: 6,
    },
    switcherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
    },
    accountChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    accountChipActive: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
    },
    accountChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    accountChipTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    addAccountChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.primary,
      backgroundColor: 'transparent',
    },
    addAccountChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    editBankBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.primary + '15',
    },
    editBankBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    bankFooterGuarantee: {
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 10,
      marginTop: 10,
      gap: 4,
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
    customNoteBox: {
      marginTop: 10,
      padding: 10,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    customNoteLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    customNoteText: {
      fontSize: 12,
      color: colors.textPrimary,
      lineHeight: 16,
    },
    settlementCard: {
      backgroundColor: colors.card,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 14,
      marginTop: 14,
      marginBottom: 10,
    },
    settlementSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    modeSelectorRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 12,
    },
    modeChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: Theme.borderRadius.sm,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
    },
    modeChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    modeChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    modeChipTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    currencyPrefix: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      marginRight: 6,
    },
    settlementAmountInput: {
      flex: 1,
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      paddingVertical: 8,
    },
    quickAmountRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 10,
    },
    quickChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    quickChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    refInput: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 12,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    balanceSummaryBox: {
      paddingVertical: 4,
    },
    balanceSummaryText: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
