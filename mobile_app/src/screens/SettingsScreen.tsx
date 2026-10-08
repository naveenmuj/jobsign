import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { getThemeColors, ThemeColors, Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { AlertService } from '../services/AlertService';
import { CurrencyService, POPULAR_CURRENCIES } from '../services/CurrencyService';
import { PaywallModal } from '../components/PaywallModal';
import { BehaviorLogsModal } from '../components/BehaviorLogsModal';
import { BillingService } from '../services/BillingService';
import { TelemetryService } from '../services/TelemetryService';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { useAppSafeArea } from '../utils/safeArea';
import { runSelfDiagnostics } from '../services/DiagnosticService';
import { Quote } from '../types';
import { INVOICE_TEMPLATES, InvoiceTemplateId } from '../constants/invoiceTemplates';
import {
  ChevronLeft,
  Star,
  Zap,
  Shield,
  Download,
  Trash2,
  Camera,
  Image as ImageIcon,
  Building2,
  Palette,
  CheckCircle2,
  Eye,
  FileText,
  Activity,
  Bell,
  Globe,
  MapPin,
} from 'lucide-react-native';

// Sample quote used for live instant preview of invoice templates
const SAMPLE_PREVIEW_QUOTE: Quote = {
  id: 'preview-sample-quote',
  quoteNumber: 1042,
  clientName: 'Sarah Jenkins',
  clientPhone: '(512) 555-0199',
  clientEmail: 'sarah.jenkins@example.com',
  clientAddress: '4218 Crestview Dr, Austin, TX 78756',
  jobDescription: 'Main Electrical Panel Upgrade (200A) & Surge Protection',
  status: 'SIGNED_LOCKED',
  subtotalCents: 272500,
  taxRateBasisPoints: 825,
  taxAmountCents: 22481,
  totalAmountCents: 294981,
  taxLabel: 'Sales Tax',
  notes: '• 1-Year Workmanship Warranty on all labor and breaker connections\n• Homeowner supplies unobstructed access to meter and panel',
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now(),
  signatureSvg: '<path d="M 10 90 Q 60 20 110 85 T 210 70 Q 260 130 330 40 T 450 95" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  signatureTimestamp: Date.now(),
  signatureGpsLat: 30.2672,
  signatureGpsLng: -97.7431,
  pdfSha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  lineItems: [
    {
      id: 'li-1',
      description: '200-Amp Main Service Panel Replacement (Square D QO)',
      quantity: 1,
      unitPriceCents: 185000,
      totalCents: 185000,
    },
    {
      id: 'li-2',
      description: 'Whole-Home Surge Protective Device (Type 2 SPD)',
      quantity: 1,
      unitPriceCents: 35000,
      totalCents: 35000,
    },
    {
      id: 'li-3',
      description: 'Dual Copper Ground Rod System & Cold Water Bond',
      quantity: 1,
      unitPriceCents: 25000,
      totalCents: 25000,
    },
  ],
  changeOrders: [
    {
      id: 'co-1',
      quoteId: 'preview-sample-quote',
      orderNumber: 1,
      reason: 'Replaced Corroded Weatherhead Cable & Conduit',
      addedItems: [],
      addedTotalCents: 27500,
      signatureSvg: '<path d="M 10 90 Q 60 20 110 85 T 210 70 Q 260 130 330 40 T 450 95" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
      signatureTimestamp: Date.now(),
      pdfSha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    },
  ],
};

// ---------------------------------------------------------------------------
// Style factory — called with current theme colors so every token is dynamic
// ---------------------------------------------------------------------------
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
      flexDirection: 'row',
      alignItems: 'center',
      padding: 6,
      gap: 4,
    },
    backText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: 'bold',
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 60,
    },

    // ── Pro card ────────────────────────────────────────────────────────────
    proCard: {
      backgroundColor: colors.warningLight,
      borderWidth: 1.5,
      borderColor: colors.amber,
      borderRadius: Theme.borderRadius.md,
      padding: 16,
      marginBottom: 16,
    },
    proRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    proTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.amber,
    },
    proSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    proTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    upgradeBtn: {
      marginTop: 12,
      backgroundColor: colors.amber,
      minHeight: 48,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      ...Theme.shadows.primaryBtn,
    },
    upgradeBtnText: {
      color: '#0F172A',
      fontWeight: '900',
      fontSize: 14,
      letterSpacing: 0.5,
    },
    manageMembershipBtn: {
      marginTop: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      minHeight: 48,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    manageMembershipText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
      letterSpacing: 0.3,
    },
    proToggleBtn: {
      marginTop: 12,
      backgroundColor: colors.warningLight,
      borderWidth: 1,
      borderColor: colors.amber,
      paddingVertical: 10,
      borderRadius: Theme.borderRadius.sm,
      alignItems: 'center',
    },
    proToggleBtnActive: {
      backgroundColor: colors.successLight,
      borderColor: colors.emerald,
    },
    proToggleText: {
      color: colors.textPrimary,
      fontWeight: '900',
      fontSize: 13,
      letterSpacing: 0.5,
    },

    // ── Generic section card ─────────────────────────────────────────────────
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 16,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    cardHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 12,
      lineHeight: 16,
    },

    // ── Inputs ───────────────────────────────────────────────────────────────
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: Theme.borderRadius.sm,
      padding: 12,
      fontSize: 14,
      color: colors.textPrimary,
    },

    // ── Preset list ──────────────────────────────────────────────────────────
    newPresetRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    addPresetBtn: {
      backgroundColor: colors.primary,
      width: 48,
      borderRadius: Theme.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addPresetBtnText: {
      fontSize: 22,
      color: '#FFFFFF',
      fontWeight: 'bold',
      lineHeight: 26,
    },
    presetItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    presetTitleText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    presetPriceText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 2,
    },
    deletePresetBtn: {
      padding: 6,
    },

    // ── Backup / utility buttons ─────────────────────────────────────────────
    backupBtn: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: Theme.borderRadius.sm,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    backupBtnSecondary: {
      marginTop: 10,
    },
    backupBtnText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 13,
    },

    // ── Logo picker ──────────────────────────────────────────────────────────
    logoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: Theme.borderRadius.sm,
      padding: 12,
      marginBottom: 12,
    },
    logoImage: {
      width: 56,
      height: 56,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: '#FFFFFF',
    },
    logoActionsCol: {
      flex: 1,
      gap: 6,
    },
    logoPickerBtnRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    logoBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      borderRadius: Theme.borderRadius.sm,
    },
    logoBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // ── Save button ──────────────────────────────────────────────────────────
    saveBtn: {
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      ...Theme.shadows.primaryBtn,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    // ── Dark-mode toggle row ──────────────────────────────────────────────────
    darkModeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    darkModeTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    darkModeSub: {
      fontSize: 11.5,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    darkModeBtn: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 56,
      alignItems: 'center',
    },
    darkModeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    darkModeBtnText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 13,
    },
    darkModeBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },

    // ── Template Picker ──────────────────────────────────────────────────────
    templateCard: {
      backgroundColor: colors.surface,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 12,
    },
    templateCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    templateHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    templateName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    templateBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Theme.borderRadius.full,
    },
    templateBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    templateSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    templateDesc: {
      fontSize: 11.5,
      color: colors.textSecondary,
      lineHeight: 16,
      marginBottom: 8,
    },
    mockupContainer: {
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
      marginVertical: 6,
      backgroundColor: '#FFFFFF',
    },
    templateActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    previewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: Theme.borderRadius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    selectRadioBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectRadioBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectRadioText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    selectRadioTextActive: {
      color: '#FFFFFF',
    },
  });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    profile,
    updateProfile,
    isPro,
    setProStatus,
    presets,
    addPreset,
    removePreset,
    isDarkMode,
    toggleDarkMode,
  } = useQuoteStore();

  const colors = getThemeColors(isDarkMode);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [address, setAddress] = useState(profile.address || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email || '');
  const [logoUri, setLogoUri] = useState<string | null>(profile.logoUri || null);
  const [license, setLicense] = useState(profile.licenseNumber || '');
  const [defaultTaxRate, setDefaultTaxRate] = useState(
    ((profile.defaultTaxBasisPoints ?? 825) / 100).toFixed(2)
  );
  const [taxEnabledByDefault, setTaxEnabledByDefault] = useState(
    profile.taxEnabledByDefault ?? true
  );
  const [taxLabel, setTaxLabel] = useState(profile.taxLabel || 'Sales Tax');
  const [zelle, setZelle] = useState(profile.zelleAccount || '');
  const [venmo, setVenmo] = useState(profile.venmoAccount || '');
  const [cashApp, setCashApp] = useState(profile.cashAppAccount || '');
  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol || '$');
  const [currencyCode, setCurrencyCode] = useState(profile.currencyCode || 'USD');
  const [isDetectingCurrency, setIsDetectingCurrency] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>(
    profile.invoiceTemplate || 'modern'
  );
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBehaviorLogs, setShowBehaviorLogs] = useState(false);
  const [outboxAlerts, setOutboxAlerts] = useState(
    profile.notificationPreferences?.outboxAlerts ?? true
  );
  const [sealConfirmations, setSealConfirmations] = useState(
    profile.notificationPreferences?.sealConfirmations ?? true
  );
  const [paymentReminders, setPaymentReminders] = useState(
    profile.notificationPreferences?.paymentReminders ?? true
  );

  const handleDetectCurrency = async () => {
    setIsDetectingCurrency(true);
    try {
      const detected = await CurrencyService.detectFromLocationOrDevice();
      setCurrencySymbol(detected.symbol);
      setCurrencyCode(detected.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AlertService.alert({
        title: 'Currency Detected',
        message: `Set currency to ${detected.name} (${detected.symbol}) based on your device location and regional locale.`,
        type: 'SUCCESS',
      });
    } catch (err: any) {
      AlertService.alert({
        title: 'Detection Notice',
        message: 'Could not detect location. Defaulting to device timezone.',
        type: 'INFO',
      });
    } finally {
      setIsDetectingCurrency(false);
    }
  };

  const devTapCount = React.useRef(0);
  const devTapTimer = React.useRef<any>(null);

  const handleVersionTap = () => {
    devTapCount.current += 1;
    if (devTapTimer.current) clearTimeout(devTapTimer.current);
    devTapTimer.current = setTimeout(() => {
      devTapCount.current = 0;
    }, 2000);

    if (devTapCount.current >= 5) {
      devTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBehaviorLogs(true);
    }
  };

  const handlePickLogo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleCaptureLogo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      AlertService.alert({
        title: 'Camera Access',
        message: 'Please allow camera access to take a shop logo photo.',
        type: 'WARNING',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleOpenPaywall = async () => {
    if (!FEATURE_FLAGS.PAYMENT_ENABLED) return;
    const presented = await BillingService.presentRevenueCatPaywall();
    if (!presented) {
      setShowPaywall(true);
    }
  };

  const handlePreviewTemplate = async (templateId: InvoiceTemplateId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const previewProfile = {
        ...profile,
        businessName: businessName.trim() || profile.businessName,
        address: address.trim() || profile.address,
        ownerName: ownerName.trim() || profile.ownerName,
        phone: phone.trim() || profile.phone,
        email: email.trim() || profile.email,
        logoUri: logoUri || profile.logoUri,
        licenseNumber: license.trim() || profile.licenseNumber,
        invoiceTemplate: templateId,
      };
      await PDFService.generateAndSharePDF(SAMPLE_PREVIEW_QUOTE, previewProfile);
    } catch (err: any) {
      AlertService.alert({
        title: 'Preview Error',
        message: err?.message || 'Could not generate preview.',
        type: 'DANGER',
      });
    }
  };

  // Custom preset modal state
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');

  const handleSaveProfile = () => {
    const parsedTax = parseFloat(defaultTaxRate);
    const taxBasisPoints = Math.round((isNaN(parsedTax) ? 8.25 : parsedTax) * 100);
    updateProfile({
      businessName: businessName.trim() || 'My Contracting Co.',
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      logoUri: logoUri || undefined,
      licenseNumber: license.trim() || undefined,
      currencySymbol: currencySymbol.trim() || '$',
      currencyCode: currencyCode.trim() || 'USD',
      defaultTaxBasisPoints: taxBasisPoints,
      taxEnabledByDefault,
      taxLabel: taxLabel.trim() || 'Sales Tax',
      zelleAccount: zelle.trim() || undefined,
      venmoAccount: venmo.trim() || undefined,
      cashAppAccount: cashApp.trim() || undefined,
      hasCustomBusinessName: true,
      invoiceTemplate: selectedTemplate,
      notificationPreferences: {
        outboxAlerts,
        sealConfirmations,
        paymentReminders,
      },
    });
    TelemetryService.logProfile('NOTIFICATION_PREFERENCES_UPDATED', {
      outboxAlerts,
      sealConfirmations,
      paymentReminders,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AlertService.alert({
      title: 'Settings Saved',
      message: 'Your business profile, shop logo, template style, regional currency, tax, and notification preferences have been saved.',
      type: 'SUCCESS',
    });
  };

  const handleCreatePreset = () => {
    const priceCents = Math.round((parseFloat(newPresetPrice) || 0) * 100);
    if (!newPresetTitle.trim() || priceCents <= 0) {
      AlertService.alert({
        title: 'Invalid Preset',
        message: `Please enter a valid title and price (${currencySymbol}).`,
        type: 'WARNING',
      });
      return;
    }
    addPreset({
      title: newPresetTitle.trim(),
      priceCents,
      category: 'Common',
    });
    setNewPresetTitle('');
    setNewPresetPrice('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleExportBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const path = await PDFService.exportFullDatabaseBackup();
    if (!path) {
      AlertService.alert({
        title: 'Database Backup',
        message: 'All local estimates and signatures are securely preserved in offline SQLite.',
        type: 'SUCCESS',
      });
    }
  };

  const handleRunDiagnostics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const diag = await runSelfDiagnostics();
    if (diag.passed) {
      AlertService.alert({
        title: 'System Integrity OK',
        message: diag.results.join('\n'),
        type: 'SUCCESS',
      });
    } else {
      AlertService.alert({
        title: 'Diagnostic Alert',
        message: diag.results.join('\n'),
        type: 'WARNING',
      });
    }
  };

  const renderMiniMockup = (templateId: InvoiceTemplateId) => {
    if (templateId === 'modern') {
      return (
        <View style={styles.mockupContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1.5, borderColor: '#CBD5E1' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>JS</Text>
              </View>
              <View style={{ width: 65, height: 6, backgroundColor: '#0F172A', borderRadius: 2 }} />
            </View>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#EFF6FF', borderWidth: 0.5, borderColor: '#BFDBFE' }}>
              <Text style={{ fontSize: 7, fontWeight: '800', color: '#1E40AF' }}>ESTIMATE</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
            <View style={{ flex: 1, height: 16, backgroundColor: '#F8FAFC', borderRadius: 3, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 3, justifyContent: 'center' }}>
              <View style={{ width: '65%', height: 3.5, backgroundColor: '#64748B', borderRadius: 1 }} />
            </View>
            <View style={{ flex: 1, height: 16, backgroundColor: '#F8FAFC', borderRadius: 3, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 3, justifyContent: 'center' }}>
              <View style={{ width: '55%', height: 3.5, backgroundColor: '#64748B', borderRadius: 1 }} />
            </View>
          </View>
          <View style={{ gap: 3, marginVertical: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E2E8F0' }}>
              <View style={{ width: 85, height: 4, backgroundColor: '#334155', borderRadius: 1 }} />
              <View style={{ width: 30, height: 4, backgroundColor: '#0F172A', borderRadius: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E2E8F0' }}>
              <View style={{ width: 70, height: 4, backgroundColor: '#334155', borderRadius: 1 }} />
              <View style={{ width: 25, height: 4, backgroundColor: '#0F172A', borderRadius: 1 }} />
            </View>
          </View>
          <View style={{ alignSelf: 'flex-end', flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4, paddingTop: 4, borderTopWidth: 1.5, borderColor: '#0F172A' }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: '#475569' }}>TOTAL:</Text>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#0F172A' }}>{currencySymbol}2,949.81</Text>
          </View>
        </View>
      );
    }

    if (templateId === 'classic') {
      return (
        <View style={[styles.mockupContainer, { backgroundColor: '#FAF8F5', borderColor: '#D6D3D1' }]}>
          <View style={{ paddingBottom: 6, borderBottomWidth: 2, borderColor: '#44403C' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 18, height: 18, borderRadius: 2, backgroundColor: '#292524', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#78716C' }}>
                  <Text style={{ color: '#FAF8F5', fontSize: 9, fontWeight: '900', fontStyle: 'italic' }}>JS</Text>
                </View>
                <View style={{ width: 70, height: 6, backgroundColor: '#1C1917', borderRadius: 1 }} />
              </View>
              <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2, backgroundColor: '#FDF2F8', borderWidth: 0.5, borderColor: '#F472B6' }}>
                <Text style={{ fontSize: 7, fontWeight: '800', color: '#831843' }}>AGREEMENT</Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#44403C', marginTop: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
            <View style={{ flex: 1, height: 16, backgroundColor: '#FFFFFF', borderRadius: 2, borderWidth: 0.5, borderColor: '#D6D3D1', padding: 3, justifyContent: 'center' }}>
              <View style={{ width: '60%', height: 3.5, backgroundColor: '#831843', borderRadius: 1 }} />
            </View>
            <View style={{ flex: 1, height: 16, backgroundColor: '#FFFFFF', borderRadius: 2, borderWidth: 0.5, borderColor: '#D6D3D1', padding: 3, justifyContent: 'center' }}>
              <View style={{ width: '50%', height: 3.5, backgroundColor: '#831843', borderRadius: 1 }} />
            </View>
          </View>
          <View style={{ gap: 3, marginVertical: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E7E5E4' }}>
              <View style={{ width: 85, height: 4, backgroundColor: '#292524', borderRadius: 1 }} />
              <View style={{ width: 30, height: 4, backgroundColor: '#1C1917', borderRadius: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E7E5E4' }}>
              <View style={{ width: 65, height: 4, backgroundColor: '#292524', borderRadius: 1 }} />
              <View style={{ width: 25, height: 4, backgroundColor: '#1C1917', borderRadius: 1 }} />
            </View>
          </View>
          <View style={{ alignSelf: 'flex-end', flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderColor: '#1C1917', borderBottomWidth: 2, borderBottomColor: '#1C1917' }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: '#57534E', fontStyle: 'italic' }}>TOTAL:</Text>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#831843' }}>{currencySymbol}2,949.81</Text>
          </View>
        </View>
      );
    }

    if (templateId === 'minimal') {
      return (
        <View style={[styles.mockupContainer, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottomWidth: 1.5, borderColor: '#000000' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 16, height: 16, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>JS</Text>
              </View>
              <View style={{ width: 60, height: 5, backgroundColor: '#000000' }} />
            </View>
            <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: '#000000' }}>
              <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFFFFF' }}>#1042</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
            <View style={{ flex: 1, height: 16, borderLeftWidth: 2, borderColor: '#000000', paddingLeft: 4, justifyContent: 'center' }}>
              <View style={{ width: '60%', height: 3, backgroundColor: '#000000' }} />
            </View>
            <View style={{ flex: 1, height: 16, borderLeftWidth: 2, borderColor: '#000000', paddingLeft: 4, justifyContent: 'center' }}>
              <View style={{ width: '50%', height: 3, backgroundColor: '#000000' }} />
            </View>
          </View>
          <View style={{ gap: 3, marginVertical: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E5E7EB' }}>
              <View style={{ width: 80, height: 3.5, backgroundColor: '#111827' }} />
              <View style={{ width: 25, height: 3.5, backgroundColor: '#000000' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E5E7EB' }}>
              <View style={{ width: 65, height: 3.5, backgroundColor: '#111827' }} />
              <View style={{ width: 20, height: 3.5, backgroundColor: '#000000' }} />
            </View>
          </View>
          <View style={{ alignSelf: 'flex-end', backgroundColor: '#000000', paddingHorizontal: 6, paddingVertical: 3, marginTop: 4 }}>
            <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFFFFF' }}>{currencySymbol}2,949.81</Text>
          </View>
        </View>
      );
    }

    // contractor / industrial
    return (
      <View style={[styles.mockupContainer, { backgroundColor: '#FFFFFF', borderColor: '#D4D4D8' }]}>
        <View style={{ backgroundColor: '#18181B', padding: 5, borderRadius: 3, borderBottomWidth: 2, borderColor: '#F59E0B' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 16, height: 16, borderRadius: 2, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>JS</Text>
              </View>
              <View style={{ width: 60, height: 5, backgroundColor: '#FFFFFF', borderRadius: 1 }} />
            </View>
            <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: '#F59E0B', borderRadius: 2 }}>
              <Text style={{ fontSize: 7, fontWeight: '900', color: '#000000' }}>ESTIMATE</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
          <View style={{ flex: 1, height: 16, backgroundColor: '#F4F4F5', borderRadius: 2, borderTopWidth: 2, borderColor: '#D97706', padding: 3, justifyContent: 'center' }}>
            <View style={{ width: '60%', height: 3.5, backgroundColor: '#B45309', borderRadius: 1 }} />
          </View>
          <View style={{ flex: 1, height: 16, backgroundColor: '#F4F4F5', borderRadius: 2, borderTopWidth: 2, borderColor: '#D97706', padding: 3, justifyContent: 'center' }}>
            <View style={{ width: '50%', height: 3.5, backgroundColor: '#B45309', borderRadius: 1 }} />
          </View>
        </View>
        <View style={{ gap: 3, marginVertical: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E4E4E7' }}>
            <View style={{ width: 85, height: 4, backgroundColor: '#18181B', borderRadius: 1 }} />
            <View style={{ width: 30, height: 4, backgroundColor: '#18181B', borderRadius: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E4E4E7' }}>
            <View style={{ width: 70, height: 4, backgroundColor: '#18181B', borderRadius: 1 }} />
            <View style={{ width: 25, height: 4, backgroundColor: '#18181B', borderRadius: 1 }} />
          </View>
        </View>
        <View style={{ alignSelf: 'flex-end', backgroundColor: '#18181B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3, marginTop: 4 }}>
          <Text style={{ fontSize: 8, fontWeight: '900', color: '#FBBF24' }}>TOTAL: {currencySymbol}2,949.81</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <ChevronLeft size={20} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* ── Membership / Free Access Card ───────────────────────────────── */}
        <View style={styles.proCard}>
          <View style={styles.proRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.proTitleRow}>
                <Star size={16} color={colors.amber} fill={colors.amber} />
                <Text style={styles.proTitle}>
                  {FEATURE_FLAGS.PAYMENT_ENABLED
                    ? isPro
                      ? 'Pro Member — Unlimited Estimates'
                      : 'JobSign Pro — Early-Bird Pricing'
                    : 'JobSign Full Access — 100% Free'}
                </Text>
              </View>
              <Text style={styles.proSub}>
                {FEATURE_FLAGS.PAYMENT_ENABLED
                  ? isPro
                    ? 'Unlimited signed estimates, custom branding & courtroom audit seals.'
                    : [
                        '• Annual: $29.99 / year (save 37% vs monthly)',
                        '• Monthly: $3.99 / month',
                        '• Lifetime: $49.99 one-time',
                      ].join('\n')
                  : 'All Pro features, unlimited estimates, all 4 PDF templates, cryptographic seals, and courtroom audit certificates are completely free.'}
              </Text>
            </View>
          </View>

          {FEATURE_FLAGS.PAYMENT_ENABLED && (
            !isPro ? (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleOpenPaywall();
                }}
              >
                <Zap size={16} color="#0F172A" />
                <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.manageMembershipBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleOpenPaywall();
                }}
              >
                <Text style={styles.manageMembershipText}>Manage Membership / Restore</Text>
              </TouchableOpacity>
            )
          )}

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.proToggleBtn, isPro && styles.proToggleBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setProStatus(!isPro);
              }}
            >
              <Text style={styles.proToggleText}>
                {isPro ? '[DEV] Deactivate Pro' : '[DEV] Activate Pro'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Dark Mode Toggle ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Display</Text>
          <View style={styles.darkModeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkModeTitle}>Dark Mode</Text>
              <Text style={styles.darkModeSub}>
                Switch between light and dark interface themes.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.darkModeBtn, isDarkMode && styles.darkModeBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleDarkMode();
              }}
            >
              <Text style={[styles.darkModeBtnText, isDarkMode && styles.darkModeBtnTextActive]}>
                {isDarkMode ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Smart Alerts & Notifications ───────────────────────────────────── */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Bell size={16} color={colors.amber} />
            <Text style={styles.cardLabel}>Smart Alerts & Notifications</Text>
          </View>
          <Text style={styles.cardHint}>
            JobSign sends only functional, zero-spam notifications for critical job milestones and outbox deliveries.
          </Text>

          {/* Outbox delivery toggle */}
          <View style={[styles.darkModeRow, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkModeTitle}>Offline Outbox Delivery</Text>
              <Text style={styles.darkModeSub}>
                Alerts when queued basement agreements are automatically delivered upon reconnection.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.darkModeBtn, outboxAlerts && styles.darkModeBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOutboxAlerts(!outboxAlerts);
              }}
            >
              <Text style={[styles.darkModeBtnText, outboxAlerts && styles.darkModeBtnTextActive]}>
                {outboxAlerts ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seal confirmation toggle */}
          <View style={[styles.darkModeRow, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkModeTitle}>Signature & Seal Locks</Text>
              <Text style={styles.darkModeSub}>
                Instant confirmation when client signs and cryptographic SHA-256 seal locks.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.darkModeBtn, sealConfirmations && styles.darkModeBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSealConfirmations(!sealConfirmations);
              }}
            >
              <Text style={[styles.darkModeBtnText, sealConfirmations && styles.darkModeBtnTextActive]}>
                {sealConfirmations ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Payment reminder toggle */}
          <View style={[styles.darkModeRow, { paddingVertical: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkModeTitle}>Gentle Follow-Up Reminders</Text>
              <Text style={styles.darkModeSub}>
                Polite notice 3 days after job completion if payment has not yet been collected.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.darkModeBtn, paymentReminders && styles.darkModeBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPaymentReminders(!paymentReminders);
              }}
            >
              <Text style={[styles.darkModeBtnText, paymentReminders && styles.darkModeBtnTextActive]}>
                {paymentReminders ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Currency & Regional Format ───────────────────────────────────── */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Globe size={16} color={colors.primary} />
            <Text style={styles.cardLabel}>Currency & Regional Format</Text>
          </View>
          <Text style={styles.cardHint}>
            Sets the currency symbol across all estimates, line items, PDF contracts, signatures, and payments.
          </Text>

          {/* 1-Tap Auto Detect button */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
              borderColor: colors.primary,
              borderWidth: 1,
              borderRadius: Theme.borderRadius.md,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginTop: 6,
              marginBottom: 12,
            }}
            onPress={handleDetectCurrency}
            disabled={isDetectingCurrency}
            activeOpacity={0.8}
          >
            <MapPin size={16} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
              {isDetectingCurrency ? 'Detecting Location...' : 'Auto-Detect Currency from Device / GPS'}
            </Text>
          </TouchableOpacity>

          {/* Quick Select Chips */}
          <Text style={[styles.cardLabel, { fontSize: 11, marginBottom: 6, color: colors.textSecondary }]}>
            POPULAR CURRENCIES
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {POPULAR_CURRENCIES.map((c) => {
              const isSelected = currencyCode === c.code || currencySymbol === c.symbol;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: Theme.borderRadius.full,
                    backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrencySymbol(c.symbol);
                    setCurrencyCode(c.code);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                    }}
                  >
                    {c.symbol} {c.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Symbol Input */}
          <Text style={[styles.cardLabel, { fontSize: 11, marginTop: 4, marginBottom: 6, color: colors.textSecondary }]}>
            ACTIVE CURRENCY SYMBOL
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ₹, $, £, €, CA$, A$, ¥, AED"
            placeholderTextColor={colors.textMuted}
            value={currencySymbol}
            onChangeText={(val) => {
              setCurrencySymbol(val);
              const match = POPULAR_CURRENCIES.find((c) => c.symbol.trim() === val.trim());
              if (match) setCurrencyCode(match.code);
            }}
          />
        </View>

        {/* ── Business Profile ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Shop & Business Profile</Text>
          <Text style={styles.cardHint}>
            Your shop name, logo, and physical address appear at the top of every generated client estimate and invoice PDF.
          </Text>

          {/* Shop Logo Picker */}
          <View style={styles.logoBox}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            ) : (
              <View
                style={[
                  styles.logoImage,
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Building2 size={24} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.logoActionsCol}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                {logoUri ? 'Shop Logo Attached' : 'Add Shop Logo'}
              </Text>
              <View style={styles.logoPickerBtnRow}>
                <TouchableOpacity style={styles.logoBtn} onPress={handlePickLogo}>
                  <ImageIcon size={14} color={colors.primary} />
                  <Text style={styles.logoBtnText}>{logoUri ? 'Change' : 'Gallery'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoBtn} onPress={handleCaptureLogo}>
                  <Camera size={14} color={colors.textSecondary} />
                  <Text style={styles.logoBtnText}>Camera</Text>
                </TouchableOpacity>
                {logoUri && (
                  <TouchableOpacity
                    style={[styles.logoBtn, { borderColor: colors.roseLight }]}
                    onPress={() => setLogoUri(null)}
                  >
                    <Trash2 size={14} color={colors.rose} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Shop Name */}
          <Text style={[styles.cardLabel, { marginTop: 4, marginBottom: 4 }]}>SHOP / COMPANY NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name (e.g. Apex Electric LLC)"
            placeholderTextColor={colors.textMuted}
            value={businessName}
            onChangeText={setBusinessName}
          />

          {/* Shop Physical Address */}
          <Text style={[styles.cardLabel, { marginTop: 10, marginBottom: 4 }]}>SHOP ADDRESS / LOCATION</Text>
          <TextInput
            style={styles.input}
            placeholder="Physical Address (e.g. 1204 Industrial Blvd, Austin, TX)"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          {/* Owner / Master Licensee Name */}
          <Text style={[styles.cardLabel, { marginTop: 10, marginBottom: 4 }]}>OWNER / CONTRACTOR NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Owner / Master Licensee Name"
            placeholderTextColor={colors.textMuted}
            value={ownerName}
            onChangeText={setOwnerName}
          />

          {/* Phone */}
          <Text style={[styles.cardLabel, { marginTop: 10, marginBottom: 4 }]}>CLIENT CONTACT PHONE</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number for Clients"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Email */}
          <Text style={[styles.cardLabel, { marginTop: 10, marginBottom: 4 }]}>BUSINESS EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="Email Address (e.g. contact@apexservice.com)"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* License */}
          <Text style={[styles.cardLabel, { marginTop: 10, marginBottom: 4 }]}>LICENSE / REGISTRATION # (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            placeholder="License / Registration # (optional)"
            placeholderTextColor={colors.textMuted}
            value={license}
            onChangeText={setLicense}
          />
        </View>

        {/* ── Invoice Design & Templates ─────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Palette size={16} color={colors.primary} />
            <Text style={styles.cardLabel}>Invoice Design & Templates</Text>
          </View>
          <Text style={styles.cardHint}>
            Choose from 4 executive styles tailored for trades, high-end residential, and modern contractors. Tap any design to select or preview the PDF.
          </Text>

          <View style={{ marginTop: 12 }}>
            {INVOICE_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <TouchableOpacity
                  key={tmpl.id}
                  activeOpacity={0.88}
                  style={[styles.templateCard, isSelected && styles.templateCardActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTemplate(tmpl.id);
                  }}
                >
                  <View style={styles.templateHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.templateName}>{tmpl.name}</Text>
                      {isSelected && (
                        <CheckCircle2 size={16} color={colors.primary} />
                      )}
                    </View>
                    <View
                      style={[
                        styles.templateBadge,
                        {
                          backgroundColor:
                            tmpl.id === 'modern'
                              ? '#EFF6FF'
                              : tmpl.id === 'classic'
                              ? '#FDF2F8'
                              : tmpl.id === 'minimal'
                              ? '#F3F4F6'
                              : '#FFFBEB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.templateBadgeText,
                          {
                            color:
                              tmpl.id === 'modern'
                                ? '#1E40AF'
                                : tmpl.id === 'classic'
                                ? '#9D174D'
                                : tmpl.id === 'minimal'
                                ? '#1F2937'
                                : '#B45309',
                          },
                        ]}
                      >
                        {tmpl.badge}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.templateSubtitle}>
                    {tmpl.subtitle} • {tmpl.fontFamilyName}
                  </Text>
                  <Text style={styles.templateDesc}>{tmpl.description}</Text>

                  {/* Visual Mockup Wireframe */}
                  {renderMiniMockup(tmpl.id)}

                  {/* Actions Row */}
                  <View style={styles.templateActionRow}>
                    <TouchableOpacity
                      style={styles.previewBtn}
                      onPress={() => handlePreviewTemplate(tmpl.id)}
                    >
                      <Eye size={13} color={colors.primary} />
                      <Text style={styles.previewBtnText}>Preview PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.selectRadioBtn, isSelected && styles.selectRadioBtnActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTemplate(tmpl.id);
                      }}
                    >
                      <Text style={[styles.selectRadioText, isSelected && styles.selectRadioTextActive]}>
                        {isSelected ? '✓ ACTIVE STYLE' : 'USE THIS STYLE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Tax & Localization Preferences ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tax & Localization Preferences</Text>
          <Text style={styles.cardHint}>
            Configure whether sales tax, VAT, or GST is applied by default across your estimates.
          </Text>

          {/* Default Tax Enable/Disable Toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 14 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
                Apply Tax by Default
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                {taxEnabledByDefault
                  ? 'All new estimates will start with tax calculated'
                  : 'New estimates start tax-free / exempt (can enable per quote)'}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: taxEnabledByDefault ? colors.primary : colors.backgroundSecondary,
                borderColor: taxEnabledByDefault ? colors.primary : colors.border,
                borderWidth: 1.5,
                borderRadius: Theme.borderRadius.full,
                paddingHorizontal: 14,
                paddingVertical: 7,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTaxEnabledByDefault(!taxEnabledByDefault);
              }}
            >
              <Text
                style={{
                  color: taxEnabledByDefault ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '800',
                  fontSize: 12,
                }}
              >
                {taxEnabledByDefault ? 'ENABLED' : 'DISABLED'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tax Name / Label */}
          <Text style={[styles.cardLabel, { marginTop: 4, marginBottom: 6 }]}>Tax Name / Label</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {['Sales Tax', 'VAT', 'GST', 'HST'].map((t) => (
              <TouchableOpacity
                key={t}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Theme.borderRadius.full,
                  backgroundColor: taxLabel === t ? colors.primary : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: taxLabel === t ? colors.primary : colors.border,
                }}
                onPress={() => setTaxLabel(t)}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: taxLabel === t ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Custom Tax Label (e.g. Sales Tax, VAT, GST)"
            placeholderTextColor={colors.textMuted}
            value={taxLabel}
            onChangeText={setTaxLabel}
          />

          {/* Default Rate (%) */}
          <Text style={[styles.cardLabel, { marginTop: 12, marginBottom: 6 }]}>Default Rate (%)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {[
              { label: '0% (Exempt)', val: '0.00' },
              { label: '5% (GST)', val: '5.00' },
              { label: '8.25% (US TX)', val: '8.25' },
              { label: '10% (AU GST)', val: '10.00' },
              { label: '13% (CA HST)', val: '13.00' },
              { label: '20% (UK VAT)', val: '20.00' },
            ].map((r) => (
              <TouchableOpacity
                key={r.val}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: Theme.borderRadius.full,
                  backgroundColor: defaultTaxRate === r.val ? colors.primary : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: defaultTaxRate === r.val ? colors.primary : colors.border,
                }}
                onPress={() => setDefaultTaxRate(r.val)}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: defaultTaxRate === r.val ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Default Rate (%) (e.g. 8.25 or 20.00)"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={defaultTaxRate}
            onChangeText={setDefaultTaxRate}
          />
        </View>

        {/* ── Payment Accounts ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Payment Accounts</Text>
          <Text style={styles.cardHint}>
            Used to generate on-screen QR codes for instant homeowner payment (0% fee).
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Zelle Phone or Email"
            placeholderTextColor={colors.textMuted}
            value={zelle}
            onChangeText={setZelle}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Venmo Username (e.g. @ApexElectric)"
            placeholderTextColor={colors.textMuted}
            value={venmo}
            onChangeText={setVenmo}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Cash App Cashtag (e.g. $ApexElectric)"
            placeholderTextColor={colors.textMuted}
            value={cashApp}
            onChangeText={setCashApp}
          />
        </View>

        {/* ── Service Presets ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Service Presets ({presets.length})</Text>
          <View style={styles.newPresetRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Item Name (e.g. Capacitor)"
              placeholderTextColor={colors.textMuted}
              value={newPresetTitle}
              onChangeText={setNewPresetTitle}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={`${currencySymbol} Price`}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={newPresetPrice}
              onChangeText={setNewPresetPrice}
            />
            <TouchableOpacity style={styles.addPresetBtn} onPress={handleCreatePreset}>
              <Text style={styles.addPresetBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {presets.map((p) => (
            <View key={p.id} style={styles.presetItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.presetTitleText}>{p.title}</Text>
                <Text style={styles.presetPriceText}>{currencySymbol}{(p.priceCents / 100).toFixed(0)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removePreset(p.id)}
                style={styles.deletePresetBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Trash2 size={16} color={colors.rose} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Local Storage & Backup ────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Local Storage & Backup</Text>
          <Text style={styles.cardHint}>
            JobSign runs 100% offline. Export an encrypted archive of your SQLite quotes and
            signatures anytime.
          </Text>
          <TouchableOpacity style={styles.backupBtn} onPress={handleExportBackup}>
            <Download size={15} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.backupBtnText}>Export Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backupBtn, styles.backupBtnSecondary]}
            onPress={handleRunDiagnostics}
          >
            <Shield size={15} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.backupBtnText}>Run Diagnostics</Text>
          </TouchableOpacity>
        </View>

        {/* ── Save Button ───────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        {/* Discreet App Version Footer (Secret 5-Tap Developer Console) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleVersionTap}
          style={{ alignItems: 'center', marginTop: 24, paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
            JobSign v1.0.0 (Build 1)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* Behavior Logs Modal */}
      <BehaviorLogsModal visible={showBehaviorLogs} onClose={() => setShowBehaviorLogs(false)} />
    </View>
  );
};
