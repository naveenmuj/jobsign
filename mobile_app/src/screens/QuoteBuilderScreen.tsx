import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  BackHandler,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { LineItem, Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { SignaturePad } from '../components/SignaturePad';
import { PDFService } from '../services/PDFService';
import { PaywallModal } from '../components/PaywallModal';
import { BillingService } from '../services/BillingService';
import { OutboxService } from '../services/OutboxService';
import { DatabaseService } from '../services/DatabaseService';
import { CompanyNamePromptModal } from '../components/CompanyNamePromptModal';
import { TelemetryService } from '../services/TelemetryService';
import { NotificationService } from '../services/NotificationService';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { useAppSafeArea } from '../utils/safeArea';
import { useKeyboard } from '../utils/useKeyboard';
import { AlertService } from '../services/AlertService';
import { ChevronLeft, Camera, Image as ImageIcon, Plus, X, PenLine, Check } from 'lucide-react-native';

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
      padding: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    card: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 16,
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Theme.borderRadius.sm,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
    },
    photoPreviewBox: {
      alignItems: 'center',
    },
    photoPreview: {
      width: '100%',
      height: 180,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    removePhotoBtn: {
      marginTop: 8,
      padding: 6,
    },
    removePhotoText: {
      color: colors.rose,
      fontSize: 13,
      fontWeight: 'bold',
    },
    photoCheckboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      width: '100%',
      padding: 12,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1.5,
    },
    photoCheckboxRowActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    photoCheckboxRowInactive: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
    },
    checkboxBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    checkboxBoxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxTitle: {
      fontSize: 13,
      fontWeight: '700',
    },
    checkboxDesc: {
      fontSize: 11,
      marginTop: 2,
      lineHeight: 15,
    },
    photoActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    cameraBtn: {
      flex: 2,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 12,
      borderRadius: Theme.borderRadius.sm,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    cameraBtnText: {
      color: colors.primary,
      fontWeight: '800',
      fontSize: 13,
    },
    galleryBtn: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      borderRadius: Theme.borderRadius.sm,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    galleryBtnText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 13,
    },
    sectionHeader: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    presetScroll: {
      gap: 8,
      paddingBottom: 16,
    },
    presetChip: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: colors.primary,
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
      color: colors.primary,
    },
    presetPrice: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.emerald,
    },
    emptyText: {
      color: colors.textMuted,
      fontStyle: 'italic',
      paddingVertical: 12,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: colors.borderSubtle,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemTotal: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginRight: 12,
    },
    removeBtn: {
      padding: 6,
    },
    removeBtnText: {
      fontSize: 16,
      color: colors.rose,
      fontWeight: 'bold',
    },
    summaryCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryVal: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    totalRow: {
      borderTopWidth: 1.5,
      borderColor: colors.border,
      marginTop: 8,
      paddingTop: 10,
    },
    totalLabel: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    totalVal: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.emerald,
    },
    taxToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    taxToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
    },
    taxInputsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      marginBottom: 6,
    },
    taxLabelInput: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Theme.borderRadius.sm,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    taxRateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Theme.borderRadius.sm,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    taxRateInput: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 46,
      textAlign: 'right',
      padding: 0,
    },
    setDefaultTaxBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      paddingVertical: 4,
    },
    setDefaultTaxText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: 16,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    signButton: {
      backgroundColor: colors.emerald,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    signButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    addCustomRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    customDescInput: {
      flex: 2,
      fontSize: 13,
    },
    customPriceInput: {
      flex: 1,
      fontSize: 13,
      textAlign: 'right',
    },
    addCustomBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: Theme.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    addCustomBtnText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 13,
    },
    termsChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    termChip: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.full,
    },
    termChipText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    notesInput: {
      minHeight: 65,
      textAlignVertical: 'top',
    },
  });

export const QuoteBuilderScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { presets, addQuote, updateProfile, profile, quotes, isPro } = useQuoteStore();
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();
  const { isKeyboardVisible } = useKeyboard();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [includePhotoInPdf, setIncludePhotoInPdf] = useState<boolean>(true);
  const [items, setItems] = useState<LineItem[]>([]);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(
    profile.taxEnabledByDefault ?? true
  );
  const [taxRateInput, setTaxRateInput] = useState<string>(
    ((profile.defaultTaxBasisPoints ?? 825) / 100).toFixed(2)
  );
  const [taxLabelInput, setTaxLabelInput] = useState<string>(
    profile.taxLabel || 'Sales Tax'
  );
  const [isSigning, setIsSigning] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingPdfQuote, setPendingPdfQuote] = useState<Quote | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const handleInitiateSendPDF = (targetQuote: Quote) => {
    const needsCompanyName =
      !profile.hasCustomBusinessName &&
      (!profile.businessName || profile.businessName.trim() === '' || profile.businessName === 'Apex Field Services LLC');
    if (needsCompanyName) {
      setPendingPdfQuote(targetQuote);
      setShowCompanyModal(true);
    } else {
      PDFService.generateAndSharePDF(targetQuote, profile).finally(() => onBack());
    }
  };

  const handleCompanySave = (enteredName: string, enteredAddress: string) => {
    setShowCompanyModal(false);
    const updated = {
      ...profile,
      businessName: enteredName || profile.businessName,
      address: enteredAddress || profile.address,
      hasCustomBusinessName: true,
    };
    updateProfile(updated);
    if (pendingPdfQuote) {
      PDFService.generateAndSharePDF(pendingPdfQuote, updated).finally(() => onBack());
    }
  };

  const handleCompanySkip = () => {
    setShowCompanyModal(false);
    if (pendingPdfQuote) {
      PDFService.generateAndSharePDF(pendingPdfQuote, profile).finally(() => onBack());
    }
  };

  const handleSetAsDefault = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const parsedRate = parseFloat(taxRateInput);
    const savedBasisPoints = Math.round((isNaN(parsedRate) ? 8.25 : parsedRate) * 100);
    updateProfile({
      taxEnabledByDefault: isTaxEnabled,
      defaultTaxBasisPoints: isTaxEnabled ? savedBasisPoints : profile.defaultTaxBasisPoints,
      taxLabel: taxLabelInput.trim() || profile.taxLabel || 'Sales Tax',
    });
    AlertService.alert(
      'Default Preference Saved',
      isTaxEnabled
        ? `Tax is now enabled by default at ${taxRateInput}% (${taxLabelInput}) for all future estimates.`
        : 'All future estimates will now start tax-free / exempt by default.',
      undefined,
      'SUCCESS'
    );
  };

  // Take damage proof photo
  const handleCapturePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      AlertService.alert('Camera Permission', 'Please allow camera access to take worksite damage photos.', undefined, 'WARNING');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // 1-Tap Preset Addition
  const handleAddPreset = (preset: (typeof presets)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItem: LineItem = {
      id: Crypto.randomUUID(),
      description: preset.title,
      unitPriceCents: preset.priceCents,
      quantity: 1,
      totalCents: preset.priceCents,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleAddCustomItem = () => {
    if (!customDesc.trim()) {
      AlertService.alert('Description Required', 'Please enter a description for the item.', undefined, 'WARNING');
      return;
    }
    const cents = Math.round((parseFloat(customPrice) || 0) * 100);
    if (cents <= 0) {
      AlertService.alert('Valid Price Required', 'Please enter a valid price amount.', undefined, 'WARNING');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItem: LineItem = {
      id: Crypto.randomUUID(),
      description: customDesc.trim(),
      unitPriceCents: cents,
      quantity: 1,
      totalCents: cents,
    };
    setItems((prev) => [...prev, newItem]);
    setCustomDesc('');
    setCustomPrice('');
  };

  const handleRemoveItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const parsedTax = parseFloat(taxRateInput);
  const taxBasisPoints = isTaxEnabled
    ? Math.max(0, Math.round((isNaN(parsedTax) ? ((profile.defaultTaxBasisPoints ?? 825) / 100) : parsedTax) * 100))
    : 0;
  const taxAmountCents = isTaxEnabled
    ? Math.round((subtotalCents * taxBasisPoints) / 10000)
    : 0;
  const totalAmountCents = subtotalCents + taxAmountCents;

  const currencySymbol = profile.currencySymbol || '$';
  const totalFormatted = `${currencySymbol}${(totalAmountCents / 100).toFixed(2)}`;

  const handleStartSignature = () => {
    // Check free tier limits (3 quotes/mo) if payment enabled and not in free mode
    if (FEATURE_FLAGS.PAYMENT_ENABLED && !FEATURE_FLAGS.FREE_ALL_FEATURES && !isPro) {
      const currentMonthQuotes = quotes.filter((q) => {
        const d = new Date(q.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      if (currentMonthQuotes.length >= 3) {
        BillingService.presentRevenueCatPaywall().then((presented) => {
          if (!presented) setShowPaywall(true);
        });
        return;
      }
    }

    if (!clientName.trim()) {
      AlertService.alert('Missing Client Name', 'Please enter client name before signing.', undefined, 'WARNING');
      return;
    }
    if (items.length === 0) {
      AlertService.alert('No Line Items', 'Please add at least one line item to the estimate.', undefined, 'WARNING');
      return;
    }
    TelemetryService.logAction('START_SIGNATURE', 'QUOTE_BUILDER', {
      clientName: clientName.trim(),
      itemsCount: items.length,
      totalAmountCents,
    });
    setIsSigning(true);
  };

  const handleSaveSignature = async (svgPath: string) => {
    // Acquire GPS coordinates for UETA/ESIGN courtroom proof (graceful degrade if offline/denied)
    let gpsLat: number | undefined = undefined;
    let gpsLng: number | undefined = undefined;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        gpsLat = loc.coords.latitude;
        gpsLng = loc.coords.longitude;
      }
    } catch {
      // Degrades gracefully offline or if GPS unavailable
    }

    const nextQuoteNum = await DatabaseService.getNextQuoteNumber();

    const newQuote: Quote = {
      id: Crypto.randomUUID(),
      quoteNumber: nextQuoteNum,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUri: photoUri || undefined,
      includePhotoInPdf: photoUri ? includePhotoInPdf : true,
      status: 'SIGNED_LOCKED',
      subtotalCents,
      taxRateBasisPoints: taxBasisPoints,
      taxAmountCents,
      taxLabel: isTaxEnabled ? (taxLabelInput.trim() || 'Sales Tax') : undefined,
      totalAmountCents,
      currencySymbol,
      signatureSvg: svgPath,
      signatureTimestamp: Date.now(),
      signatureGpsLat: gpsLat,
      signatureGpsLng: gpsLng,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lineItems: items,
      changeOrders: [],
    };

    newQuote.pdfSha256Hash = await PDFService.computeHash(newQuote);
    await addQuote(newQuote);
    setIsSigning(false);

    // Send respectful, non-spam confirmation & schedule polite 3-day reminder
    await NotificationService.notifySealCompleted(
      newQuote.quoteNumber,
      newQuote.clientName,
      newQuote.totalAmountCents
    );
    await NotificationService.schedulePaymentReminder(newQuote);

    const isOnline = await OutboxService.isOnline();
    if (!isOnline && clientPhone.trim()) {
      await OutboxService.enqueue(newQuote, clientPhone.trim(), 'SMS');
      AlertService.alert(
        'Offline — Saved to Outbox',
        `Quote #${newQuote.quoteNumber} for ${newQuote.clientName} is legally sealed on glass with SHA-256.\n\nBecause cell reception is unavailable in the field, this agreement has been queued in your Offline Outbox. It will auto-dispatch via SMS the moment your phone reconnects to 4G/Wi-Fi.`,
        [{ text: 'Got it', onPress: onBack }],
        'SUCCESS'
      );
      return;
    }

    AlertService.alert(
      'Estimate Sealed',
      `Quote #${newQuote.quoteNumber} for ${newQuote.clientName} is legally sealed with SHA-256. Would you like to share the PDF with the client now?`,
      [
        { text: 'Later', style: 'cancel', onPress: onBack },
        {
          text: 'Send PDF Now',
          onPress: () => {
            handleInitiateSendPDF(newQuote);
          },
        },
      ],
      'SUCCESS'
    );
  };

  const handleBack = useCallback(() => {
    if (clientName.trim().length > 0 || items.length > 0) {
      AlertService.alert(
        'Discard In-Progress Estimate?',
        'You have unsaved changes. Exiting will lose this estimate.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onBack },
        ],
        'DANGER'
      );
    } else {
      onBack();
    }
  }, [clientName, items, onBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSigning) {
        setIsSigning(false);
        return true;
      }
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [isSigning, handleBack]);

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Estimate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isKeyboardVisible ? 160 : 120 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Client Input */}
        <View style={styles.card}>
          <Text style={styles.label}>Client Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Client Name (e.g. Sarah Jenkins)"
            placeholderTextColor={colors.textMuted}
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Phone Number (e.g. 512-555-0199)"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={clientPhone}
            onChangeText={setClientPhone}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Short Scope Summary (e.g. Electrical Breaker Swap)"
            placeholderTextColor={colors.textMuted}
            value={jobDescription}
            onChangeText={setJobDescription}
          />
        </View>

        {/* Damage Proof Photo Attachment */}
        <View style={styles.card}>
          <Text style={styles.label}>Worksite Photo</Text>
          {photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />

              <TouchableOpacity
                style={[
                  styles.photoCheckboxRow,
                  includePhotoInPdf ? styles.photoCheckboxRowActive : styles.photoCheckboxRowInactive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIncludePhotoInPdf(!includePhotoInPdf);
                }}
              >
                <View style={[styles.checkboxBox, includePhotoInPdf && styles.checkboxBoxChecked]}>
                  {includePhotoInPdf && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.checkboxTitle, { color: colors.textPrimary }]}>
                    Include photo in PDF Invoice (Exhibit A)
                  </Text>
                  <Text style={[styles.checkboxDesc, { color: colors.textSecondary }]}>
                    {includePhotoInPdf
                      ? 'Appends a high-resolution Exhibit A evidence page to the invoice.'
                      : 'Saved in local app records only. Omitted from the client contract.'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border }}
                  onPress={handleCapturePhoto}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border }}
                  onPress={handlePickFromGallery}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoActionsRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={handleCapturePhoto}>
                <Camera size={15} color={colors.primary} />
                <Text style={styles.cameraBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
                <ImageIcon size={15} color={colors.textSecondary} />
                <Text style={styles.galleryBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Presets Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetChip}
              onPress={() => handleAddPreset(preset)}
            >
              <Text style={styles.presetTitle}>+ {preset.title}</Text>
              <Text style={styles.presetPrice}>{currencySymbol}{(preset.priceCents / 100).toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Items */}
        <View style={styles.card}>
          <Text style={styles.label}>Line Items ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Tap a preset above or type a custom item below.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  <Text style={styles.itemSub}>Qty: {item.quantity} × {currencySymbol}{(item.unitPriceCents / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.itemTotal}>{currencySymbol}{(item.totalCents / 100).toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id)}
                  style={styles.removeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={16} color={colors.rose} />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Inline Custom Item Adder */}
          <View style={styles.addCustomRow}>
            <TextInput
              style={[styles.input, styles.customDescInput]}
              placeholder="Custom item or part..."
              placeholderTextColor={colors.textMuted}
              value={customDesc}
              onChangeText={setCustomDesc}
            />
            <TextInput
              style={[styles.input, styles.customPriceInput]}
              placeholder={`${currencySymbol}0.00`}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={customPrice}
              onChangeText={setCustomPrice}
            />
            <TouchableOpacity style={styles.addCustomBtn} onPress={handleAddCustomItem}>
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.addCustomBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{currencySymbol}{(subtotalCents / 100).toFixed(2)}</Text>
          </View>

          {/* Tax Section */}
          <View style={{ marginVertical: 6, paddingTop: 6, borderTopWidth: 1, borderColor: colors.border }}>
            <View style={styles.taxToggleRow}>
              <TouchableOpacity
                style={[
                  styles.taxToggleBtn,
                  {
                    backgroundColor: isTaxEnabled ? colors.primaryLight : colors.backgroundSecondary,
                    borderColor: isTaxEnabled ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsTaxEnabled(!isTaxEnabled);
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: isTaxEnabled ? colors.primary : colors.textMuted,
                  }}
                >
                  {isTaxEnabled ? '✓ Tax Added' : '+ Add Tax (Optional)'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.summaryVal}>
                {isTaxEnabled ? `${currencySymbol}${(taxAmountCents / 100).toFixed(2)}` : `${currencySymbol}0.00`}
              </Text>
            </View>

            {isTaxEnabled ? (
              <View>
                <View style={styles.taxInputsRow}>
                  <TextInput
                    style={styles.taxLabelInput}
                    placeholder="Tax Label (e.g. Sales Tax, VAT, GST)"
                    placeholderTextColor={colors.textMuted}
                    value={taxLabelInput}
                    onChangeText={setTaxLabelInput}
                  />
                  <View style={styles.taxRateBox}>
                    <TextInput
                      style={styles.taxRateInput}
                      value={taxRateInput}
                      onChangeText={setTaxRateInput}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>%</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.setDefaultTaxBtn} onPress={handleSetAsDefault}>
                  <Text style={styles.setDefaultTaxText}>★ Keep {taxRateInput}% ({taxLabelInput || 'Tax'}) enabled by default</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.setDefaultTaxBtn} onPress={handleSetAsDefault}>
                <Text style={[styles.setDefaultTaxText, { color: colors.textMuted }]}>
                  ★ Keep tax-exempt (0%) as default for future quotes
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalVal}>{totalFormatted}</Text>
          </View>
        </View>

        {/* Legal Terms & Custom Scope Notes */}
        <View style={styles.card}>
          <Text style={styles.label}>Terms & Conditions</Text>
          <View style={styles.termsChipRow}>
            {[
              'Payment due upon completion',
              'Lien waiver issued upon payment',
              'Homeowner supplies fixtures',
              '1-Year Workmanship Warranty',
            ].map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.termChip}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotes((prev) => (prev ? `${prev}\n• ${term}` : `• ${term}`));
                }}
              >
                <Text style={styles.termChipText}>+ {term}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Special terms, payment schedule, or exclusions..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      {!isKeyboardVisible && (
        <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
          <TouchableOpacity style={styles.signButton} onPress={handleStartSignature}>
            <PenLine size={18} color="#FFFFFF" />
            <Text style={styles.signButtonText}>Hand phone to client — Get Signature</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* Company Name Prompt Modal before PDF Generation */}
      <CompanyNamePromptModal
        visible={showCompanyModal}
        initialName={profile.hasCustomBusinessName ? profile.businessName : ''}
        initialAddress={profile.address || ''}
        onSave={handleCompanySave}
        onSkip={handleCompanySkip}
        onClose={() => {
          setShowCompanyModal(false);
          onBack();
        }}
      />
    </View>
  );
};
