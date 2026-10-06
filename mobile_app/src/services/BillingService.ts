import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export const REVENUECAT_ENTITLEMENT_ID = 'pro_access';

// Placeholder public SDK keys - replace with real keys from RevenueCat Dashboard
const REVENUECAT_GOOGLE_API_KEY = 'goog_sample_jobsign_api_key';
const REVENUECAT_APPLE_API_KEY = 'appl_sample_jobsign_api_key';

export class BillingService {
  private static isConfigured = false;

  public static async init(): Promise<void> {
    if (this.isConfigured) return;

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_APPLE_API_KEY : REVENUECAT_GOOGLE_API_KEY;
      Purchases.configure({ apiKey });
      this.isConfigured = true;
      console.log('✔ RevenueCat Billing Engine initialized successfully');
    } catch (e) {
      console.warn('RevenueCat initialization skipped in dev sandbox:', e);
    }
  }

  public static async checkProStatus(): Promise<boolean> {
    try {
      if (!this.isConfigured) await this.init();
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.all[REVENUECAT_ENTITLEMENT_ID]?.isActive === true;
    } catch (e) {
      return false; // Graceful fallback
    }
  }

  public static async fetchOfferings(): Promise<PurchasesPackage[]> {
    try {
      if (!this.isConfigured) await this.init();
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  public static async purchasePro(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo.entitlements.all[REVENUECAT_ENTITLEMENT_ID]?.isActive === true;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase error:', e);
      }
      return false;
    }
  }

  public static async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo.entitlements.all[REVENUECAT_ENTITLEMENT_ID]?.isActive === true;
    } catch (e) {
      return false;
    }
  }
}
