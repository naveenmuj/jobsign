import React, { useRef, useState, useMemo } from 'react';
import { View, PanResponder, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';

interface SignaturePadProps {
  onSave: (svgPath: string) => Promise<void> | void;
  onCancel: () => void;
  clientName: string;
  totalFormatted: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  clientName,
  totalFormatted,
}) => {
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [paths, setPaths] = useState<string[]>([]);
  const [hasConsented, setHasConsented] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const currentPath = useRef<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setPaths((prev) => [...prev.slice(0, -1), currentPath.current]);
      },
      onPanResponderRelease: () => {
        if (currentPath.current) {
          setPaths((prev) => [...prev, currentPath.current]);
          currentPath.current = '';
        }
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    currentPath.current = '';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirm = async () => {
    if (paths.length === 0 || !hasConsented || isSaving) return;
    setIsSaving(true);
    try {
      const combinedSvgPath = paths.join(' ');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onSave(combinedSvgPath);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = paths.length > 0 && hasConsented && !isSaving;

  return (
    <View style={styles.container}>
      {/* Top Affirmative Legal Consent Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Client Approval</Text>
        <Text style={styles.bannerLegal}>
          I, <Text style={styles.bold}>{clientName}</Text>, hereby authorize the contractor to proceed with the indicated scope for{' '}
          <Text style={styles.boldGreen}>{totalFormatted}</Text> and agree that payment is due upon completion.
        </Text>
      </View>

      {/* Touch Canvas */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke={colors.primary}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
        {paths.length === 0 && (
          <View style={styles.placeholderBox} pointerEvents="none">
            <Text style={styles.placeholderText}>Sign with finger or stylus</Text>
          </View>
        )}
      </View>

      {/* Explicit ESIGN Act Affirmative Consent Checkbox */}
      <TouchableOpacity
        style={styles.consentCheckboxRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setHasConsented(!hasConsented);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, hasConsented && styles.checkboxActive]}>
          {hasConsented && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text style={styles.consentText}>
          I affirmatively consent to execute this agreement electronically under 15 U.S. Code § 7001 (ESIGN Act) & UETA.
        </Text>
      </TouchableOpacity>

      {/* Action Footer */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClear}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, !canSave && styles.disabledBtn]}
          onPress={handleConfirm}
          disabled={!canSave}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Confirm Agreement</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
      paddingTop: 48,
      justifyContent: 'space-between',
    },
    banner: {
      backgroundColor: colors.card,
      borderRadius: Theme.borderRadius.md,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    bannerTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.3,
    },
    bannerLegal: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
      lineHeight: 18,
    },
    bold: {
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    boldGreen: {
      fontWeight: 'bold',
      color: colors.emerald,
    },
    canvasContainer: {
      flex: 1,
      marginVertical: 14,
      backgroundColor: colors.canvasBg,
      borderRadius: Theme.borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.canvasBorder,
      overflow: 'hidden',
      position: 'relative',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    placeholderBox: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: colors.textMuted,
      fontSize: 15,
      fontStyle: 'italic',
    },
    consentCheckboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: Theme.borderRadius.sm,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    checkboxActive: {
      backgroundColor: colors.emerald,
      borderColor: colors.emerald,
    },
    checkIcon: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: 'bold',
    },
    consentText: {
      flex: 1,
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 15,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    cancelBtn: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: Theme.touchTarget.minHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    clearBtn: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: Theme.touchTarget.minHeight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearText: {
      color: colors.amber,
      fontSize: 14,
      fontWeight: 'bold',
    },
    confirmBtn: {
      flex: 1,
      backgroundColor: colors.emerald,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    disabledBtn: {
      backgroundColor: colors.backgroundSecondary,
      shadowOpacity: 0,
      elevation: 0,
    },
    confirmText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
