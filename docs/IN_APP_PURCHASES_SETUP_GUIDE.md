# JobSign: In-App Purchases (IAP) Implementation & Activation Guide

**SDK Integration:** RevenueCat SDK (`react-native-purchases` & `react-native-purchases-ui`)  
**Target Platforms:** Google Play Store (Android) & Apple App Store (iOS)  
**Configured Entitlement ID:** `jobsign_pro`  
**Test Store API Key:** `test_cnqhMmISsRwoEcSwFmvGHJjXHiw`  
**Free Tier Quota:** 3 signed agreements / calendar month  
**Status:** **Implemented, Verified on Pixel 10 Pro Device, and Ready for Store Key Injection**

---

## 1. What Has Been Implemented

1. **RevenueCat Billing Engine (`BillingService.ts`):**
   - Configured with `Purchases.setLogLevel(LOG_LEVEL.VERBOSE)`.
   - Dynamic RevenueCat API key initialization with platform-specific detection.
   - Dual Entitlement validation: checks `customerInfo.entitlements.active['jobsign_pro']` with fallback.
   - Integrated `RevenueCatUI.presentPaywall()` with complete `PAYWALL_RESULT` handling (`PURCHASED`, `RESTORED`, `NOT_PRESENTED`, `ERROR`, `CANCELLED`).
   - Graceful fallback: If RevenueCat Dashboard paywall is unconfigured or in offline/sandbox mode, automatically presents JobSign's custom 3-tier early-bird paywall.
   - Offline-proof local caching in SQLite/AsyncStorage: contractors working in concrete basements never lose Pro access when cell reception drops.

2. **Early-Bird Low-Cost Launch Pricing (`BILLING_CONFIG` & `PaywallModal.tsx`):**
   - Specifically structured with introductory low-friction pricing to maximize early conversion among solo tradespeople:
     - **Annual Protection (Most Popular):** **\$29.99 / year** (~~\$59.99/yr~~, equals **\$2.50 / month**, Save 65%).
     - **Founder Lifetime Pass:** **\$49.99 one-time** (~~\$99.99~~, pay once, own forever, zero subscriptions).
     - **Monthly Flexible:** **\$3.99 / month** (~~\$7.99/mo~~, 50% launch discount, cancel anytime).

3. **Quota & Gating Enforcement (`useQuoteStore.ts` & `HomeScreen.tsx`):**
   - `getMonthlyQuoteUsage()` tracks monthly quotes reactively.
   - HomeScreen displays dynamic Free Tier indicator: `Free plan: X of 3 estimates used this month`.
   - If free quota is reached (3 quotes), creating a quote or attempting to sign on glass triggers the Paywall with an upgrade alert.
   - Once upgraded, HomeScreen updates to `Pro — Unlimited Estimates Active` with a `Pro ✓` badge.
   - Settings screen includes active Pro state management and Dev toggle for testing.

---

## 2. Details & Credentials Required From You to Complete Live Store Billing

The codebase is fully equipped and tested with your Test Store key (`test_cnqhMmISsRwoEcSwFmvGHJjXHiw`) and entitlement ID (`jobsign_pro`).

When you are ready to publish to Google Play Store and Apple App Store for real money transactions:

### Step 1: In RevenueCat Dashboard (Project: `jobsign`)
1. In **Entitlements**: Confirm entitlement ID is named `jobsign_pro`.
2. In **Paywalls**: (Optional) Design a visual paywall template in RevenueCat's web builder if you want RevenueCatUI remote paywall overrides, or keep our custom built-in native modal.
3. In **API Keys**: Note your live Public Android Key (starts with `goog_...`) and Public iOS Key (starts with `appl_...`).

### Step 2: In Google Play Console (For Android Production)
1. **Google Play Service Account JSON:** Upload to RevenueCat Dashboard $\to$ Project Settings $\to$ Apps $\to$ Android app.
2. **Subscriptions / In-App Products:**
   - `jobsign_pro_monthly_earlybird` (\$3.99 / mo)
   - `jobsign_pro_annual_earlybird` (\$29.99 / yr)
   - `jobsign_pro_lifetime_earlybird` (\$49.99 one-time)
3. Attach these products to the `jobsign_pro` entitlement in RevenueCat Dashboard $\to$ Offerings.

### Step 3: Production API Key Injection
Once you have your production `goog_...` and `appl_...` keys, simply provide them or set them in `.env`:
```bash
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY="goog_your_production_key"
EXPO_PUBLIC_REVENUECAT_APPLE_KEY="appl_your_production_key"
```
The app will immediately query live Google Play Store prices and process real credit card/Play Balance payments with zero additional code changes.
