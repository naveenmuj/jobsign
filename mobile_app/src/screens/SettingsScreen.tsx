import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { getThemeColors, ThemeColors, Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { AlertService } from '../services/AlertService';
import { CurrencyService, POPULAR_CURRENCIES } from '../services/CurrencyService';
import { RegionPaymentService } from '../services/RegionPaymentService';
import { PaywallModal } from '../components/PaywallModal';
import { BehaviorLogsModal } from '../components/BehaviorLogsModal';
import { BillingService } from '../services/BillingService';
import { TelemetryService } from '../services/TelemetryService';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { useAppSafeArea } from '../utils/safeArea';
import { runSelfDiagnostics } from '../services/DiagnosticService';
import { ExportService } from '../services/ExportService';
import { Quote, ContractorProfile } from '../types';
import { INVOICE_TEMPLATES, InvoiceTemplateId } from '../constants/invoiceTemplates';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  Image as ImageIcon,
  Palette,
  Zap,
  Globe,
  FileText,
  Bell,
  Download,
  Shield,
  Eye,
  Check,
  X,
  Camera,
  Trash2,
  CheckCircle2,
  Star,
  Activity,
  MapPin,
  Lock,
  FileSpreadsheet,
} from 'lucide-react-native';

// Generates a localized preview quote matching the active regional currency & tax setup
const getSamplePreviewQuote = (code: string, symbol: string): Quote => {
  const isIndia = code === 'INR' || symbol === '₹';
  if (isIndia) {
    return {
      id: 'preview-sample-quote-in',
      quoteNumber: 1042,
      clientName: 'Ramesh Kumar',
      clientPhone: '+91 98450 12345',
      clientEmail: 'ramesh.kumar@example.in',
      clientAddress: '14, 100ft Road, Indiranagar, Bengaluru, KA 560038',
      placeOfSupply: '29 - Karnataka',
      documentType: 'TAX_INVOICE',
      jobDescription: 'Concealed Electrical Conduit, Wiring & Switchboard Fitting',
      status: 'SIGNED_LOCKED',
      subtotalCents: 870000,
      taxRateBasisPoints: 1800,
      taxAmountCents: 156600,
      totalAmountCents: 1026600,
      depositAmountCents: 300000,
      paymentTerms: 'NET_15',
      dueDateTimestamp: Date.now() + 15 * 86400000,
      taxLabel: 'GST',
      isGstSplit: true,
      notes: '• 1-Year Workmanship Warranty on all labor and conduit fittings\n• 50% Advance with work order\n• Balance payable within 15 days of project sign-off',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      signatureSvg: '<path d="M 10 90 Q 60 20 110 85 T 210 70 Q 260 130 330 40 T 450 95" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
      signatureTimestamp: Date.now(),
      signatureGpsLat: 12.9716,
      signatureGpsLng: 77.5946,
      pdfSha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      lineItems: [
        {
          id: 'li-1',
          description: 'Concealed Copper Wiring & FR PVC Conduit (24 Points)',
          quantity: 24,
          unitPriceCents: 25000,
          totalCents: 600000,
        },
        {
          id: 'li-2',
          description: 'Modular Switchboard & MCB Distribution Box Installation',
          quantity: 6,
          unitPriceCents: 35000,
          totalCents: 210000,
        },
        {
          id: 'li-3',
          description: 'Ceiling Fan Assembly & Safety Hook Anchor Fitting',
          quantity: 4,
          unitPriceCents: 15000,
          totalCents: 60000,
        },
      ],
    };
  }

  return {
    id: 'preview-sample-quote-us',
    quoteNumber: 1042,
    clientName: 'Sarah Jenkins',
    clientPhone: '(512) 555-0199',
    clientEmail: 'sarah.jenkins@example.com',
    clientAddress: '4218 Crestview Dr, Austin, TX 78756',
    jobDescription: 'Main Electrical Panel Upgrade (200A) & Surge Protection',
    documentType: 'TAX_INVOICE',
    status: 'SIGNED_LOCKED',
    subtotalCents: 272500,
    taxRateBasisPoints: 825,
    taxAmountCents: 22481,
    totalAmountCents: 294981,
    depositAmountCents: 50000,
    paymentTerms: 'DUE_ON_RECEIPT',
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
        description: 'Whole-Home Type 2 Surge Protective Device (SPD)',
        quantity: 1,
        unitPriceCents: 47500,
        totalCents: 47500,
      },
      {
        id: 'li-3',
        description: 'City Electrical Permit Application & Inspection Coordination',
        quantity: 1,
        unitPriceCents: 40000,
        totalCents: 40000,
      },
    ],
  };
};

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const {
    profile,
    quotes,
    updateProfile,
    presets,
    addPreset,
    deleteQuote,
    isDarkMode,
    toggleSunlightMode,
  } = useQuoteStore();

  const colors = getThemeColors(isDarkMode);
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();

  // Active sub-modal state (null = show clean menu)
  type ModalType =
    | 'PROFILE'
    | 'LOGO'
    | 'TEMPLATE'
    | 'PAYMENT'
    | 'CURRENCY_TAX'
    | 'NOTIFICATIONS'
    | 'PRESETS'
    | 'BACKUP'
    | 'LEGAL';
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [address, setAddress] = useState(profile.address || '');
  const [license, setLicense] = useState(profile.licenseNumber || '');
  const [taxIdNumber, setTaxIdNumber] = useState(profile.taxIdNumber || profile.licenseNumber || '');
  const [logoUri, setLogoUri] = useState<string | null>(profile.logoUri || null);

  const [defaultTaxRate, setDefaultTaxRate] = useState(
    ((profile.defaultTaxBasisPoints ?? 825) / 100).toFixed(2)
  );
  const [taxEnabledByDefault, setTaxEnabledByDefault] = useState(
    profile.taxEnabledByDefault ?? true
  );
  const [taxLabel, setTaxLabel] = useState(profile.taxLabel || 'Sales Tax');

  const [currencySymbol, setCurrencySymbol] = useState(profile.currencySymbol || '$');
  const [currencyCode, setCurrencyCode] = useState(profile.currencyCode || 'USD');
  const [isDetectingCurrency, setIsDetectingCurrency] = useState(false);
  const [stateCode, setStateCode] = useState(profile.stateCode || '');
  const [isGstSplitEnabled, setIsGstSplitEnabled] = useState(profile.isGstSplitEnabled ?? true);
  const [defaultInvoiceType, setDefaultInvoiceType] = useState(profile.defaultInvoiceType || 'ESTIMATE');

  // Payments
  const [upiId, setUpiId] = useState(profile.upiId || '');
  const [upiPayeeName, setUpiPayeeName] = useState(profile.upiPayeeName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(profile.bankAccountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(profile.bankIfsc || '');
  const [bankName, setBankName] = useState(profile.bankName || '');
  const [zelle, setZelle] = useState(profile.zelleAccount || '');
  const [venmo, setVenmo] = useState(profile.venmoAccount || '');
  const [cashApp, setCashApp] = useState(profile.cashAppAccount || '');
  const [customPaymentLabel, setCustomPaymentLabel] = useState(profile.customPaymentLabel || '');
  const [customPaymentNote, setCustomPaymentNote] = useState(profile.customPaymentNote || '');
  const [showOtherRails, setShowOtherRails] = useState(false);

  // Templates
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>(
    profile.invoiceTemplate || 'modern'
  );
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);

  // Notifications
  const [outboxAlerts, setOutboxAlerts] = useState(
    profile.notificationPreferences?.outboxAlerts ?? true
  );
  const [sealConfirmations, setSealConfirmations] = useState(
    profile.notificationPreferences?.sealConfirmations ?? true
  );
  const [paymentReminders, setPaymentReminders] = useState(
    profile.notificationPreferences?.paymentReminders ?? true
  );

  // Presets
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<'Diagnostic' | 'Labor' | 'Parts' | 'Common'>('Labor');

  // Modals & Diagnostic
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBehaviorLogs, setShowBehaviorLogs] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [versionTapCount, setVersionTapCount] = useState(0);

  // Initials for avatar
  const initials = (businessName || 'JobSign')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'JS';

  const regionConfig = useMemo(() => {
    return RegionPaymentService.getConfig(currencyCode, currencySymbol);
  }, [currencyCode, currencySymbol]);

  // Save changes to store
  const handleSaveAll = (showToast = true) => {
    const parsedTax = parseFloat(defaultTaxRate);
    const taxBasisPoints = Math.round((isNaN(parsedTax) ? 8.25 : parsedTax) * 100);

    let updatedSavedBanks = profile.savedBankAccounts || [];
    if (bankAccountNumber.trim()) {
      const newBank = {
        id: Date.now().toString(),
        accountNumber: bankAccountNumber.trim(),
        ifscOrRouting: bankIfsc.trim().toUpperCase() || undefined,
        bankName: bankName.trim() || undefined,
        beneficiaryName: upiPayeeName.trim() || businessName.trim() || ownerName.trim() || undefined,
      };
      updatedSavedBanks = [newBank, ...updatedSavedBanks.filter((b) => b.accountNumber !== bankAccountNumber.trim())];
    }

    let updatedSavedUpis = profile.savedUpiAccounts || [];
    if (upiId.trim()) {
      const newUpi = {
        id: Date.now().toString(),
        upiId: upiId.trim().toLowerCase(),
        payeeName: upiPayeeName.trim() || businessName.trim() || ownerName.trim() || undefined,
      };
      updatedSavedUpis = [newUpi, ...updatedSavedUpis.filter((u) => u.upiId.toLowerCase() !== upiId.trim().toLowerCase())];
    }

    const updatedProfile: Partial<ContractorProfile> = {
      businessName: businessName.trim() || 'My Contracting Co.',
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      logoUri: logoUri || undefined,
      licenseNumber: license.trim() || taxIdNumber.trim() || undefined,
      taxIdNumber: taxIdNumber.trim() || undefined,
      stateCode: stateCode.trim() || undefined,
      isGstSplitEnabled,
      defaultInvoiceType,
      currencySymbol: currencySymbol.trim() || '$',
      currencyCode: currencyCode.trim() || 'USD',
      defaultTaxBasisPoints: taxBasisPoints,
      taxEnabledByDefault,
      taxLabel: taxLabel.trim() || 'Sales Tax',
      zelleAccount: zelle.trim() || undefined,
      venmoAccount: venmo.trim() || undefined,
      cashAppAccount: cashApp.trim() || undefined,
      upiId: upiId.trim().toLowerCase() || undefined,
      upiPayeeName: upiPayeeName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
      bankName: bankName.trim() || undefined,
      savedBankAccounts: updatedSavedBanks,
      savedUpiAccounts: updatedSavedUpis,
      customPaymentLabel: customPaymentLabel.trim() || undefined,
      customPaymentNote: customPaymentNote.trim() || undefined,
      hasCustomBusinessName: true,
      invoiceTemplate: selectedTemplate,
      notificationPreferences: {
        outboxAlerts,
        sealConfirmations,
        paymentReminders,
      },
    };

    updateProfile(updatedProfile);
    TelemetryService.logProfile('NOTIFICATION_PREFERENCES_UPDATED', {
      outboxAlerts,
      sealConfirmations,
      paymentReminders,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (showToast) {
      AlertService.alert({
        title: 'Settings Saved',
        message: 'Your preferences have been successfully updated.',
        type: 'SUCCESS',
      });
    }
  };

  const handlePickLogo = async (fromCamera = false) => {
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        AlertService.alert({
          title: 'Permission Required',
          message: 'Camera & photo library permissions are needed to select your company logo.',
          type: 'WARNING',
        });
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let uriToStore = asset.uri;
        if (asset.base64) {
          const mime = asset.mimeType || 'image/png';
          uriToStore = `data:${mime};base64,${asset.base64}`;
        }
        setLogoUri(uriToStore);
        updateProfile({ logoUri: uriToStore });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      AlertService.alert({
        title: 'Logo Error',
        message: err?.message || 'Failed to select logo.',
        type: 'DANGER',
      });
    }
  };

  const handlePreviewTemplate = async (templateId: InvoiceTemplateId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPreviewingPdf) return;
    setIsPreviewingPdf(true);
    try {
      const previewProfile: ContractorProfile = {
        ...profile,
        businessName: businessName.trim() || profile.businessName,
        address: address.trim() || profile.address,
        ownerName: ownerName.trim() || profile.ownerName,
        phone: phone.trim() || profile.phone,
        email: email.trim() || profile.email,
        logoUri: logoUri || profile.logoUri,
        licenseNumber: license.trim() || profile.licenseNumber,
        currencySymbol: currencySymbol || profile.currencySymbol || '$',
        currencyCode: currencyCode || profile.currencyCode || 'USD',
        invoiceTemplate: templateId,
      };
      // Uses direct viewPDF with localized sample data matching the active currency & region
      const sampleQuote = getSamplePreviewQuote(previewProfile.currencyCode || 'USD', previewProfile.currencySymbol || '$');
      await PDFService.viewPDF(sampleQuote, previewProfile);
    } catch (err: any) {
      AlertService.alert({
        title: 'Preview Error',
        message: err?.message || 'Could not preview template.',
        type: 'DANGER',
      });
    } finally {
      setIsPreviewingPdf(false);
    }
  };

  const handleDetectCurrency = async () => {
    setIsDetectingCurrency(true);
    try {
      const detected = await CurrencyService.detectFromLocationOrDevice();
      setCurrencySymbol(detected.symbol);
      setCurrencyCode(detected.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AlertService.alert({
        title: 'Currency Detected',
        message: `Set currency to ${detected.name} (${detected.symbol}) based on your location/locale.`,
        type: 'SUCCESS',
      });
    } catch (err: any) {
      AlertService.alert({
        title: 'Detection Failed',
        message: 'Could not auto-detect location. Please select currency manually.',
        type: 'WARNING',
      });
    } finally {
      setIsDetectingCurrency(false);
    }
  };

  const handleAddPreset = () => {
    if (!newPresetTitle.trim()) {
      AlertService.alert({ title: 'Invalid Preset', message: 'Enter a title for the service preset.', type: 'WARNING' });
      return;
    }
    const cents = Math.round((parseFloat(newPresetPrice) || 0) * 100);
    addPreset({
      title: newPresetTitle.trim(),
      priceCents: cents,
      category: newPresetCategory,
    });
    setNewPresetTitle('');
    setNewPresetPrice('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleBackupExport = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await PDFService.exportFullDatabaseBackup();
      AlertService.alert({
        title: 'Backup Created',
        message: 'Your SQLite database and legal audit records have been exported.',
        type: 'SUCCESS',
      });
    } catch (err: any) {
      AlertService.alert({
        title: 'Backup Failed',
        message: err?.message || 'Could not export database.',
        type: 'DANGER',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const handleExportCSV = async () => {
    if (isExportingCSV) return;
    setIsExportingCSV(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await ExportService.exportQuotesToCSV(quotes, profile);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleVersionTap = () => {
    const next = versionTapCount + 1;
    setVersionTapCount(next);
    if (next >= 5) {
      setVersionTapCount(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBehaviorLogs(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const activeTemplateName =
    INVOICE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name || 'Modern Navy';

  const renderMiniMockup = (templateId: InvoiceTemplateId) => {
    const accentColor =
      templateId === 'modern'
        ? '#1E3A8A'
        : templateId === 'classic'
        ? '#831843'
        : templateId === 'minimal'
        ? '#111827'
        : '#D97706';

    return (
      <View
        style={{
          height: 48,
          backgroundColor: '#FFFFFF',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: accentColor + '30',
          padding: 6,
          marginVertical: 8,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ height: 6, width: 34, backgroundColor: accentColor, borderRadius: 2 }} />
          <View style={{ height: 4, width: 20, backgroundColor: '#94A3B8', borderRadius: 2 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <View style={{ height: 3, flex: 1, backgroundColor: '#E2E8F0', borderRadius: 1 }} />
          <View style={{ height: 3, width: 18, backgroundColor: '#E2E8F0', borderRadius: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ height: 3, width: 24, backgroundColor: '#E2E8F0', borderRadius: 1 }} />
          <View style={{ paddingHorizontal: 4, paddingVertical: 1, backgroundColor: accentColor, borderRadius: 2 }}>
            <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFFFFF' }}>TOTAL</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <ChevronLeft size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 20 }} />
        )}
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.sunlightBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleSunlightMode();
          }}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Zap size={16} color={colors.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Summary Hero Card ─────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.profileHeroCard}
          onPress={() => setActiveModal('PROFILE')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroBusinessName} numberOfLines={1}>
              {businessName || 'Your Business Name'}
            </Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {ownerName || 'Licensed Contractor'} • {phone || 'Tap to add phone'}
            </Text>
            <View style={styles.activeTemplateBadge}>
              <Palette size={11} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.activeTemplateBadgeText}>Style: {activeTemplateName}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ── Group 1: Business Identity & Branding ─────────────────────────── */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeader}>BUSINESS & BRANDING</Text>

          <SettingsRow
            icon={<Building2 size={18} color={colors.primary} />}
            title="Company Profile"
            subtitle={businessName || 'Name, phone, email, address, license'}
            colors={colors}
            onPress={() => setActiveModal('PROFILE')}
          />

          <SettingsRow
            icon={<ImageIcon size={18} color="#8B5CF6" />}
            title="Company Logo"
            subtitle={logoUri ? 'Custom invoice logo active' : 'Tap to upload company logo'}
            badge={logoUri ? 'Active' : undefined}
            badgeColor={colors.emerald}
            colors={colors}
            onPress={() => setActiveModal('LOGO')}
          />

          <SettingsRow
            icon={<Palette size={18} color="#EC4899" />}
            title="Invoice Design & Templates"
            subtitle={`Current: ${activeTemplateName} (4 executive styles)`}
            badge="Customizable"
            badgeColor="#EC4899"
            colors={colors}
            isLast
            onPress={() => setActiveModal('TEMPLATE')}
          />
        </View>

        {/* ── Group 2: Payments & Taxes ─────────────────────────────────────── */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeader}>PAYMENTS & FINANCIALS</Text>

          <SettingsRow
            icon={<Zap size={18} color="#EAB308" />}
            title="Instant QR & Bank Transfer"
            subtitle={
              upiId
                ? `${regionConfig.region === 'IN' ? 'UPI QR' : 'Instant QR'}: ${upiId}`
                : zelle
                ? `Zelle: ${zelle}`
                : bankAccountNumber
                ? `Bank: A/C ending ...${bankAccountNumber.slice(-4)}`
                : regionConfig.region === 'IN'
                ? 'Set up UPI ID or Bank Account'
                : 'Set up Instant QR or Bank account'
            }
            badge={upiId || zelle || bankAccountNumber ? 'Active' : 'Setup Required'}
            badgeColor={upiId || zelle || bankAccountNumber ? colors.emerald : colors.amber}
            colors={colors}
            onPress={() => setActiveModal('PAYMENT')}
          />

          <SettingsRow
            icon={<Globe size={18} color="#06B6D4" />}
            title="Currency & Taxes"
            subtitle={`${currencySymbol} (${currencyCode}) • Tax: ${
              taxEnabledByDefault ? defaultTaxRate + '% ' + taxLabel : 'Disabled'
            }`}
            colors={colors}
            isLast
            onPress={() => setActiveModal('CURRENCY_TAX')}
          />
        </View>

        {/* ── Group 3: Operations & Presets ─────────────────────────────────── */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeader}>OPERATIONS & CATALOG</Text>

          <SettingsRow
            icon={<FileText size={18} color="#10B981" />}
            title="Service & Price Presets"
            subtitle={`${presets.length} presets configured for fast quoting`}
            colors={colors}
            onPress={() => setActiveModal('PRESETS')}
          />

          <SettingsRow
            icon={<Bell size={18} color="#F59E0B" />}
            title="Notification Alerts"
            subtitle="Seal confirmations, outbox dispatches, payment reminders"
            colors={colors}
            isLast
            onPress={() => setActiveModal('NOTIFICATIONS')}
          />
        </View>

        {/* ── Group 4: Data & Legal ─────────────────────────────────────────── */}
        <View style={styles.groupCard}>
          <Text style={styles.groupHeader}>DATA & LEGAL COMPLIANCE</Text>

          <SettingsRow
            icon={<FileSpreadsheet size={18} color="#10B981" />}
            title="Bookkeeping Export (CSV / Excel)"
            subtitle="1-tap export for CA, CPA, or tax filing"
            badge="Excel / CSV"
            badgeColor={colors.emerald}
            colors={colors}
            onPress={handleExportCSV}
          />

          <SettingsRow
            icon={<Download size={18} color="#3B82F6" />}
            title="Data Backup & Export"
            subtitle="Export SQLite encrypted database backup"
            colors={colors}
            onPress={() => setActiveModal('BACKUP')}
          />

          <SettingsRow
            icon={<Shield size={18} color="#6366F1" />}
            title="Legal & ESIGN Compliance"
            subtitle="Irrebuttable evidence, UETA & court admissibility"
            colors={colors}
            isLast
            onPress={() => setActiveModal('LEGAL')}
          />
        </View>

        {/* ── About & Version Footer ─────────────────────────────────────────── */}
        <View style={styles.aboutFooter}>
          <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.6}>
            <Text style={styles.versionText}>JobSign v1.0.0 (Release Build)</Text>
            <Text style={styles.versionSub}>Offline-First Local SQLite • Hermetic Audit Trail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.diagBtn}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const r = await runSelfDiagnostics();
              AlertService.alert({
                title: r.passed ? 'Diagnostics Passed' : 'Diagnostic Warning',
                message: r.results.join('\n'),
                type: r.passed ? 'SUCCESS' : 'WARNING',
              });
            }}
          >
            <Activity size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.diagBtnText}>Run Self-Diagnostics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════════
          SUB-MODALS (Clean focused modal sheets opened on clicking items)
      ════════════════════════════════════════════════════════════════════════ */}

      {/* ── MODAL 1: COMPANY PROFILE ───────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'PROFILE'}
        title="Company Profile"
        subtitle="Appears on all digital contracts, client receipts & legal headers"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <Text style={styles.inputLabel}>Business / Contracting Name *</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.region === 'IN' ? "e.g. Apex Electricals & Services" : "e.g. Apex Electrical Solutions"}
          placeholderTextColor={colors.textMuted}
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Text style={styles.inputLabel}>Owner / Contractor Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.region === 'IN' ? "e.g. Ramesh Sharma" : "e.g. John Miller"}
          placeholderTextColor={colors.textMuted}
          value={ownerName}
          onChangeText={setOwnerName}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.region === 'IN' ? "e.g. 98450 12345" : "e.g. (555) 234-5678"}
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.region === 'IN' ? "e.g. contractor@sharmaelectric.in" : "e.g. contractor@mybusiness.com"}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Business Physical Address</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.region === 'IN' ? "e.g. #14, 100ft Road, Indiranagar, Bengaluru" : "e.g. 100 Main Street, Suite 200"}
          placeholderTextColor={colors.textMuted}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.inputLabel}>{regionConfig.businessIdLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.businessIdPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={taxIdNumber}
          onChangeText={setTaxIdNumber}
        />

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => {
            handleSaveAll(true);
            setActiveModal(null);
          }}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Save Company Profile</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 2: COMPANY LOGO ──────────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'LOGO'}
        title="Company Logo"
        subtitle="High-resolution logo embedded in PDF headers"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <View style={styles.logoModalCenter}>
          <View style={styles.largeLogoBox}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.largeLogoImg} />
            ) : (
              <View style={styles.logoPlaceholderBox}>
                <ImageIcon size={44} color={colors.textMuted} />
                <Text style={styles.logoPlaceholderText}>No Logo Uploaded</Text>
              </View>
            )}
          </View>

          <View style={styles.logoActionRow}>
            <TouchableOpacity style={styles.logoPickBtn} onPress={() => handlePickLogo(true)}>
              <Camera size={16} color={colors.primary} />
              <Text style={styles.logoPickBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoPickBtn} onPress={() => handlePickLogo(false)}>
              <ImageIcon size={16} color={colors.primary} />
              <Text style={styles.logoPickBtnText}>Choose Photo</Text>
            </TouchableOpacity>

            {logoUri ? (
              <TouchableOpacity
                style={styles.logoRemoveBtn}
                onPress={() => {
                  setLogoUri(null);
                  updateProfile({ logoUri: undefined });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Trash2 size={16} color={colors.rose} />
                <Text style={styles.logoRemoveBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => {
            handleSaveAll(true);
            setActiveModal(null);
          }}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Done</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 3: INVOICE STYLE & TEMPLATES ─────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'TEMPLATE'}
        title="Invoice Design & Templates"
        subtitle="Tap 'View Sample Invoice' on any style to preview a full PDF"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        {INVOICE_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <View
              key={tmpl.id}
              style={[styles.templateCard, isSelected && styles.templateCardSelected]}
            >
              {/* Header */}
              <View style={styles.templateCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.templateTitle}>{tmpl.name}</Text>
                    {isSelected && (
                      <View style={styles.activePill}>
                        <Check size={10} color="#FFFFFF" />
                        <Text style={styles.activePillText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.templateDesc}>{tmpl.description}</Text>
                </View>
              </View>

              {/* Visual Mockup Wireframe */}
              {renderMiniMockup(tmpl.id)}

              {/* Action Buttons */}
              <View style={styles.templateActionRow}>
                <TouchableOpacity
                  style={styles.viewSampleBtn}
                  onPress={() => handlePreviewTemplate(tmpl.id)}
                  disabled={isPreviewingPdf}
                >
                  {isPreviewingPdf ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Eye size={14} color={colors.primary} />
                      <Text style={styles.viewSampleBtnText}>View Sample Invoice</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectStyleBtn, isSelected && styles.selectStyleBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTemplate(tmpl.id);
                  }}
                >
                  <Text style={[styles.selectStyleBtnText, isSelected && styles.selectStyleBtnTextActive]}>
                    {isSelected ? '✓ Selected' : 'Select Style'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => {
            handleSaveAll(true);
            setActiveModal(null);
          }}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Apply Selected Template</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 4: DIRECT PAYMENT & SETTLEMENT ────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'PAYMENT'}
        title="Instant QR & Bank Transfer"
        subtitle="Pre-fills amount when homeowner scans QR code (0% middleman fees)"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        {profile?.savedUpiAccounts && profile.savedUpiAccounts.length > 1 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
              SAVED PAYMENT IDS (TAP TO SWITCH):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
              {profile.savedUpiAccounts.map((acc) => {
                const isSelected = upiId.toLowerCase() === acc.upiId.toLowerCase();
                return (
                  <TouchableOpacity
                    key={acc.id || acc.upiId}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isSelected ? colors.primary + '15' : colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => {
                      setUpiId(acc.upiId);
                      if (acc.payeeName) setUpiPayeeName(acc.payeeName);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? colors.primary : colors.textSecondary }}>
                      ⚡ {acc.upiId} {isSelected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Text style={styles.inputLabel}>{regionConfig.instantIdLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.instantIdPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.inputHelp}>
          {regionConfig.region === 'IN'
            ? 'When client scans with GPay, PhonePe, Paytm or BHIM, funds transfer directly to your bank account.'
            : 'Pre-filled automatically when homeowner scans the QR code.'}
        </Text>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Registered Payee / Business Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Name displayed on client's payment screen"
          placeholderTextColor={colors.textMuted}
          value={upiPayeeName}
          onChangeText={setUpiPayeeName}
        />

        {profile?.savedBankAccounts && profile.savedBankAccounts.length > 1 && (
          <View style={{ marginTop: 12, marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
              SAVED BANK ACCOUNTS (TAP TO SWITCH):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
              {profile.savedBankAccounts.map((acc) => {
                const isSelected = bankAccountNumber === acc.accountNumber;
                const shortAcc = acc.accountNumber.length > 4 ? `••••${acc.accountNumber.slice(-4)}` : acc.accountNumber;
                return (
                  <TouchableOpacity
                    key={acc.id || acc.accountNumber}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isSelected ? colors.primary + '15' : colors.backgroundSecondary,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}
                    onPress={() => {
                      setBankAccountNumber(acc.accountNumber);
                      setBankIfsc(acc.ifscOrRouting || '');
                      setBankName(acc.bankName || '');
                      if (acc.beneficiaryName) setUpiPayeeName(acc.beneficiaryName);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? colors.primary : colors.textSecondary }}>
                      🏛️ {acc.bankName ? `${acc.bankName} (${shortAcc})` : shortAcc} {isSelected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>{regionConfig.bankAccountLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.bankAccountPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={bankAccountNumber}
          onChangeText={setBankAccountNumber}
          keyboardType="numeric"
        />

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>{regionConfig.bankCodeLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={regionConfig.bankCodePlaceholder}
          placeholderTextColor={colors.textMuted}
          value={bankIfsc}
          onChangeText={setBankIfsc}
          autoCapitalize="characters"
        />

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bank Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chase, HDFC Bank, Barclays, RBC"
          placeholderTextColor={colors.textMuted}
          value={bankName}
          onChangeText={setBankName}
        />

        {/* Custom Flexibility & Invoice Instructions */}
        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border }}>
          <Text style={[styles.inputLabel, { color: colors.primary }]}>Custom Payment Label (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder={`Overrides default "${regionConfig.instantRailName}" on invoices`}
            placeholderTextColor={colors.textMuted}
            value={customPaymentLabel}
            onChangeText={setCustomPaymentLabel}
          />
          <Text style={styles.inputHelp}>
            Customize what clients see on their contract (e.g. "Direct Bank Settlement", "Company Pay").
          </Text>

          <Text style={[styles.inputLabel, { marginTop: 12, color: colors.primary }]}>
            Invoice Payment Instructions / Note (Optional)
          </Text>
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
            placeholder="e.g. Please put Quote # in transfer notes. Payment due within 7 days."
            placeholderTextColor={colors.textMuted}
            value={customPaymentNote}
            onChangeText={setCustomPaymentNote}
            multiline
          />
          <Text style={styles.inputHelp}>
            Printed directly onto the invoice & PDF contracts for client instructions.
          </Text>
        </View>

        {/* International Rails Toggle */}
        <TouchableOpacity
          style={{ marginTop: 14, alignSelf: 'flex-start' }}
          onPress={() => setShowOtherRails(!showOtherRails)}
        >
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>
            {showOtherRails ? 'Hide US Rails (Zelle/Venmo) ▲' : 'Show US Rails (Zelle, Venmo, Cash App) ▼'}
          </Text>
        </TouchableOpacity>

        {showOtherRails && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
            <Text style={styles.inputLabel}>Zelle Phone or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. contractor@mybusiness.com or (555) 234-5678"
              placeholderTextColor={colors.textMuted}
              value={zelle}
              onChangeText={setZelle}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Venmo Username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. @ContractorHandle"
              placeholderTextColor={colors.textMuted}
              value={venmo}
              onChangeText={setVenmo}
            />

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Cash App Cashtag</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. $ContractorCashtag"
              placeholderTextColor={colors.textMuted}
              value={cashApp}
              onChangeText={setCashApp}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => {
            handleSaveAll(true);
            setActiveModal(null);
          }}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Save Payment Accounts</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 5: CURRENCY & TAXES ───────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'CURRENCY_TAX'}
        title="Currency & Tax Preferences"
        subtitle="Automatic GPS detection & sales tax calculation rules"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <Text style={styles.inputLabel}>Selected Currency Symbol</Text>
        <View style={styles.currencyChips}>
          {POPULAR_CURRENCIES.map((c) => {
            const isCur = currencySymbol === c.symbol;
            return (
              <TouchableOpacity
                key={c.code}
                style={[styles.currencyChip, isCur && styles.currencyChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrencySymbol(c.symbol);
                  setCurrencyCode(c.code);
                  if (c.code === 'INR') {
                    if (taxLabel === 'Sales Tax' || !taxLabel) setTaxLabel('GST');
                    if (defaultTaxRate === '8.25' || !defaultTaxRate) setDefaultTaxRate('18.00');
                  } else if (c.code === 'USD') {
                    if (taxLabel === 'GST' || !taxLabel) setTaxLabel('Sales Tax');
                    if (defaultTaxRate === '18.00' || !defaultTaxRate) setDefaultTaxRate('8.25');
                  }
                }}
              >
                <Text style={[styles.currencyChipSymbol, isCur && styles.currencyChipSymbolActive]}>
                  {c.symbol}
                </Text>
                <Text style={[styles.currencyChipCode, isCur && styles.currencyChipCodeActive]}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.detectBtn}
          onPress={handleDetectCurrency}
          disabled={isDetectingCurrency}
        >
          {isDetectingCurrency ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.detectBtnText}>Auto-Detect From Device Location</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Default Tax Rate (%)</Text>
        <View style={styles.taxPresetRow}>
          {[
            { label: '0%', val: '0.00' },
            { label: '5% (GST)', val: '5.00' },
            { label: '8.25% (US)', val: '8.25' },
            { label: '10% (AU)', val: '10.00' },
            { label: '13% (CA)', val: '13.00' },
            { label: '18% (GST)', val: '18.00' },
          ].map((r) => (
            <TouchableOpacity
              key={r.val}
              style={[styles.taxChip, defaultTaxRate === r.val && styles.taxChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDefaultTaxRate(r.val);
              }}
            >
              <Text style={[styles.taxChipText, defaultTaxRate === r.val && styles.taxChipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="Custom Rate (e.g. 8.25)"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={defaultTaxRate}
          onChangeText={setDefaultTaxRate}
        />

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tax Label Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sales Tax, GST, VAT"
          placeholderTextColor={colors.textMuted}
          value={taxLabel}
          onChangeText={setTaxLabel}
        />

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setTaxEnabledByDefault(!taxEnabledByDefault)}
        >
          <Text style={styles.toggleLabel}>Enable Tax by Default on New Estimates</Text>
          <View style={[styles.toggleSwitch, taxEnabledByDefault && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, taxEnabledByDefault && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        {regionConfig.region === 'IN' && (
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>
                🇮🇳 GST & Indian Compliance
              </Text>
              <View style={{ backgroundColor: colors.emerald + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.emerald }}>myBillBook Standard</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Registered State & 2-Digit GST Code</Text>
            <View style={styles.taxPresetRow}>
              {[
                { code: '29', name: '29 - Karnataka' },
                { code: '27', name: '27 - Maharashtra' },
                { code: '07', name: '07 - Delhi' },
                { code: '33', name: '33 - Tamil Nadu' },
                { code: '36', name: '36 - Telangana' },
                { code: '24', name: '24 - Gujarat' },
                { code: '09', name: '09 - Uttar Pradesh' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.code}
                  style={[styles.taxChip, stateCode === s.name && styles.taxChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStateCode(s.name);
                  }}
                >
                  <Text style={[styles.taxChipText, stateCode === s.name && styles.taxChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, { marginTop: 4 }]}
              placeholder="e.g. 29 - Karnataka, 27 - Maharashtra"
              placeholderTextColor={colors.textMuted}
              value={stateCode}
              onChangeText={setStateCode}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Default Document Title</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 }}>
              {[
                { id: 'TAX_INVOICE' as const, label: 'Tax Invoice' },
                { id: 'BILL_OF_SUPPLY' as const, label: 'Bill of Supply' },
                { id: 'ESTIMATE' as const, label: 'Estimate / Quote' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.taxChip,
                    { flex: 1, alignItems: 'center' },
                    defaultInvoiceType === t.id && styles.taxChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDefaultInvoiceType(t.id);
                  }}
                >
                  <Text style={[styles.taxChipText, defaultInvoiceType === t.id && styles.taxChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsGstSplitEnabled(!isGstSplitEnabled)}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>Auto Split CGST (50%) + SGST (50%)</Text>
                <Text style={styles.toggleSub}>
                  Applies intra-state 50/50 tax breakdown (e.g. 18% GST → 9% CGST + 9% SGST)
                </Text>
              </View>
              <View style={[styles.toggleSwitch, isGstSplitEnabled && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, isGstSplitEnabled && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => {
            handleSaveAll(true);
            setActiveModal(null);
          }}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Save Currency & Taxes</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 6: PRESETS ───────────────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'PRESETS'}
        title="Service & Price Presets"
        subtitle="Quick-insert common diagnostic, labor and material line items"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <View style={styles.addPresetBox}>
          <Text style={styles.inputLabel}>Add New Line Item Preset</Text>
          <TextInput
            style={styles.input}
            placeholder="Service Title (e.g. Drain Cleaning)"
            placeholderTextColor={colors.textMuted}
            value={newPresetTitle}
            onChangeText={setNewPresetTitle}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder={`Price in ${currencySymbol} (e.g. 150.00)`}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={newPresetPrice}
            onChangeText={setNewPresetPrice}
          />

          <TouchableOpacity style={styles.addPresetBtn} onPress={handleAddPreset}>
            <Text style={styles.addPresetBtnText}>+ Add to Catalog</Text>
          </TouchableOpacity>
        </View>

        {regionConfig.region === 'IN' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.emerald + '15',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.emerald + '30',
              marginBottom: 14,
            }}
            onPress={() => {
              RegionPaymentService.INDIAN_TRADE_PRESETS.forEach((p) => {
                if (!presets.some((existing) => existing.title === p.title)) {
                  addPreset({
                    title: p.title,
                    priceCents: p.priceCents,
                    category: p.category as any,
                  });
                }
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              AlertService.alert({
                title: 'Indian Presets Loaded',
                message: 'Standard electrical, plumbing, fitting & painting presets added to your catalog.',
                type: 'SUCCESS',
              });
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.emerald }}>
              🇮🇳 Load Indian Trade Presets (Wiring, Fitting, Plumbing)
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Existing Presets ({presets.length})</Text>
        {presets.map((p) => (
          <View key={p.id} style={styles.presetItemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.presetTitle}>{p.title}</Text>
              <Text style={styles.presetCategory}>{p.category}</Text>
            </View>
            <Text style={styles.presetPrice}>
              {currencySymbol}
              {(p.priceCents / 100).toFixed(2)}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => setActiveModal(null)}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Done</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 7: NOTIFICATIONS ─────────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'NOTIFICATIONS'}
        title="Notification Preferences"
        subtitle="Proactive milestones and legal seal alerts"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setSealConfirmations(!sealConfirmations)}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.toggleLabel}>Client Seal Confirmations</Text>
            <Text style={styles.toggleSub}>
              Alert immediately when client finishes signing on glass.
            </Text>
          </View>
          <View style={[styles.toggleSwitch, sealConfirmations && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, sealConfirmations && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setOutboxAlerts(!outboxAlerts)}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.toggleLabel}>Offline Sync Dispatches</Text>
            <Text style={styles.toggleSub}>
              Alert when outbox queue finishes synchronizing upon cellular reconnection.
            </Text>
          </View>
          <View style={[styles.toggleSwitch, outboxAlerts && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, outboxAlerts && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setPaymentReminders(!paymentReminders)}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.toggleLabel}>Uncollected Balance Reminders</Text>
            <Text style={styles.toggleSub}>
              Polite reminders for uncollected signed contracts.
            </Text>
          </View>
          <View style={[styles.toggleSwitch, paymentReminders && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, paymentReminders && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => {
            handleSaveAll(true);
            setActiveModal(null);
          }}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Save Notification Settings</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 8: BACKUP ────────────────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'BACKUP'}
        title="Data Backup & Database Export"
        subtitle="Export local encrypted SQLite tables and digital signatures"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <Text style={styles.backupDesc}>
          JobSign operates offline-first. All estimates, GPS coordinates, affirmative consent
          timestamps, and SHA-256 integrity hashes are stored in your phone's private SQLite database.
        </Text>

        <TouchableOpacity
          style={styles.backupBtn}
          onPress={handleBackupExport}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Download size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.backupBtnText}>Export Database Backup (.db)</Text>
            </>
          )}
        </TouchableOpacity>
      </SettingsSubModal>

      {/* ── MODAL 9: LEGAL ─────────────────────────────────────────────────── */}
      <SettingsSubModal
        visible={activeModal === 'LEGAL'}
        title="Legal Terms & Compliance"
        subtitle="Statutory compliance under ESIGN Act & UETA"
        colors={colors}
        insets={insets}
        onClose={() => setActiveModal(null)}
      >
        <View style={styles.legalBox}>
          <Text style={styles.legalTitle}>Electronic Signatures in Global & National Commerce Act (15 U.S.C. § 7001)</Text>
          <Text style={styles.legalBody}>
            Electronic records and touch signatures captured in JobSign satisfy statutory
            requirements for legal validity. Affirmative consent is explicitly confirmed by the
            client before signing, binding both parties.
          </Text>

          <Text style={[styles.legalTitle, { marginTop: 12 }]}>Tamper-Evident SHA-256 Integrity</Text>
          <Text style={styles.legalBody}>
            Every agreement receives a unique 256-bit cryptographic digest representing the entire
            terms, pricing, and signature. Any post-signing alteration invalidates the seal immediately.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.modalPrimaryBtn}
          onPress={() => setActiveModal(null)}
        >
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.modalPrimaryBtnText}>Understood</Text>
        </TouchableOpacity>
      </SettingsSubModal>

      {/* Other Modals */}
      {showPaywall && <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />}
      {showBehaviorLogs && (
        <BehaviorLogsModal visible={showBehaviorLogs} onClose={() => setShowBehaviorLogs(false)} />
      )}
    </View>
  );
};

// ── Reusable Settings Row Component ──────────────────────────────────────────
const SettingsRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  colors: ThemeColors;
  isLast?: boolean;
}> = ({ icon, title, subtitle, badge, badgeColor, onPress, colors, isLast }) => {
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.backgroundSecondary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
            {title}
          </Text>
          {badge ? (
            <View
              style={{
                backgroundColor: (badgeColor || colors.primary) + '18',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: badgeColor || colors.primary,
                  textTransform: 'uppercase',
                }}
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text
            style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

// ── Reusable Sub-Modal Component ─────────────────────────────────────────────
const SettingsSubModal: React.FC<{
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  colors: ThemeColors;
  insets: any;
}> = ({ visible, title, subtitle, onClose, children, colors, insets }) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '92%',
            paddingBottom: 24 + insets.bottom,
            borderTopWidth: 1,
            borderColor: colors.border,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              style={{
                padding: 6,
                borderRadius: 20,
                backgroundColor: colors.backgroundSecondary,
                marginLeft: 10,
              }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
      padding: 6,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sunlightBtn: {
      padding: 6,
    },
    scrollContent: {
      padding: 16,
    },
    // Hero profile card
    profileHeroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '18',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
      borderWidth: 1.5,
      borderColor: colors.primary + '40',
      overflow: 'hidden',
    },
    avatarImg: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarInitials: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
    },
    heroBusinessName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    heroSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    activeTemplateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    activeTemplateBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    // Groups
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      overflow: 'hidden',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    groupHeader: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    // Sub-modal styles
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
    },
    inputHelp: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 4,
    },
    modalPrimaryBtn: {
      backgroundColor: colors.emerald,
      paddingVertical: 14,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    modalPrimaryBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    // Logo Modal
    logoModalCenter: {
      alignItems: 'center',
      paddingVertical: 10,
    },
    largeLogoBox: {
      width: 120,
      height: 120,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 16,
    },
    largeLogoImg: {
      width: 120,
      height: 120,
    },
    logoPlaceholderBox: {
      alignItems: 'center',
      gap: 6,
    },
    logoPlaceholderText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    logoActionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    logoPickBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoPickBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    logoRemoveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.roseLight,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.rose + '30',
    },
    logoRemoveBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.rose,
    },
    // Template Cards
    templateCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    templateCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
      borderWidth: 2,
    },
    templateCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    templateTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    templateDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 16,
    },
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.emerald,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    activePillText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    templateActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    viewSampleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    viewSampleBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    selectStyleBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectStyleBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectStyleBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    selectStyleBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    // Currency & Tax
    currencyChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    currencyChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    currencyChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    currencyChipSymbol: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    currencyChipSymbolActive: {
      color: '#FFFFFF',
    },
    currencyChipCode: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
    },
    currencyChipCodeActive: {
      color: '#FFFFFF',
    },
    detectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      marginTop: 6,
    },
    detectBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    taxPresetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    taxChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taxChipActive: {
      backgroundColor: colors.emerald,
      borderColor: colors.emerald,
    },
    taxChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    taxChipTextActive: {
      color: '#FFFFFF',
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    toggleLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    toggleSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    toggleSwitch: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border,
      padding: 2,
    },
    toggleSwitchActive: {
      backgroundColor: colors.emerald,
    },
    toggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
    },
    toggleThumbActive: {
      alignSelf: 'flex-end',
    },
    // Presets Modal
    addPresetBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    addPresetBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    addPresetBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    presetItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    presetTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    presetCategory: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    presetPrice: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.emerald,
    },
    // Backup & Legal
    backupDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 16,
    },
    backupBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    backupBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    legalBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      padding: 14,
      marginBottom: 16,
    },
    legalTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    legalBody: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    // Footer
    aboutFooter: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    versionText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
      textAlign: 'center',
    },
    versionSub: {
      fontSize: 10,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    diagBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
    },
    diagBtnText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
