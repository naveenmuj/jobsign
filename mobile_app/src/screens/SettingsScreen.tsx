import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { getThemeColors, ThemeColors, Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';
import { PaywallModal } from '../components/PaywallModal';
import { runSelfDiagnostics } from '../services/DiagnosticService';
import {
  ChevronLeft,
  Star,
  Zap,
  Shield,
  Download,
  Trash2,
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
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [license, setLicense] = useState(profile.licenseNumber || '');
  const [defaultTaxRate, setDefaultTaxRate] = useState(
    ((profile.defaultTaxBasisPoints ?? 825) / 100).toFixed(2)
  );
  const [zelle, setZelle] = useState(profile.zelleAccount || '');
  const [venmo, setVenmo] = useState(profile.venmoAccount || '');
  const [cashApp, setCashApp] = useState(profile.cashAppAccount || '');
  const [showPaywall, setShowPaywall] = useState(false);

  // Custom preset modal state
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');

  const handleSaveProfile = () => {
    const taxBasisPoints = Math.round((parseFloat(defaultTaxRate) || 8.25) * 100);
    updateProfile({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      licenseNumber: license.trim() || undefined,
      defaultTaxBasisPoints: taxBasisPoints,
      zelleAccount: zelle.trim() || undefined,
      venmoAccount: venmo.trim() || undefined,
      cashAppAccount: cashApp.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Settings saved', 'Your business profile and payment accounts have been updated.');
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
                setShowPaywall(true);
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
                setShowPaywall(true);
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
          <Text style={styles.cardLabel}>Business Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name (e.g. Apex Electric LLC)"
            placeholderTextColor={colors.textMuted}
            value={businessName}
            onChangeText={setBusinessName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Owner / Master Licensee Name"
            placeholderTextColor={colors.textMuted}
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Phone Number for Clients"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="License / Registration # (optional)"
            placeholderTextColor={colors.textMuted}
            value={license}
            onChangeText={setLicense}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Default Sales Tax Rate (%) (e.g. 8.25)"
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
