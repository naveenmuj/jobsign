import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';
import { BILLING_CONFIG, getRevenueCatApiKey } from '../config/billing';
import { useQuoteStore } from '../store/useQuoteStore';

export interface PurchaseResult {
  success: boolean;
  userCancelled?: boolean;
  errorMessage?: string;
}

export class BillingService {
  private static isConfigured = false;
  private static customerInfoListenerAttached = false;

  /**
   * Initializes RevenueCat with device API keys and attaches customer update listeners.
   */
  public static async init(): Promise<void> {
    if (this.isConfigured) return;

    const apiKey = getRevenueCatApiKey();
    // In dev / test environments with sample placeholder keys, don't trigger native store network errors
    if (!apiKey || apiKey.includes('sample_jobsign')) {
      console.log('[BillingService] Running in local offline sandbox mode (sample API key active).');
      return;
    }

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.WARN);
      }

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
      console.warn('RevenueCat initialization skipped in development sandbox:', e?.message || e);
    }
  }

  /**
   * Synchronizes CustomerInfo with the Zustand store.
   */
  private static syncCustomerEntitlements(customerInfo: CustomerInfo): boolean {
    const isPro = customerInfo.entitlements.active[BILLING_CONFIG.ENTITLEMENT_ID] !== undefined;
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
    } catch {
      // Degrades gracefully offline: relies on persistent store status
      return useQuoteStore.getState().isPro;
    }
  }

  /**
   * Checks whether the current user has active Pro access.
   */
  public static async checkProStatus(): Promise<boolean> {
    try {
      if (!this.isConfigured) await this.init();
      if (!this.isConfigured) return useQuoteStore.getState().isPro;

      const customerInfo = await Purchases.getCustomerInfo();
      const isActive = customerInfo.entitlements.active[BILLING_CONFIG.ENTITLEMENT_ID] !== undefined;
      useQuoteStore.getState().setProStatus(isActive);
      return isActive;
    } catch {
      return useQuoteStore.getState().isPro;
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
        // Mock fallback in sandbox
        return { success: true };
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
        return { success: true, isPro: useQuoteStore.getState().isPro };
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
