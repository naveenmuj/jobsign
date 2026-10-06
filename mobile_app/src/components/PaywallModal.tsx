import React, { useState, useEffect, useMemo } from 'react';
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
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { BillingService } from '../services/BillingService';
import { BILLING_CONFIG } from '../config/billing';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const { setProStatus, isDarkMode } = useQuoteStore();
  const colors = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
          Alert.alert('Welcome to JobSign Pro', 'You now have unlimited estimates, custom branding, and digital audit seals.');
          onClose();
        } else if (!result.userCancelled && result.errorMessage) {
          Alert.alert('Purchase Note', result.errorMessage);
        }
      } else {
        // Fallback for development / mock test sandbox
        setProStatus(true);
        Alert.alert(
          'JobSign Pro Activated',
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
        Alert.alert('Subscription Restored', 'Your active JobSign Pro subscription has been verified on this device.');
        onClose();
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active Pro subscription was found for this account.'
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
                <Text style={styles.earlyBirdTagText}>EARLY-BIRD LAUNCH PRICING</Text>
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
              <Text style={styles.bannerTitle}>Eliminate Unpaid Scope Creep & Disputes</Text>
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
                  <Text style={styles.featureTextBold}>Custom Business Profile & Logo</Text> on clean PDFs
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
              <View style={[styles.tierBadge, { backgroundColor: colors.purple }]}>
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
                  <Text style={[styles.savingsTag, { color: colors.purple }]}>No Subscription</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Tier 3: Monthly (Flexible) */}
            <TouchableOpacity
              style={[styles.tierCard, selectedTier === 'MONTHLY' && styles.tierCardSelected]}
              onPress={() => setSelectedTier('MONTHLY')}
              activeOpacity={0.85}
            >
              <View style={[styles.tierBadge, { backgroundColor: colors.slateInfo }]}>
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
                  <Text style={[styles.savingsTag, { color: colors.primary }]}>Cancel anytime</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Cancel anytime in your Google Play Store or Apple ID Subscriptions. 14-day money-back guarantee.
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
                Upgrade Now • {selectedTier === 'ANNUAL' ? annualPrice + ' / yr' : selectedTier === 'LIFETIME' ? lifetimePrice + ' once' : monthlyPrice + ' / mo'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isSubscribing || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <Text style={styles.restoreText}>Restore Existing Purchases</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Theme.borderRadius.xl,
      borderTopRightRadius: Theme.borderRadius.xl,
      padding: 22,
      paddingBottom: 36,
      maxHeight: '92%',
      borderTopWidth: 1,
      borderColor: colors.border,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    earlyBirdTag: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Theme.borderRadius.full,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    earlyBirdTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.6,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 4,
    },
    closeBtn: {
      padding: 6,
    },
    closeText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textMuted,
    },
    content: {
      paddingBottom: 16,
    },
    bannerBox: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary + '33',
      borderRadius: Theme.borderRadius.md,
      padding: 12,
      marginBottom: 16,
    },
    bannerTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
    },
    bannerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    featuresBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: Theme.borderRadius.md,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 8,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    checkIcon: {
      color: colors.emerald,
      fontSize: 14,
      fontWeight: 'bold',
    },
    featureText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    featureTextBold: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    tierCard: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      borderRadius: Theme.borderRadius.md,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    tierCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    tierBadge: {
      position: 'absolute',
      top: -10,
      right: 14,
      backgroundColor: colors.primary,
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
      color: colors.textPrimary,
    },
    tierSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    strikethroughText: {
      fontSize: 11,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
      marginTop: 2,
    },
    tierPrice: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    tierPeriod: {
      fontSize: 12,
      fontWeight: 'normal',
      color: colors.textSecondary,
    },
    savingsTag: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.emerald,
      marginTop: 2,
    },
    disclaimer: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 15,
    },
    ctaBtn: {
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    ctaText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    restoreBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    restoreText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
