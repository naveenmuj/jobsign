import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { getThemeColors, ThemeColors, Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { PaywallModal } from '../components/PaywallModal';
import { BillingService } from '../services/BillingService';
import { runSelfDiagnostics } from '../services/DiagnosticService';
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
} from 'lucide-react-native';

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
  const [showPaywall, setShowPaywall] = useState(false);

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
      Alert.alert('Camera Access', 'Please allow camera access to take a shop logo photo.');
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
    const presented = await BillingService.presentRevenueCatPaywall();
    if (!presented) {
      setShowPaywall(true);
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
      defaultTaxBasisPoints: taxBasisPoints,
      taxEnabledByDefault,
      taxLabel: taxLabel.trim() || 'Sales Tax',
      zelleAccount: zelle.trim() || undefined,
      venmoAccount: venmo.trim() || undefined,
      cashAppAccount: cashApp.trim() || undefined,
      hasCustomBusinessName: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Settings saved', 'Your business profile, shop logo, and invoice settings have been updated.');
  };

  const handleCreatePreset = () => {
    const priceCents = Math.round((parseFloat(newPresetPrice) || 0) * 100);
    if (!newPresetTitle.trim() || priceCents <= 0) {
      Alert.alert('Invalid Preset', 'Please enter a valid title and dollar price.');
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
      Alert.alert('Database Backup', 'All local estimates and signatures are securely preserved in offline SQLite.');
    }
  };

  const handleRunDiagnostics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const diag = await runSelfDiagnostics();
    if (diag.passed) {
      Alert.alert('System Integrity OK', diag.results.join('\n'));
    } else {
      Alert.alert('Diagnostic Alert', diag.results.join('\n'));
    }
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

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── Pro Plan Card ─────────────────────────────────────────────────── */}
        <View style={styles.proCard}>
          <View style={styles.proRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.proTitleRow}>
                <Star size={16} color={colors.amber} fill={colors.amber} />
                <Text style={styles.proTitle}>
                  {isPro ? 'Pro Member — Unlimited Estimates' : 'JobSign Pro — Early-Bird Pricing'}
                </Text>
              </View>
              <Text style={styles.proSub}>
                {isPro
                  ? 'Unlimited signed estimates, custom branding & courtroom audit seals.'
                  : [
                      '• Annual: $29.99 / year (save 37% vs monthly)',
                      '• Monthly: $3.99 / month',
                      '• Lifetime: $49.99 one-time',
                    ].join('\n')}
              </Text>
            </View>
          </View>

          {!isPro ? (
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
              placeholder="$ Price"
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
                <Text style={styles.presetPriceText}>${(p.priceCents / 100).toFixed(0)}</Text>
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
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
};
