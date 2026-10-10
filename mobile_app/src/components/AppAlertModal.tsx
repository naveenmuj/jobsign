import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react-native';
import { AlertService, AlertConfig } from '../services/AlertService';
import { Theme, getThemeColors } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';

export const AppAlertModal: React.FC = () => {
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    const unsubscribe = AlertService.subscribe((newConfig) => {
      setConfig(newConfig);
    });
    return unsubscribe;
  }, []);

  if (!config) return null;

  const handleButtonPress = (onPress?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    AlertService.dismiss();
    if (onPress) {
      try {
        onPress();
      } catch (err) {
        console.warn('[AppAlertModal] Error running alert callback:', err);
      }
    }
  };

  const renderIcon = () => {
    switch (config.type) {
      case 'SUCCESS':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <CheckCircle2 size={28} color={colors.emerald} strokeWidth={2.5} />
          </View>
        );
      case 'WARNING':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
            <AlertTriangle size={28} color={colors.amber} strokeWidth={2.5} />
          </View>
        );
      case 'DANGER':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.14)' }]}>
            <AlertCircle size={28} color={colors.rose} strokeWidth={2.5} />
          </View>
        );
      case 'INFO':
      default:
        return (
          <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Sparkles size={28} color={colors.primary} strokeWidth={2.5} />
          </View>
        );
    }
  };

  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{ text: 'OK', style: 'default' as const }];

  const isMultiple = buttons.length > 1;

  return (
    <Modal visible={!!config} transparent animationType="fade" onRequestClose={() => AlertService.dismiss()}>
      <TouchableWithoutFeedback onPress={() => AlertService.dismiss()}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Icon Badge */}
              <View style={styles.iconContainer}>{renderIcon()}</View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{config.title}</Text>

              {/* Message */}
              {config.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  {config.message}
                </Text>
              ) : null}

              {/* Buttons Row / Col */}
              <View style={[styles.buttonsContainer, isMultiple && styles.multipleButtons]}>
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  let btnBg = colors.primary;
                  let textColor = '#FFFFFF';
                  let borderWidth = 0;
                  let borderColor = 'transparent';

                  if (isCancel) {
                    btnBg = colors.backgroundSecondary;
                    textColor = colors.textSecondary;
                    borderWidth = 1;
                    borderColor = colors.border;
                  } else if (isDestructive) {
                    btnBg = colors.rose;
                    textColor = '#FFFFFF';
                  } else if (config.type === 'SUCCESS') {
                    btnBg = colors.emerald;
                  }

                  return (
                    <TouchableOpacity
                      key={`alert-btn-${index}`}
                      style={[
                        styles.button,
                        isMultiple && styles.flexButton,
                        {
                          backgroundColor: btnBg,
                          borderWidth,
                          borderColor,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleButtonPress(btn.onPress)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color: textColor,
                            fontWeight: isCancel ? '700' : '800',
                          },
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 14,
  },
  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  message: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  multipleButtons: {
    flexDirection: 'row',
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
