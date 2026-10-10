# JobSign 🔨✍️

> **Fast Mobile Estimate, Finger Signature & Direct Settlement App for Solo Contractors & Tradespeople**  
> *Target Markets: United States, United Kingdom, Canada, Australia*  
> *Repository: [https://github.com/naveenmuj/jobsign](https://github.com/naveenmuj/jobsign)*

---

## 📌 Executive Summary

**JobSign** is an offline-first mobile utility engineered for solo trade professionals (electricians, plumbers, handymen, HVAC technicians, painters, roofers). It solves the #1 pain point of independent contractors: **customer payment disputes and 3.5% transaction cuts from undocumented verbal agreements**.

In under 60 seconds on-site, a contractor can:
1. Assemble a clean estimate using 1-tap item presets or custom items.
2. Snap pre-existing worksite damage photos right from the camera (embedded as Exhibit A).
3. Hand their phone to the homeowner to **sign on glass**.
4. Cryptographically seal the agreement with a **tamper-evident SHA-256 digital audit record** (capturing timestamps, signature, and optional worksite location).
5. Display a dynamic peer-to-peer payment QR code (**Zelle / Venmo / CashApp / Bank**) for **100% payout with 0% middleman fees**.
6. Operate 100% offline in concrete basements with automatic **Offline Outbox background sync**.

---

## 🛠️ Technology Stack & Architecture

- **Framework:** React Native (Expo SDK ~57.0.26, React Native 0.86.3, Architecture New Engine, TypeScript 5)
- **Design System:** Material 3 Dark (High-Contrast Outdoor Theme, 56dp+ touch targets, glove-friendly)
- **Local Database:** `expo-sqlite` with Write-Ahead Logging (WAL) and atomic transactions
- **PDF Engine:** `expo-print` + `expo-crypto` for SHA-256 Document Hash & Digital Audit Record
- **Digital Signature:** Vector Bézier curve touch canvas (`react-native-svg` + Skia) with Affirmative Consent
- **Offline Reliability:** `expo-network` with Outbox Queue & background network listener
- **Worksite Camera:** `expo-image-picker` with base64 embedded Exhibit A PDF proof
- **Billing / In-App Purchases:** RevenueCat SDK (`react-native-purchases`)
- **Backend Operating Cost:** **$0.00 / month (Zero recurring cloud database overhead)**

---

## 📂 Repository Documentation Suite

All foundational research, competitor tears, legal invariants, and execution architecture are documented inside [`docs/`](./docs/):

| Document | Description |
| :--- | :--- |
| [**BRD.md**](./docs/BRD.md) | Full Business Requirements Document (Target Personas, Legal Invariants). |
| [**TRD.md**](./docs/TRD.md) | Technical Requirements & Systems Architecture Document. |
| [**01_FINAL_IMPLEMENTATION_PLAN.md**](./docs/01_FINAL_IMPLEMENTATION_PLAN.md) | Master Roadmap addressing Claude CLI critique points. |
| [**CLAUDE_CODE_AUDIT_AND_REVIEW.md**](./docs/CLAUDE_CODE_AUDIT_AND_REVIEW.md) | Multi-perspective senior engineering code audit and gap remediation log. |
| [**DEVICE_E2E_VERIFICATION_REPORT.md**](./docs/DEVICE_E2E_VERIFICATION_REPORT.md) | **100% Android Device E2E Test Report** with visual screenshot gallery on Pixel 10 Pro. |
| [**UI_UX_DESIGN_AND_ANIMATION_SPEC.md**](./docs/UI_UX_DESIGN_AND_ANIMATION_SPEC.md) | High-contrast design tokens, motion specs, and touch targets. |
| [**GAP_ANALYSIS_AND_MOATS.md**](./docs/GAP_ANALYSIS_AND_MOATS.md) | Small claims defensibility, scope-creep change orders, and offline edge cases. |
| [**BUILD_PROGRESS_AND_AUDIT_REPORT.md**](./docs/BUILD_PROGRESS_AND_AUDIT_REPORT.md) | Detailed verification, unit tests, and production audit report. |
| [**PRIVACY_POLICY.md**](./docs/PRIVACY_POLICY.md) | Google Play Store & App Store compliant GDPR/CCPA privacy policy. |
| [**ASO_AND_STORE_METADATA.md**](./docs/ASO_AND_STORE_METADATA.md) | High-converting keywords, store descriptions, and screenshot captions. |
| [**GOOGLE_PLAY_CLOSED_TESTING_GUIDE.md**](./docs/GOOGLE_PLAY_CLOSED_TESTING_GUIDE.md) | 14-day 15-tester closed testing blueprint for Google Play Console. |
| [**IN_APP_PURCHASES_SETUP_GUIDE.md**](./docs/IN_APP_PURCHASES_SETUP_GUIDE.md) | **In-App Purchase (RevenueCat) Setup & Activation Guide** with product IDs and credential checklist. |

---

## 📱 Mobile App Codebase Structure

Located inside [`mobile_app/`](./mobile_app/):

```text
mobile_app/
├── App.tsx                     # Reactive navigation controller & state sync
├── app.json                    # Release bundle & permissions config
├── eas.json                    # EAS cloud build profiles (.aab / .apk)
├── src/
│   ├── components/
│   │   ├── ChangeOrderModal.tsx  # Mid-job add-on defense with separate signatures
│   │   ├── JobCard.tsx           # High-contrast pipeline agreement card
│   │   ├── OfflineOutboxModal.tsx# Basement queue sync & offline client QR transfer
│   │   ├── PaymentQRModal.tsx    # Dynamic Zelle/Venmo/CashApp QR sheet (0% fee)
│   │   ├── PaywallModal.tsx      # In-app purchase tiers & conversion trigger
│   │   └── SignaturePad.tsx      # 120 FPS vector signature canvas with legal consent
│   ├── config/
│   │   └── billing.ts            # RevenueCat API config & Early-Bird low-cost pricing tiers
│   ├── screens/
│   │   ├── HomeScreen.tsx        # KPI metrics dashboard, live search & filter pills
│   │   ├── QuoteBuilderScreen.tsx# 60-sec quote builder, camera photo, terms chips
│   │   ├── QuoteDetailScreen.tsx # Locked audit view, quick call/SMS, photo exhibit
│   │   └── SettingsScreen.tsx    # Branding profile, item presets, SQLite backup vault
│   ├── services/
│   │   ├── BillingService.ts     # RevenueCat subscription manager with dev sandbox fallback
│   │   ├── DatabaseService.ts    # Embedded SQLite WAL engine
│   │   ├── OutboxService.ts      # Offline network state listener & auto-sync
│   │   └── PDFService.ts         # Vector PDF engine with SHA-256 audit record
│   ├── store/
│   │   └── useQuoteStore.ts      # Reactive Zustand store synced to SQLite
│   ├── theme/
│   │   └── index.ts              # Material 3 outdoor design tokens & 56dp targets
│   └── types/
│       └── index.ts              # Domain interfaces (Quote, LineItem, ChangeOrder, Outbox)
```

---

## 🚀 Running the App Locally

```bash
cd mobile_app
npm install

# Run TypeScript compiler check
npx tsc --noEmit

# Start Expo development server
npx expo start

# Run on Android Emulator or Physical Device
npx expo start --android
```

---

## 💰 Business Model & Early-Bird Unit Economics

- **Free Tier:** 3 signed agreements/month forever.
- **Early-Bird Monthly:** **\$3.99 / month** (50% launch discount, cancel anytime).
- **Early-Bird Annual:** **\$29.99 / year** (~**\$2.50 / month** billed annually) — *Best value, saves 65%*.
- **Founder Lifetime:** **\$49.99 one-time** — *Zero subscriptions, pay once, own forever*.
- **Transaction Commission:** **0%** (Direct Zelle / Venmo / CashApp payments).
