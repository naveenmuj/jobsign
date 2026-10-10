import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { BILLING_CONFIG, getRevenueCatApiKey } from '../config/billing';
import { useQuoteStore } from '../store/useQuoteStore';
import { FEATURE_FLAGS } from '../config/featureFlags';

export interface PurchaseResult {
  success: boolean;
  userCancelled?: boolean;
  errorMessage?: string;
}

export class BillingService {
  private static isConfigured = false;
  private static customerInfoListenerAttached = false;

  /**
   * Initializes RevenueCat with platform API keys and attaches customer update listeners.
   */
  public static async init(): Promise<void> {
    if (!FEATURE_FLAGS.PAYMENT_ENABLED) {
      if (FEATURE_FLAGS.FREE_ALL_FEATURES) {
        useQuoteStore.getState().setProStatus(true);
      }
      return;
    }
    if (this.isConfigured) return;

    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      console.log('[BillingService] No RevenueCat API key found.');
      return;
    }

    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      Purchases.configure({ apiKey });
      this.isConfigured = true;

      // Attach customer info listener for automatic real-time entitlement sync
      if (!this.customerInfoListenerAttached) {
        Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
          this.syncCustomerEntitlements(customerInfo);
        });
        this.customerInfoListenerAttached = true;
      }

      // Check current entitlement status on launch
      await this.syncCurrentCustomerInfo();
      console.log('✔ RevenueCat Billing Service configured and synchronized.');
    } catch (e: any) {
      this.isConfigured = false;
      console.warn('[BillingService] RevenueCat initialization note:', e?.message || e);
    }
  }

  /**
   * Synchronizes CustomerInfo with the Zustand store.
   * Checks both 'jobsign_pro' and fallback ENTITLEMENT_ID.
   */
  public static syncCustomerEntitlements(customerInfo: CustomerInfo): boolean {
    const isPro =
      typeof customerInfo.entitlements.active['jobsign_pro'] !== 'undefined' ||
      typeof customerInfo.entitlements.active[BILLING_CONFIG.ENTITLEMENT_ID] !== 'undefined';

    useQuoteStore.getState().setProStatus(isPro);
    return isPro;
  }

  /**
   * Refreshes customer info from RevenueCat cache/servers.
   */
  public static async syncCurrentCustomerInfo(): Promise<boolean> {
    try {
      if (!this.isConfigured) await this.init();
      if (!this.isConfigured) return useQuoteStore.getState().isPro;

      const customerInfo = await Purchases.getCustomerInfo();
      return this.syncCustomerEntitlements(customerInfo);
    } catch (e) {
      // Degrades gracefully offline: relies on persistent store status
      return useQuoteStore.getState().isPro;
    }
  }

  /**
   * Checks whether the current user has active Pro access.
   */
  public static async checkProStatus(): Promise<boolean> {
    if (!FEATURE_FLAGS.PAYMENT_ENABLED && FEATURE_FLAGS.FREE_ALL_FEATURES) {
      useQuoteStore.getState().setProStatus(true);
      return true;
    }
    try {
      if (!this.isConfigured) await this.init();
      if (!this.isConfigured) return useQuoteStore.getState().isPro;

      const customerInfo = await Purchases.getCustomerInfo();
      const isActive =
        typeof customerInfo.entitlements.active['jobsign_pro'] !== 'undefined' ||
        typeof customerInfo.entitlements.active[BILLING_CONFIG.ENTITLEMENT_ID] !== 'undefined';

      useQuoteStore.getState().setProStatus(isActive);
      return isActive;
    } catch {
      return useQuoteStore.getState().isPro;
    }
  }

  /**
   * Presents the RevenueCat UI Paywall configured in the RevenueCat dashboard.
   * Returns true if user purchased or restored pro access, false otherwise.
   */
  public static async presentRevenueCatPaywall(): Promise<boolean> {
    if (!FEATURE_FLAGS.PAYMENT_ENABLED) {
      return false;
    }
    try {
      // In Expo Go sandbox, RevenueCatUI defaults to browser DOM mode which lacks document in Hermes.
      // Returning false cleanly falls back to JobSign's native styled PaywallModal.
      const isExpoGo = !!((globalThis as any).expo?.modules?.ExpoGo);
      if (isExpoGo) {
        return false;
      }

      if (!this.isConfigured) await this.init();

      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED: {
          const isPro = await this.syncCurrentCustomerInfo();
          return isPro;
        }
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
        default:
          return false;
      }
    } catch (e) {
      console.log('[BillingService] RevenueCatUI presentPaywall not available or unconfigured:', e);
      return false;
    }
  }

  /**
   * Fetches the current offering packages from RevenueCat / Google Play.
   */
  public static async fetchOfferings(): Promise<PurchasesPackage[]> {
    try {
      if (!this.isConfigured) await this.init();
      if (!this.isConfigured) return [];

      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e: any) {
      console.log('Notice: Live offerings not found on store (sandbox mode active).');
      return [];
    }
  }

  /**
   * Purchases a specific RevenueCat package.
   */
  public static async purchasePro(pkg: PurchasesPackage): Promise<PurchaseResult> {
    try {
      if (!this.isConfigured) await this.init();
      if (!this.isConfigured) {
        if (__DEV__) {
          console.warn('[BillingService] Development sandbox mock purchase.');
          useQuoteStore.getState().setProStatus(true);
          return { success: true };
        }
        return {
          success: false,
          errorMessage: 'Google Play billing is currently unavailable. Please verify Play Store connectivity and try again.',
        };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = this.syncCustomerEntitlements(customerInfo);
      return { success: isPro };
    } catch (e: any) {
      const isCancelled = (e as PurchasesError)?.userCancelled === true;
      if (isCancelled) {
        return { success: false, userCancelled: true };
      }
      return {
        success: false,
        errorMessage: e?.message || 'Transaction could not be completed with the Play Store.',
      };
    }
  }

  /**
   * Restores existing purchases associated with the Google Play / Apple ID.
   */
  public static async restorePurchases(): Promise<{ success: boolean; isPro: boolean; errorMessage?: string }> {
    try {
      if (!this.isConfigured) await this.init();
      if (!this.isConfigured) {
        if (__DEV__) {
          return { success: true, isPro: useQuoteStore.getState().isPro };
        }
        return {
          success: false,
          isPro: false,
          errorMessage: 'Unable to connect to Google Play to restore purchases. Please verify your internet connection.',
        };
      }

      const customerInfo = await Purchases.restorePurchases();
      const isPro = this.syncCustomerEntitlements(customerInfo);
      return { success: true, isPro };
    } catch (e: any) {
      return {
        success: false,
        isPro: useQuoteStore.getState().isPro,
        errorMessage: e?.message || 'Unable to connect to Google Play to restore purchases.',
      };
    }
  }
}
