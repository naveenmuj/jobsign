# JobSign 🔨✍️

> **Fast Mobile Estimate, Finger Signature & Direct Payment App for Solo Contractors & Tradespeople**  
> *Target Markets: United States, United Kingdom, Canada, Australia*

---

## 📌 Executive Summary

**JobSign** is an offline-first mobile utility engineered for solo trade professionals (electricians, plumbers, handymen, HVAC technicians, painters). It solves the #1 pain point of independent contractors: **payment disputes and credit card chargebacks from undocumented verbal agreements**.

In under 60 seconds on-site, a contractor can:
1. Assemble a clean estimate using 1-tap item presets.
2. Turn their phone around to let the homeowner **sign on glass**.
3. Cryptographically seal the document with a **SHA-256 tamper-proof audit certificate** (GPS, timestamp, legal consent).
4. Display a direct peer-to-peer payment QR code (**Zelle / Venmo / CashApp / UPI / Bank**) for **100% payout with 0% middleman fees**.

---

## 📂 Repository Documentation Structure

All foundational research, competitor tears, legal invariants, and execution architecture are documented inside [`docs/`](./docs/):

| Document | Description |
| :--- | :--- |
| [**01_FINAL_IMPLEMENTATION_PLAN.md**](./docs/01_FINAL_IMPLEMENTATION_PLAN.md) | **Primary Roadmap:** Complete end-to-end architecture, Claude CLI audit resolutions, UX invariants, and 4-phase rollout. |
| [**02_MARKET_RESEARCH_SYNTHESIS.md**](./docs/02_MARKET_RESEARCH_SYNTHESIS.md) | Multi-platform findings across Google Play Store, Reddit (r/SaaS), Hacker News, and IndieHackers. |
| [**03_COMPETITOR_TEARDOWN.md**](./docs/03_COMPETITOR_TEARDOWN.md) | Teardown of Joist, Gizwood, Invoice Simple, Jobber, Housecall Pro, their pricing up to $999/yr, and UX vulnerabilities. |
| [**04_MONETIZATION_PLAYBOOK.md**](./docs/04_MONETIZATION_PLAYBOOK.md) | In-App Purchase pricing models, conversion triggers, unit economics, and grandfathered subscription tiers. |
| [**05_SOLO_DEVELOPER_EXECUTION_BLUEPRINT.md**](./docs/05_SOLO_DEVELOPER_EXECUTION_BLUEPRINT.md) | Zero-capital guide: managing USD earnings from India, zero-GST LUT filing, Section 44ADA tax, and Google Play 14-day testing. |
| [**06_TECHNICAL_ARCHITECTURE_ZERO_COST.md**](./docs/06_TECHNICAL_ARCHITECTURE_ZERO_COST.md) | Proof of $0 monthly operational cost: phone-only SQLite engine, on-device vector signature canvas, and local PDF rendering. |
| [**07_ANALYTICS_SPEC.md**](./docs/07_ANALYTICS_SPEC.md) | Zero-backend analytics setup using RevenueCat, Google Play Console, and Firebase. |
| **Raw Scraped Datasets** | [`data_playstore_raw.json`](./docs/data_playstore_raw.json) & [`data_b2b_niches_raw.json`](./docs/data_b2b_niches_raw.json). |

---

## 🛠️ Technology Stack

- **Framework:** Flutter (Android first, iOS ready)
- **Design System:** Material 3 (High-Contrast Outdoor Theme, 56dp+ touch targets)
- **Local Database:** SQLite / Drift (100% offline-first, embedded on device)
- **PDF Engine:** On-device Vector PDF Canvas (`pdf` & `printing`)
- **Digital Signature:** Bézier curve touch canvas + SHA-256 Document Hash + GPS/Timestamp stamp
- **Billing / In-App Purchases:** RevenueCat SDK (Google Play Billing v7)
- **Backup:** Optional 1-Tap Encrypted Google Drive Sync
- **Backend Server Cost:** **$0.00 / month**

---

## 🚀 Business Model & Pricing

- **Free Tier:** Up to 3 signed estimates/month forever + subtle watermark footer.
- **Pro Monthly:** $6.99 / month (Cancel anytime).
- **Pro Annual:** $44.99 / year (~$3.75/mo billed annually) — *Primary revenue driver*.
- **Lifetime License:** $79.99 one-time payment — *High conversion for users fatigued by recurring SaaS*.

---

## 📅 Roadmap Overview

```
Week 1: Core Foundation & Offline Engine (SQLite schema, 2-Screen Field UI, 30-sec quote builder)
Week 2: Vector Signature Canvas & SHA-256 Legal Audit Certificate
Week 3: Offline Outbox Queue & Direct P2P Payment Sheet (Zelle, Venmo, CashApp)
Week 4: RevenueCat IAP Integration, Closed Testing (15 testers), and US Play Store Launch
```
