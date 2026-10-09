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
import { RegionPaymentService } from '../services/RegionPaymentService';
import { CurrencyService } from '../services/CurrencyService';
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
      paddingVertical: 6,
    },
    taxRateInput: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 64,
      textAlign: 'right',
      paddingVertical: 2,
      paddingHorizontal: 4,
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

export const QuoteBuilderScreen: React.FC<{ onBack: () => void; initialQuote?: Quote | null }> = ({
  onBack,
  initialQuote,
}) => {
  const { presets, addQuote, updateProfile, profile, quotes, isPro } = useQuoteStore();
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();
  const { isKeyboardVisible } = useKeyboard();

  const [clientName, setClientName] = useState(initialQuote?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialQuote?.clientPhone || '');
  const [jobDescription, setJobDescription] = useState(initialQuote?.jobDescription || '');
  const [notes, setNotes] = useState(initialQuote?.notes || '');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');
  const [customUnit, setCustomUnit] = useState('nos');
  const [customHsn, setCustomHsn] = useState('');
  const [customDiscount, setCustomDiscount] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [includePhotoInPdf, setIncludePhotoInPdf] = useState<boolean>(true);
  const [items, setItems] = useState<LineItem[]>(
    initialQuote?.lineItems ? initialQuote.lineItems.map((i) => ({ ...i, id: Crypto.randomUUID() })) : []
  );
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(
    initialQuote ? initialQuote.taxRateBasisPoints > 0 : (profile.taxEnabledByDefault ?? true)
  );
  const [taxRateInput, setTaxRateInput] = useState<string>(
    initialQuote
      ? ((initialQuote.taxRateBasisPoints || 0) / 100).toFixed(2)
      : ((profile.defaultTaxBasisPoints ?? 825) / 100).toFixed(2)
  );
  const [taxLabelInput, setTaxLabelInput] = useState<string>(
    initialQuote?.taxLabel || profile.taxLabel || 'Sales Tax'
  );
  const [paymentTerms, setPaymentTerms] = useState<'DUE_ON_RECEIPT' | 'NET_7' | 'NET_15' | 'NET_30'>(
    (initialQuote?.paymentTerms as any) || 'DUE_ON_RECEIPT'
  );
  const [depositInput, setDepositInput] = useState<string>(
    initialQuote?.depositAmountCents ? (initialQuote.depositAmountCents / 100).toFixed(2) : ''
  );
  const [isGstSplit, setIsGstSplit] = useState<boolean>(
    initialQuote?.isGstSplit ?? (profile.isGstSplitEnabled ?? true)
  );
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(
    initialQuote?.placeOfSupply || profile.stateCode || ''
  );
  const [documentType, setDocumentType] = useState<'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE' | 'DELIVERY_CHALLAN'>(
    initialQuote?.documentType || profile.defaultInvoiceType || 'ESTIMATE'
  );
  const [isSigning, setIsSigning] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingPdfQuote, setPendingPdfQuote] = useState<Quote | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const recentClients = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; phone?: string; desc?: string }[] = [];
    for (const q of quotes) {
      if (q.clientName && q.clientName.trim() && !seen.has(q.clientName.trim().toLowerCase())) {
        seen.add(q.clientName.trim().toLowerCase());
        list.push({
          name: q.clientName.trim(),
          phone: q.clientPhone,
          desc: q.jobDescription,
        });
        if (list.length >= 6) break;
      }
    }
    return list;
  }, [quotes]);

  const handleInitiateSendPDF = (targetQuote: Quote) => {
    const needsCompanyName =
      !profile.hasCustomBusinessName &&
      (!profile.businessName || profile.businessName.trim() === '');
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
    const clampedRate = Math.max(0, Math.min(100, isNaN(parsedRate) ? 8.25 : parsedRate));
    const savedBasisPoints = Math.round(clampedRate * 100);
    updateProfile({
      taxEnabledByDefault: isTaxEnabled,
      defaultTaxBasisPoints: isTaxEnabled ? savedBasisPoints : profile.defaultTaxBasisPoints,
      taxLabel: taxLabelInput.trim() || profile.taxLabel || 'Sales Tax',
    });
    AlertService.alert(
      'Default Preference Saved',
      isTaxEnabled
        ? `Tax is now enabled by default at ${clampedRate.toFixed(2)}% (${taxLabelInput}) for all future estimates.`
        : 'All future estimates will now start tax-free / exempt by default.',
      undefined,
      'SUCCESS'
    );
  };

  // Take damage proof photo
  const handleCapturePhoto = async () => {
    try {
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      AlertService.alert('Camera Error', 'Could not open camera. Please try again.', undefined, 'DANGER');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      AlertService.alert('Gallery Error', 'Could not access photo library. Please try again.', undefined, 'DANGER');
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
      hsnSac: (preset as any).hsnSac || (isIndia ? '9954' : undefined),
      unit: (preset as any).unit || (isIndia ? 'nos' : undefined),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleAddCustomItem = () => {
    if (!customDesc.trim()) {
      AlertService.alert('Description Required', 'Please enter a description for the item.', undefined, 'WARNING');
      return;
    }
    const parsedPrice = parseFloat(customPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      AlertService.alert('Valid Price Required', 'Please enter a valid price amount greater than 0.', undefined, 'WARNING');
      return;
    }
    const unitCents = Math.round(parsedPrice * 100);
    const parsedQty = parseFloat(customQty);
    const qty = Math.max(0.01, isNaN(parsedQty) ? 1 : parsedQty);

    const parsedDiscount = parseFloat(customDiscount);
    if (!isNaN(parsedDiscount) && parsedDiscount > 100) {
      AlertService.alert('Invalid Discount', 'Discount percentage cannot exceed 100%.', undefined, 'WARNING');
      return;
    }
    const discount = isNaN(parsedDiscount) ? 0 : Math.max(0, Math.min(100, parsedDiscount));
    const grossCents = Math.round(qty * unitCents);
    const discountCents = discount > 0 ? Math.round((grossCents * discount) / 100) : 0;
    const itemTotalCents = Math.max(0, grossCents - discountCents);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItem: LineItem = {
      id: Crypto.randomUUID(),
      description: customDesc.trim(),
      unitPriceCents: unitCents,
      quantity: qty,
      totalCents: itemTotalCents,
      unit: customUnit || (isIndia ? 'nos' : undefined),
      hsnSac: customHsn.trim() || (isIndia ? '9954' : undefined),
      discountPercent: discount > 0 ? discount : undefined,
    };
    setItems((prev) => [...prev, newItem]);
    setCustomDesc('');
    setCustomPrice('');
    setCustomQty('1');
    setCustomDiscount('');
  };

  const handleRemoveItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const parsedTax = parseFloat(taxRateInput);
  const safeTaxPercent = isTaxEnabled
    ? Math.max(0, Math.min(100, isNaN(parsedTax) ? ((profile.defaultTaxBasisPoints ?? 825) / 100) : parsedTax))
    : 0;
  const taxBasisPoints = Math.round(safeTaxPercent * 100);
  const taxAmountCents = isTaxEnabled
    ? Math.round((subtotalCents * taxBasisPoints) / 10000)
    : 0;
  const totalAmountCents = subtotalCents + taxAmountCents;

  const regionConfig = RegionPaymentService.getConfig(profile.currencyCode, profile.currencySymbol, profile.region);
  const isIndia = (profile.region === 'IN') || (profile.region !== 'US' && (regionConfig.region === 'IN' || profile.currencyCode === 'INR' || profile.currencySymbol === '₹'));

  const availablePresets = React.useMemo(() => {
    if (isIndia) {
      const indianItems = RegionPaymentService.INDIAN_TRADE_PRESETS.map((p, idx) => ({
        id: `in-preset-${idx}`,
        title: p.title,
        priceCents: p.priceCents,
        category: p.category as any,
      }));
      return [...indianItems, ...presets];
    }
    const usItems = RegionPaymentService.US_TRADE_PRESETS.map((p, idx) => ({
      id: `us-preset-${idx}`,
      title: p.title,
      priceCents: p.priceCents,
      category: p.category as any,
    }));
    return [...usItems, ...presets];
  }, [isIndia, presets]);

  const parsedDeposit = parseFloat(depositInput);
  const safeDeposit = isNaN(parsedDeposit) ? 0 : Math.max(0, parsedDeposit);
  const depositAmountCents = Math.min(totalAmountCents, Math.round(safeDeposit * 100));
  const balanceDueCents = Math.max(0, totalAmountCents - depositAmountCents);

  const currencySymbol = profile.currencySymbol || (isIndia ? '₹' : '$');
  const totalFormatted = CurrencyService.format(totalAmountCents, currencySymbol, profile.currencyCode);

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
    if (safeDeposit > (totalAmountCents / 100)) {
      AlertService.alert('Deposit Exceeds Total', 'Advance deposit cannot be greater than the total amount.', undefined, 'WARNING');
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
      depositAmountCents: depositAmountCents > 0 ? depositAmountCents : undefined,
      paymentTerms,
      documentType,
      placeOfSupply: placeOfSupply.trim() || undefined,
      isGstSplit,
      dueDateTimestamp:
        paymentTerms === 'NET_7'
          ? Date.now() + 7 * 86400000
          : paymentTerms === 'NET_15'
          ? Date.now() + 15 * 86400000
          : paymentTerms === 'NET_30'
          ? Date.now() + 30 * 86400000
          : Date.now(),
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
        {/* Document Type Selector */}
        <View style={[styles.card, { paddingVertical: 12, marginBottom: 14 }]}>
          <Text style={styles.label}>Document Type</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(isIndia
              ? [
                  { id: 'TAX_INVOICE', label: 'Tax Invoice', icon: '📄' },
                  { id: 'ESTIMATE', label: 'Quotation', icon: '📋' },
                  { id: 'BILL_OF_SUPPLY', label: 'Bill of Supply', icon: '🧾' },
                  { id: 'DELIVERY_CHALLAN', label: 'Challan', icon: '🚚' },
                ]
              : [
                  { id: 'ESTIMATE', label: 'Estimate / Proposal', icon: '📋' },
                  { id: 'TAX_INVOICE', label: 'Invoice', icon: '📄' },
                ]
            ).map((doc) => {
              const isSelected = documentType === doc.id;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.termChip,
                    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 2 },
                    isSelected && { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDocumentType(doc.id as any);
                    if (doc.id === 'BILL_OF_SUPPLY' || doc.id === 'DELIVERY_CHALLAN') {
                      setIsTaxEnabled(false);
                    } else if (doc.id === 'TAX_INVOICE' && !isTaxEnabled) {
                      setIsTaxEnabled(true);
                    }
                  }}
                >
                  <Text style={{ fontSize: 13, marginBottom: 2 }}>{doc.icon}</Text>
                  <Text
                    style={[
                      styles.termChipText,
                      { fontSize: 10, textAlign: 'center', fontWeight: isSelected ? '800' : '600' },
                      isSelected && { color: colors.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {doc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Client Input */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.label}>Client Details</Text>
            {recentClients.length > 0 && (
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 }}>
                Quick Autofill
              </Text>
            )}
          </View>

          {recentClients.length > 0 && !clientName && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
            >
              {recentClients.map((c, idx) => (
                <TouchableOpacity
                  key={`client-${idx}`}
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderWidth: 1,
                    borderColor: colors.primary + '40',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: Theme.borderRadius.full,
                  }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setClientName(c.name);
                    if (c.phone) setClientPhone(c.phone);
                    if (c.desc && !jobDescription) setJobDescription(c.desc);
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                    + {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TextInput
            style={styles.input}
            placeholder={isIndia ? "Client Name (e.g. Vikram Malhotra)" : "Client Name (e.g. John Doe)"}
            placeholderTextColor={colors.textMuted}
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder={isIndia ? "Phone Number (e.g. 98450 12345)" : "Phone Number (e.g. (555) 234-5678)"}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={clientPhone}
            onChangeText={setClientPhone}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder={isIndia ? "Short Scope Summary (e.g. 3BHK Concealed Wiring & MCB)" : "Short Scope Summary (e.g. Electrical Breaker Swap)"}
            placeholderTextColor={colors.textMuted}
            value={jobDescription}
            onChangeText={setJobDescription}
          />
          {isIndia && (
            <View style={{ marginTop: 10 }}>
              <TextInput
                style={styles.input}
                placeholder="🏛️ Place of Supply / State (e.g. 29 - Karnataka)"
                placeholderTextColor={colors.textMuted}
                value={placeOfSupply}
                onChangeText={(val) => {
                  setPlaceOfSupply(val);
                  const contractorState = (profile.stateCode || '').substring(0, 2);
                  const clientState = val.trim().substring(0, 2);
                  if (contractorState && clientState && contractorState.length === 2 && clientState.length === 2) {
                    setIsGstSplit(contractorState === clientState);
                  }
                }}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: 'row', gap: 6, paddingTop: 6 }}
              >
                {[
                  '29 - Karnataka',
                  '27 - Maharashtra',
                  '07 - Delhi',
                  '33 - Tamil Nadu',
                  '36 - Telangana',
                  '09 - Uttar Pradesh',
                  '19 - West Bengal',
                  '24 - Gujarat',
                ].map((st) => {
                  const isSelected = placeOfSupply === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: isSelected ? colors.primary + '18' : colors.backgroundSecondary,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPlaceOfSupply(st);
                        const contractorState = (profile.stateCode || '29').substring(0, 2);
                        const clientState = st.substring(0, 2);
                        setIsGstSplit(contractorState === clientState);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10.5,
                          fontWeight: isSelected ? '800' : '600',
                          color: isSelected ? colors.primary : colors.textSecondary,
                        }}
                      >
                        {st} {isSelected ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
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
          <Text style={styles.sectionTitle}>{isIndia ? '🇮🇳 Trade Service Presets' : 'Quick Presets'}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
          {availablePresets.map((preset) => (
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
                  <Text style={styles.itemSub}>
                    Qty: {item.quantity}{item.unit ? ` ${item.unit}` : ''} × {currencySymbol}{(item.unitPriceCents / 100).toFixed(2)}
                    {item.hsnSac ? ` • SAC: ${item.hsnSac}` : ''}
                    {item.discountPercent ? ` • -${item.discountPercent}% Disc` : ''}
                  </Text>
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
          <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                style={[styles.input, { flex: 2, fontSize: 13 }]}
                placeholder="Custom item or part..."
                placeholderTextColor={colors.textMuted}
                value={customDesc}
                onChangeText={setCustomDesc}
              />
              <TextInput
                style={[styles.input, { flex: 1, fontSize: 13, textAlign: 'right' }]}
                placeholder={`${currencySymbol} Rate`}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={customPrice}
                onChangeText={setCustomPrice}
              />
            </View>

            {/* Qty, Unit Chips, Discount & Add Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ width: 68 }}>
                <TextInput
                  style={[styles.input, { fontSize: 12, textAlign: 'center', paddingVertical: 8 }]}
                  placeholder="Qty 1"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={customQty}
                  onChangeText={setCustomQty}
                />
              </View>

              <View style={{ width: 68 }}>
                <TextInput
                  style={[styles.input, { fontSize: 12, textAlign: 'center', paddingVertical: 8 }]}
                  placeholder="Disc %"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={customDiscount}
                  onChangeText={setCustomDiscount}
                />
              </View>

              {isIndia && (
                <View style={{ width: 72 }}>
                  <TextInput
                    style={[styles.input, { fontSize: 12, textAlign: 'center', paddingVertical: 8 }]}
                    placeholder="SAC #"
                    placeholderTextColor={colors.textMuted}
                    value={customHsn}
                    onChangeText={setCustomHsn}
                  />
                </View>
              )}

              <TouchableOpacity style={[styles.addCustomBtn, { flex: 1 }]} onPress={handleAddCustomItem}>
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.addCustomBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Trade Unit Selector Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
              {(isIndia
                ? ['nos', 'sq.ft', 'mtr', 'pts', 'hrs', 'kg', 'set', 'box']
                : ['hrs', 'sq ft', 'linear ft', 'ea', 'trip', 'system', 'day']
              ).map((u) => {
                const isSelected = customUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.primary + '15' : colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCustomUnit(u);
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: isSelected ? colors.primary : colors.textSecondary }}>
                      {u} {isSelected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

                {isIndia && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.termChip,
                        isGstSplit && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                        { flex: 1, alignItems: 'center' },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setIsGstSplit(true);
                      }}
                    >
                      <Text style={[styles.termChipText, isGstSplit && { color: colors.primary, fontWeight: '700' }]}>
                        🇮🇳 Intra-State (CGST+SGST)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.termChip,
                        !isGstSplit && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                        { flex: 1, alignItems: 'center' },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setIsGstSplit(false);
                      }}
                    >
                      <Text style={[styles.termChipText, !isGstSplit && { color: colors.primary, fontWeight: '700' }]}>
                        🇮🇳 Inter-State (IGST)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

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

          {depositAmountCents > 0 && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.emerald, fontWeight: '700' }]}>
                  Less: {regionConfig.depositLabel}
                </Text>
                <Text style={[styles.summaryVal, { color: colors.emerald, fontWeight: '700' }]}>
                  -{currencySymbol}{(depositAmountCents / 100).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={[styles.totalLabel, { fontSize: 14, color: colors.amber }]}>
                  {regionConfig.balanceDueLabel.toUpperCase()}
                </Text>
                <Text style={[styles.totalVal, { fontSize: 17, color: colors.amber }]}>
                  {currencySymbol}{(balanceDueCents / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Terms & Advance / Deposit Configuration */}
        <View style={styles.card}>
          <Text style={styles.label}>Payment Terms & Advance / Deposit</Text>

          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }}>
            Payment Schedule & Terms
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
            {(['DUE_ON_RECEIPT', 'NET_7', 'NET_15', 'NET_30'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.termChip,
                  paymentTerms === t && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 2 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPaymentTerms(t);
                }}
              >
                <Text
                  style={[
                    styles.termChipText,
                    paymentTerms === t && { color: colors.primary, fontWeight: '800' },
                    { fontSize: 11 },
                  ]}
                  numberOfLines={1}
                >
                  {t === 'DUE_ON_RECEIPT' ? 'On Receipt' : t === 'NET_7' ? 'Net 7' : t === 'NET_15' ? 'Net 15' : 'Net 30'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Due Date Display */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Theme.borderRadius.sm, marginBottom: 12, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
              📅 Expected Due Date:
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, marginLeft: 6 }}>
              {paymentTerms === 'DUE_ON_RECEIPT'
                ? 'Immediate (Due on Receipt)'
                : `${new Date(Date.now() + (paymentTerms === 'NET_7' ? 7 : paymentTerms === 'NET_15' ? 15 : 30) * 86400000).toLocaleDateString(regionConfig.locale, { month: 'short', day: 'numeric', year: 'numeric' })} (${paymentTerms === 'NET_7' ? '7 days' : paymentTerms === 'NET_15' ? '15 days' : '30 days'})`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                {regionConfig.depositLabel}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                Optional upfront advance collected
              </Text>
            </View>
            <View style={[styles.taxRateBox, { minWidth: 110, paddingVertical: 6, paddingHorizontal: 10 }]}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textSecondary, marginRight: 2 }}>{currencySymbol}</Text>
              <TextInput
                style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, flex: 1, textAlign: 'right' }}
                value={depositInput}
                onChangeText={setDepositInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Quick Deposit % Chips */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {[10, 25, 33, 50].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[
                  styles.termChip,
                  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const pctAmt = Math.round((totalAmountCents * pct) / 100);
                  setDepositInput((pctAmt / 100).toFixed(2));
                }}
              >
                <Text style={[styles.termChipText, { fontSize: 11, fontWeight: '700' }]}>
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
            {depositInput ? (
              <TouchableOpacity
                style={[
                  styles.termChip,
                  { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 10 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDepositInput('');
                }}
              >
                <Text style={[styles.termChipText, { fontSize: 11, color: colors.rose, fontWeight: '700' }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Legal Terms & Custom Scope Notes */}
        <View style={styles.card}>
          <Text style={styles.label}>Terms & Conditions</Text>
          {isIndia ? (
            <TouchableOpacity
              style={[
                styles.termChip,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary, marginBottom: 8, alignSelf: 'flex-start' },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotes(RegionPaymentService.INDIAN_STANDARD_TERMS);
              }}
            >
              <Text style={[styles.termChipText, { color: colors.primary, fontWeight: '700' }]}>
                📜 Apply Indian Trade T&Cs (Bayaana, 18% p.a., Jurisdiction)
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.termChip,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary, marginBottom: 8, alignSelf: 'flex-start' },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotes(RegionPaymentService.US_STANDARD_TERMS);
              }}
            >
              <Text style={[styles.termChipText, { color: colors.primary, fontWeight: '700' }]}>
                📜 Apply US Contractor Terms (Net 30, Lien Waiver, Warranty, Rescission)
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.termsChipRow}>
            {[
              'Payment due upon completion',
              isIndia ? 'No-Dues Receipt upon payment' : 'Lien waiver issued upon payment',
              isIndia ? 'Client supplies fixtures/materials' : 'Homeowner supplies fixtures',
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
