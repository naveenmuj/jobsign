import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const { setProStatus } = useQuoteStore();
  const [selectedTier, setSelectedTier] = useState<'ANNUAL' | 'MONTHLY' | 'LIFETIME'>('ANNUAL');

  const handleSubscribe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProStatus(true);
    Alert.alert(
      'Welcome to JobSign Pro! ⭐️',
      'You now have unlimited signed estimates, custom business branding, and priority legal seals.'
    );
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badge}>UNLIMITED WORK PROTECTION</Text>
              <Text style={styles.title}>Unlock JobSign Pro</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* Feature List */}
            <View style={styles.featuresBox}>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}><strong>Unlimited Signed Estimates</strong> (No monthly limits)</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}><strong>Courtroom SHA-256 Audit Seals</strong> on every PDF</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}><strong>Mid-Job Change Orders</strong> to stop unpaid scope creep</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}><strong>Automatic Conditional Lien Waivers</strong></Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}><strong>Custom Contractor Branding & Logo</strong> (No watermarks)</Text>
              </View>
            </View>

            {/* Pricing Tiers */}
            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'ANNUAL' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('ANNUAL')}
            >
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>MOST POPULAR • SAVE 50%</Text>
              </View>
              <View style={styles.tierRow}>
                <div>
                  <Text style={styles.tierTitle}>Annual Protection</Text>
                  <Text style={styles.tierSub}>Just $3.75 / month</Text>
                </div>
                <Text style={styles.tierPrice}>$44.99 <span style={styles.tierPeriod}>/ yr</span></Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'LIFETIME' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('LIFETIME')}
            >
              <View style={[styles.tierBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.tierBadgeText}>ONE-TIME • NEVER PAY AGAIN</Text>
              </View>
              <View style={styles.tierRow}>
                <div>
                  <Text style={styles.tierTitle}>Lifetime Access</Text>
                  <Text style={styles.tierSub}>Zero recurring subscriptions</Text>
                </div>
                <Text style={styles.tierPrice}>$79.99 <span style={styles.tierPeriod}>once</span></Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'MONTHLY' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('MONTHLY')}
            >
              <View style={styles.tierRow}>
                <div>
                  <Text style={styles.tierTitle}>Monthly Flexible</Text>
                  <Text style={styles.tierSub}>Cancel anytime</Text>
                </div>
                <Text style={styles.tierPrice}>$6.99 <span style={styles.tierPeriod}>/ mo</span></Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Cancel anytime in Google Play Store settings. 14-day money-back guarantee.
            </Text>
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity style={styles.ctaBtn} onPress={handleSubscribe}>
            <Text style={styles.ctaText}>⭐️ UPGRADE & UNLOCK NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    padding: 24,
    paddingBottom: 38,
    maxHeight: '90%',
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textMuted,
  },
  content: {
    paddingBottom: 16,
  },
  featuresBox: {
    backgroundColor: '#0F172A',
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    color: Theme.colors.emerald,
    fontSize: 15,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 13,
    color: '#E2E8F0',
    flex: 1,
  },
  tierCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: Theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
  },
  tierCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  tierBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  tierSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  tierPeriod: {
    fontSize: 12,
    fontWeight: 'normal',
    color: Theme.colors.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },
  ctaBtn: {
    backgroundColor: Theme.colors.primary,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Theme.shadows.glowPrimary,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
