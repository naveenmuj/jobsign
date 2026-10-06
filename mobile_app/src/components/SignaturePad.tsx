import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';

interface SignaturePadProps {
  onSave: (svgPath: string) => void;
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
  const [paths, setPaths] = useState<string[]>([]);
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

  const handleConfirm = () => {
    if (paths.length === 0) return;
    const combinedSvgPath = paths.join(' ');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(combinedSvgPath);
  };

  return (
    <View style={styles.container}>
      {/* Top Affirmative Legal Consent Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>✍️ IN-PERSON CLIENT APPROVAL</Text>
        <Text style={styles.bannerLegal}>
          I, <Text style={styles.bold}>{clientName}</Text>, hereby authorize the contractor to proceed with the work for{' '}
          <Text style={styles.boldGreen}>{totalFormatted}</Text> and agree to pay upon completion.
        </Text>
      </View>

      {/* Touch Canvas */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke={Theme.colors.primary}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
        {paths.length === 0 && (
          <View style={styles.placeholderBox} pointerEvents="none">
            <Text style={styles.placeholderText}>Sign with your finger on screen</Text>
          </View>
        )}
      </View>

      {/* Action Footer */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, paths.length === 0 && styles.disabledBtn]}
          onPress={handleConfirm}
          disabled={paths.length === 0}
        >
          <Text style={styles.confirmText}>🔒 LOCK & APPROVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
    justifyContent: 'space-between',
  },
  banner: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bannerTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerLegal: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  boldGreen: {
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginVertical: 12,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
  },
  placeholderBox: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    minHeight: Theme.touchTarget.minHeight,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  cancelText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  clearText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  disabledBtn: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
