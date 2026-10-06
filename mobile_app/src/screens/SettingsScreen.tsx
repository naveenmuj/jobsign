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
import { Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { PDFService } from '../services/PDFService';

export const SettingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const {
    profile,
    updateProfile,
    isPro,
    setProStatus,
    presets,
    addPreset,
    removePreset,
    isSunlightMode,
    toggleSunlightMode,
  } = useQuoteStore();

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [license, setLicense] = useState(profile.licenseNumber || '');
  const [zelle, setZelle] = useState(profile.zelleAccount || '');
  const [venmo, setVenmo] = useState(profile.venmoAccount || '');
  const [cashApp, setCashApp] = useState(profile.cashAppAccount || '');

  // Custom preset modal state
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetPrice, setNewPresetPrice] = useState('');

  const handleSaveProfile = () => {
    updateProfile({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      licenseNumber: license.trim() || undefined,
      zelleAccount: zelle.trim() || undefined,
      venmoAccount: venmo.trim() || undefined,
      cashAppAccount: cashApp.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Settings Saved! 🛠️', 'Your business header and payment accounts are updated.');
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.backText}>⬅ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business & App Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pro Plan Card */}
        <View style={styles.proCard}>
          <View style={styles.proRow}>
            <View>
              <Text style={styles.proTitle}>{isPro ? '⭐️ JobSign PRO Active' : 'FREE TIER (3 Quotes/Mo)'}</Text>
              <Text style={styles.proSub}>
                {isPro
                  ? 'Unlimited signed estimates, custom branding & court audit seals.'
                  : 'Upgrade for unlimited signed estimates ($44.99/yr or $79.99 lifetime).'}
              </Text>
            </View>
          </View>
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.proToggleBtn, isPro && styles.proToggleBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setProStatus(!isPro);
              }}
            >
              <Text style={styles.proToggleText}>{isPro ? '✔ ACTIVE PRO' : '⚡ [DEV] TOGGLE PRO'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sunlight High Contrast Mode Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FIELD ENVIRONMENT</Text>
          <View style={styles.sunlightRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sunlightTitle}>☀️ Sunlight High-Contrast Mode</Text>
              <Text style={styles.sunlightSub}>
                Maximizes outdoor screen legibility and contrast for direct sunlight.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.sunlightBtn, isSunlightMode && styles.sunlightBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleSunlightMode();
              }}
            >
              <Text style={[styles.sunlightBtnText, isSunlightMode && styles.sunlightBtnTextActive]}>
                {isSunlightMode ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Branding Profile */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CONTRACTOR BUSINESS PROFILE</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name (e.g. Apex Electric LLC)"
            placeholderTextColor={Theme.colors.textMuted}
            value={businessName}
            onChangeText={setBusinessName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Owner / Master Licensee Name"
            placeholderTextColor={Theme.colors.textMuted}
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Phone Number for Clients"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="License / Registration # (optional)"
            placeholderTextColor={Theme.colors.textMuted}
            value={license}
            onChangeText={setLicense}
          />
        </View>

        {/* Direct Payment P2P Accounts */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DIRECT SETTLEMENT ACCOUNTS (0% FEE)</Text>
          <Text style={styles.cardHint}>Used to generate on-screen QR codes for instant homeowner payment.</Text>
          <TextInput
            style={styles.input}
            placeholder="Zelle Phone or Email"
            placeholderTextColor={Theme.colors.textMuted}
            value={zelle}
            onChangeText={setZelle}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Venmo Username (e.g. @ApexElectric)"
            placeholderTextColor={Theme.colors.textMuted}
            value={venmo}
            onChangeText={setVenmo}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Cash App Cashtag (e.g. $ApexElectric)"
            placeholderTextColor={Theme.colors.textMuted}
            value={cashApp}
            onChangeText={setCashApp}
          />
        </View>

        {/* Custom 1-Tap Item Presets */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>MANAGE 1-TAP ITEM PRESETS ({presets.length})</Text>
          <View style={styles.newPresetRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Item Name (e.g. Capacitor)"
              placeholderTextColor={Theme.colors.textMuted}
              value={newPresetTitle}
              onChangeText={setNewPresetTitle}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="$ Price"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="decimal-pad"
              value={newPresetPrice}
              onChangeText={setNewPresetPrice}
            />
            <TouchableOpacity style={styles.addPresetBtn} onPress={handleCreatePreset}>
              <Text style={styles.addPresetBtnText}>➕</Text>
            </TouchableOpacity>
          </View>

          {presets.map((p) => (
            <View key={p.id} style={styles.presetItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.presetTitleText}>{p.title}</Text>
                <Text style={styles.presetPriceText}>${(p.priceCents / 100).toFixed(0)}</Text>
              </View>
              <TouchableOpacity onPress={() => removePreset(p.id)} style={styles.deletePresetBtn}>
                <Text style={styles.deletePresetText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Database Backup & Disaster Recovery */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>LOCAL STORAGE & BACKUP VAULT</Text>
          <Text style={styles.cardHint}>
            JobSign runs 100% offline. Export an encrypted archive of your SQLite quotes and signatures anytime.
          </Text>
          <TouchableOpacity style={styles.backupBtn} onPress={handleExportBackup}>
            <Text style={styles.backupBtnText}>💾 Export Full SQLite Database Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveBtnText}>💾 SAVE SETTINGS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    padding: 6,
  },
  backText: {
    color: Theme.colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  proCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: Theme.colors.amber,
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
    color: '#FBBF24',
  },
  proSub: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4,
    lineHeight: 16,
  },
  proToggleBtn: {
    marginTop: 12,
    backgroundColor: Theme.colors.amber,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  proToggleBtnActive: {
    backgroundColor: Theme.colors.emerald,
  },
  proToggleText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  cardHint: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Theme.borderRadius.sm,
    padding: 12,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  newPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addPresetBtn: {
    backgroundColor: Theme.colors.primary,
    width: 48,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPresetBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  presetItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  presetPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginTop: 2,
  },
  deletePresetBtn: {
    padding: 6,
  },
  deletePresetText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backupBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  backupBtnText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: Theme.colors.emerald,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...Theme.shadows.glowSuccess,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sunlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sunlightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.textPrimary,
  },
  sunlightSub: {
    fontSize: 11.5,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sunlightBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#475569',
  },
  sunlightBtnActive: {
    backgroundColor: Theme.colors.amber,
    borderColor: '#F59E0B',
  },
  sunlightBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sunlightBtnTextActive: {
    color: '#0F172A',
    fontWeight: '900',
  },
});
