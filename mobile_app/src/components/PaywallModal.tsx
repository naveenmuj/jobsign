import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PurchasesPackage } from 'react-native-purchases';
import { Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { BillingService } from '../services/BillingService';
import { BILLING_CONFIG } from '../config/billing';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const { setProStatus } = useQuoteStore();
  const [selectedTier, setSelectedTier] = useState<'ANNUAL' | 'MONTHLY' | 'LIFETIME'>('ANNUAL');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [livePackages, setLivePackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    const pkgs = await BillingService.fetchOfferings();
    setLivePackages(pkgs);
  };

  const getPackageForTier = (tier: 'ANNUAL' | 'MONTHLY' | 'LIFETIME'): PurchasesPackage | undefined => {
    return livePackages.find((p) => {
      if (tier === 'ANNUAL') return p.packageType === 'ANNUAL' || p.identifier.includes('annual');
      if (tier === 'MONTHLY') return p.packageType === 'MONTHLY' || p.identifier.includes('monthly');
      return p.packageType === 'LIFETIME' || p.identifier.includes('lifetime');
    });
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const targetPkg = getPackageForTier(selectedTier) || livePackages[0];

      if (targetPkg) {
        const result = await BillingService.purchasePro(targetPkg);
        if (result.success) {
          setProStatus(true);
          Alert.alert('Welcome to JobSign Pro! ⭐️', 'You now have unlimited estimates, custom branding, and courtroom legal audit seals.');
          onClose();
        } else if (!result.userCancelled && result.errorMessage) {
          Alert.alert('Purchase Note', result.errorMessage);
        }
      } else {
        // Fallback for development / mock test sandbox
        setProStatus(true);
        Alert.alert(
          'JobSign Pro Activated! ⭐️',
          `Sandbox Mock Purchase for ${selectedTier} plan was successful.\n(Live Google Play billing will be active once Play Console credentials are linked).`
        );
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Purchase Error', e?.message || 'Could not complete in-app purchase.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await BillingService.restorePurchases();
      if (result.isPro) {
        setProStatus(true);
        Alert.alert('Subscription Restored! ⭐️', 'Your active JobSign Pro subscription has been verified on this device.');
        onClose();
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active Pro subscription was found for this Google Play / Apple ID account.'
        );
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message || 'Could not restore purchases.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!visible) return null;

  const annualPkg = getPackageForTier('ANNUAL');
  const monthlyPkg = getPackageForTier('MONTHLY');
  const lifetimePkg = getPackageForTier('LIFETIME');

  const annualPrice = annualPkg?.product.priceString || BILLING_CONFIG.TIERS.ANNUAL.introPrice;
  const monthlyPrice = monthlyPkg?.product.priceString || BILLING_CONFIG.TIERS.MONTHLY.introPrice;
  const lifetimePrice = lifetimePkg?.product.priceString || BILLING_CONFIG.TIERS.LIFETIME.introPrice;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.earlyBirdTag}>
                <Text style={styles.earlyBirdTagText}>⚡ EARLY-BIRD LAUNCH PRICING</Text>
              </View>
              <Text style={styles.title}>Unlock JobSign Pro</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Promo Banner */}
            <View style={styles.bannerBox}>
              <Text style={styles.bannerTitle}>🛡️ Stop Unpaid Scope Creep & Disputes</Text>
              <Text style={styles.bannerSubtitle}>
                Lock in discounted founder pricing before rates return to standard $7.99/mo.
              </Text>
            </View>

            {/* Feature List */}
            <View style={styles.featuresBox}>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureTextBold}>Unlimited Signed Estimates</Text> (Never capped at 3/mo)
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureTextBold}>Courtroom SHA-256 Audit Seals</Text> with GPS timestamps
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureTextBold}>Mid-Job Change Orders</Text> signed right on-site
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureTextBold}>Automatic Mechanic's Lien Waivers</Text> upon settlement
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkIcon}>✔</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureTextBold}>Custom Business Header & Logo</Text> on clean PDFs
                </Text>
              </View>
            </View>

            {/* Pricing Tiers */}
            {/* Tier 1: Annual (Best Value) */}
            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'ANNUAL' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('ANNUAL')}
              activeOpacity={0.85}
            >
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>{BILLING_CONFIG.TIERS.ANNUAL.badge}</Text>
              </View>
              <View style={styles.tierRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierTitle}>{BILLING_CONFIG.TIERS.ANNUAL.title}</Text>
                  <Text style={styles.tierSub}>
                    {BILLING_CONFIG.TIERS.ANNUAL.subTitle}
                  </Text>
                  <Text style={styles.strikethroughText}>
                    Standard: {BILLING_CONFIG.TIERS.ANNUAL.regularPrice}/yr
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tierPrice}>
                    {annualPrice} <Text style={styles.tierPeriod}>/ yr</Text>
                  </Text>
                  <Text style={styles.savingsTag}>Save 65%</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Tier 2: Lifetime (Founder Pass) */}
            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'LIFETIME' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('LIFETIME')}
              activeOpacity={0.85}
            >
              <View style={[styles.tierBadge, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.tierBadgeText}>{BILLING_CONFIG.TIERS.LIFETIME.badge}</Text>
              </View>
              <View style={styles.tierRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierTitle}>{BILLING_CONFIG.TIERS.LIFETIME.title}</Text>
                  <Text style={styles.tierSub}>
                    {BILLING_CONFIG.TIERS.LIFETIME.subTitle}
                  </Text>
                  <Text style={styles.strikethroughText}>
                    Standard: {BILLING_CONFIG.TIERS.LIFETIME.regularPrice}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tierPrice}>
                    {lifetimePrice} <Text style={styles.tierPeriod}>once</Text>
                  </Text>
                  <Text style={[styles.savingsTag, { color: '#C084FC' }]}>No Subscriptions</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Tier 3: Monthly (Flexible) */}
            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'MONTHLY' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('MONTHLY')}
              activeOpacity={0.85}
            >
              <View style={[styles.tierBadge, { backgroundColor: '#0284C7' }]}>
                <Text style={styles.tierBadgeText}>{BILLING_CONFIG.TIERS.MONTHLY.badge}</Text>
              </View>
              <View style={styles.tierRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierTitle}>{BILLING_CONFIG.TIERS.MONTHLY.title}</Text>
                  <Text style={styles.tierSub}>
                    {BILLING_CONFIG.TIERS.MONTHLY.subTitle}
                  </Text>
                  <Text style={styles.strikethroughText}>
                    Standard: {BILLING_CONFIG.TIERS.MONTHLY.regularPrice}/mo
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tierPrice}>
                    {monthlyPrice} <Text style={styles.tierPeriod}>/ mo</Text>
                  </Text>
                  <Text style={[styles.savingsTag, { color: '#38BDF8' }]}>Cancel anytime</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Cancel anytime directly in your Google Play Store or Apple Subscriptions. 14-day money-back guarantee.
            </Text>
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, (isSubscribing || isRestoring) && { opacity: 0.7 }]}
            onPress={handleSubscribe}
            disabled={isSubscribing || isRestoring}
          >
            {isSubscribing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>
                ⭐️ UPGRADE NOW • {selectedTier === 'ANNUAL' ? annualPrice + ' / YR' : selectedTier === 'LIFETIME' ? lifetimePrice + ' ONCE' : monthlyPrice + ' / MO'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isSubscribing || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#94A3B8" />
            ) : (
              <Text style={styles.restoreText}>Restore Existing Purchases</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    padding: 22,
    paddingBottom: 36,
    maxHeight: '92%',
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  earlyBirdTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  earlyBirdTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    marginTop: 4,
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
  bannerBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  featuresBox: {
    backgroundColor: '#0F172A',
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    color: Theme.colors.emerald,
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
  },
  featureTextBold: {
    fontWeight: '700',
    color: '#FFFFFF',
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
  strikethroughText: {
    fontSize: 11,
    color: '#64748B',
    textDecorationLine: 'line-through',
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
  savingsTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.emerald,
    marginTop: 2,
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
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  restoreText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
