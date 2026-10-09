import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Building2, Camera, Image as ImageIcon, CheckCircle, Sparkles, X, CloudDownload } from 'lucide-react-native';
import { Theme, getThemeColors } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { AlertService } from '../services/AlertService';
import { BackupService } from '../services/BackupService';
import { useAppSafeArea } from '../utils/safeArea';
import { useKeyboard } from '../utils/useKeyboard';

interface OnboardingModalProps {
  visible: boolean;
  onFinish: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onFinish }) => {
  const { profile, updateProfile, isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const insets = useAppSafeArea();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  const [businessName, setBusinessName] = useState(
    profile.hasCustomBusinessName ? profile.businessName : ''
  );
  const [address, setAddress] = useState(profile.address || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [logoUri, setLogoUri] = useState<string | null>(profile.logoUri || null);

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

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalName = businessName.trim() || 'My Contracting Co.';
    updateProfile({
      businessName: finalName,
      address: address.trim(),
      phone: phone.trim() || profile.phone,
      logoUri: logoUri || undefined,
      isOnboardingCompleted: true,
      hasCustomBusinessName: !!businessName.trim(),
    });
    onFinish();
  };

  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreFromBackup = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await BackupService.pickAndInspectBackupFile();
      if (res.cancelled) {
        setIsRestoring(false);
        return;
      }
      const preview = res.preview;
      AlertService.confirm({
        title: 'Restore Backup? 🔄',
        message: `Found JobSign backup for "${preview.businessName}" (${new Date(preview.exportedAt).toLocaleDateString()}) containing ${preview.invoiceCount} quotes/invoices and ${preview.presetCount} presets.\n\nRestore all data now?`,
        confirmText: 'Restore All Data',
        cancelText: 'Cancel',
        isDestructive: false,
        onConfirm: async () => {
          try {
            const restored = await BackupService.restoreFromPayload(preview.payload, 'REPLACE');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            AlertService.alert({
              title: 'Data Restored Successfully 🎉',
              message: `Restored ${restored.restoredQuotes} invoice(s) and profile for "${preview.businessName}".`,
              type: 'SUCCESS',
            });
            onFinish();
          } catch (e: any) {
            AlertService.alert({
              title: 'Restore Failed',
              message: e?.message || 'Could not restore backup file.',
              type: 'DANGER',
            });
          }
        },
      });
    } catch (err: any) {
      AlertService.alert({
        title: 'Invalid Backup File',
        message: err?.message || 'Failed to read backup file.',
        type: 'WARNING',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({
      isOnboardingCompleted: true,
    });
    onFinish();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <View style={[styles.overlay, { paddingBottom: isKeyboardVisible ? keyboardHeight : 0 }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxHeight: isKeyboardVisible ? '100%' : '92%',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.topBar}>
            <View style={styles.badgeRow}>
              <View style={[styles.badgePill, { backgroundColor: colors.primaryLight }]}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>Quick Setup</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.skipHeaderText, { color: colors.textMuted }]}>Skip</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flexShrink: 1 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.scroll, { paddingBottom: isKeyboardVisible ? 40 : 24 }]}
          >
            <Text style={[styles.mainHeading, { color: colors.textPrimary }]}>
              Customize Your Invoice
            </Text>
            <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
              Enter your shop branding so your estimates and PDF invoices look clean and professional for clients.
            </Text>

            {/* Shop Logo Picker */}
            <View style={[styles.logoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              {logoUri ? (
                <View style={styles.logoPreviewRow}>
                  <Image source={{ uri: logoUri }} style={styles.logoImg} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.logoLabel, { color: colors.textPrimary }]}>Shop Logo Attached</Text>
                    <TouchableOpacity onPress={() => setLogoUri(null)}>
                      <Text style={{ color: colors.rose, fontSize: 12, fontWeight: '700' }}>Remove Logo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={[styles.logoLabel, { color: colors.textPrimary }]}>Shop Logo (Optional)</Text>
                  <Text style={[styles.logoHint, { color: colors.textMuted }]}>Appears at the top of all PDF invoices</Text>
                  <View style={styles.logoBtnRow}>
                    <TouchableOpacity
                      style={[styles.logoPickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={handlePickLogo}
                    >
                      <ImageIcon size={16} color={colors.primary} />
                      <Text style={[styles.logoPickerBtnText, { color: colors.textPrimary }]}>Upload Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.logoPickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={handleCaptureLogo}
                    >
                      <Camera size={16} color={colors.textSecondary} />
                      <Text style={[styles.logoPickerBtnText, { color: colors.textPrimary }]}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Business / Shop Name */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>SHOP / COMPANY NAME</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.textPrimary },
              ]}
              placeholder="e.g. Apex Electricals & Services"
              placeholderTextColor={colors.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
            />

            {/* Shop Address */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>SHOP ADDRESS / CITY</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.textPrimary },
              ]}
              placeholder="e.g. Shop #4, Main Market, Indiranagar or 100 Main St"
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            {/* Contact Phone */}
            <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>PHONE NUMBER</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.textPrimary },
              ]}
              placeholder="e.g. 98450 12345 or (555) 234-5678"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.perkList}>
              <View style={styles.perkItem}>
                <CheckCircle size={15} color={colors.emerald} />
                <Text style={[styles.perkText, { color: colors.textSecondary }]}>
                  Instantly formatted on every PDF quote & invoice
                </Text>
              </View>
              <View style={styles.perkItem}>
                <CheckCircle size={15} color={colors.emerald} />
                <Text style={[styles.perkText, { color: colors.textSecondary }]}>
                  Can be edited anytime in Settings
                </Text>
              </View>
            </View>

            {/* Restore from Backup Option */}
            <TouchableOpacity
              style={[
                styles.restoreCallout,
                {
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.primary + '35',
                },
              ]}
              onPress={handleRestoreFromBackup}
              disabled={isRestoring}
            >
              <CloudDownload size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.restoreCalloutTitle, { color: colors.primary }]}>
                  Already have a backup?
                </Text>
                <Text style={[styles.restoreCalloutSub, { color: colors.textSecondary }]}>
                  Restore from Google Drive, OneDrive, or local file
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom Actions */}
          <View
            style={[
              styles.footerBar,
              {
                borderTopColor: colors.border,
                paddingBottom: isKeyboardVisible ? 12 : 16 + insets.bottom,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: colors.border }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipBtnText, { color: colors.textSecondary }]}>Skip for Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save & Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '92%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    padding: 6,
  },
  skipHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 6,
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  logoCard: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    marginBottom: 16,
  },
  logoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  logoLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  logoHint: {
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 10,
  },
  logoBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logoPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
  },
  logoPickerBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  perkList: {
    marginTop: 18,
    gap: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  restoreCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    marginTop: 18,
  },
  restoreCalloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  restoreCalloutSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  footerBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
