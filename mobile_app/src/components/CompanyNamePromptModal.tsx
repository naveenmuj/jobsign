import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Building2, X } from 'lucide-react-native';
import { Theme, getThemeColors } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';

interface CompanyNamePromptModalProps {
  visible: boolean;
  initialName?: string;
  initialAddress?: string;
  onSave: (businessName: string, address: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export const CompanyNamePromptModal: React.FC<CompanyNamePromptModalProps> = ({
  visible,
  initialName = '',
  initialAddress = '',
  onSave,
  onSkip,
  onClose,
}) => {
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);

  const [businessName, setBusinessName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(businessName.trim(), address.trim());
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.titleRow}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                    <Building2 size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.title, { color: colors.textPrimary }]}>
                    Add Business Name
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Adding your shop name and address makes your invoice look official to clients. You can also skip this for now.
              </Text>

              {/* Input: Business Name */}
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                SHOP / BUSINESS NAME
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="e.g. Miller Plumbing & Heating"
                placeholderTextColor={colors.textMuted}
                value={businessName}
                onChangeText={setBusinessName}
                autoFocus
              />

              {/* Input: Business Address */}
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 12 }]}>
                SHOP ADDRESS (OPTIONAL)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="e.g. 1204 Industrial Blvd, Austin, TX"
                placeholderTextColor={colors.textMuted}
                value={address}
                onChangeText={setAddress}
              />

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.skipButton, { borderColor: colors.border }]}
                  onPress={handleSkip}
                >
                  <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                    Skip for Now
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: businessName.trim() ? colors.primary : colors.emerald,
                    },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {businessName.trim() ? 'Save & Generate' : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1.5,
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
