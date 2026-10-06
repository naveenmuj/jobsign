import { Platform } from 'react-native';

/**
 * JobSign In-App Purchase & Subscription Configuration
 * 
 * Powered by RevenueCat & Google Play / Apple StoreKit.
 * Configured with live RevenueCat Test Store credentials.
 */

export const BILLING_CONFIG = {
  // RevenueCat Public SDK API Keys
  REVENUECAT_GOOGLE_API_KEY:
    process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'test_cnqhMmISsRwoEcSwFmvGHJjXHiw',
  REVENUECAT_APPLE_API_KEY:
    process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'test_cnqhMmISsRwoEcSwFmvGHJjXHiw',

  // Entitlement identifier configured in RevenueCat Dashboard
  ENTITLEMENT_ID: 'jobsign_pro',

  // Free Tier Policy
  FREE_QUOTES_PER_MONTH: 3,

  // Launch / Early-Bird Promotional Pricing
  TIERS: {
    MONTHLY: {
      id: 'jobsign_pro_monthly_earlybird',
      rcPackageIdentifier: '$rc_monthly',
      title: 'Monthly Flexible',
      subTitle: 'Cancel anytime in Play Store',
      introPrice: '$3.99',
      regularPrice: '$7.99',
      period: '/ mo',
      badge: '50% LAUNCH OFF',
      billingPeriod: 'P1M',
    },
    ANNUAL: {
      id: 'jobsign_pro_annual_earlybird',
      rcPackageIdentifier: '$rc_annual',
      title: 'Annual Protection',
      subTitle: 'Just $2.50 / month billed annually',
      introPrice: '$29.99',
      regularPrice: '$59.99',
      period: '/ yr',
      badge: 'BEST VALUE • SAVE 65%',
      billingPeriod: 'P1Y',
      isPopular: true,
    },
    LIFETIME: {
      id: 'jobsign_pro_lifetime_earlybird',
      rcPackageIdentifier: '$rc_lifetime',
      title: 'Founder Lifetime',
      subTitle: 'Pay once, own forever • Zero subscriptions',
      introPrice: '$49.99',
      regularPrice: '$99.99',
      period: 'once',
      badge: 'ONE-TIME PASS',
      billingPeriod: 'LIFETIME',
    },
  },
};

export const getRevenueCatApiKey = (): string => {
  return Platform.OS === 'ios'
    ? BILLING_CONFIG.REVENUECAT_APPLE_API_KEY
    : BILLING_CONFIG.REVENUECAT_GOOGLE_API_KEY;
};
