# JobSign: End-to-End Architecture & Implementation Blueprint

## 1. Executive Summary & Core Mission
**JobSign** is an offline-first, zero-subscription-trap mobile utility engineered for solo trade contractors (electricians, plumbers, handymen, HVAC technicians, painters) across Tier-1 markets (US, UK, Canada, Australia). 

It allows a contractor to generate a clean estimate in 30 seconds, hand their smartphone to the homeowner to **sign on glass**, lock the document with an **immutable cryptographic hash and audit trail**, and receive instant direct payments (via Zelle/Venmo/CashApp/UPI QR) with **0% middleman transaction cuts**.

---

## 2. Incorporating Claude CLI Architectural & Legal Critique

Our architecture specifically addresses the three critical vulnerabilities identified during the Claude CLI review:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CRITICAL VULNERABILITIES & ENGINEERING FIXES                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Legal Immutability & Tamper-Proofing (ESIGN / Courtroom Invariant)       │
│    • Vulnerability: Opposing counsel claims the SQLite database was edited   │
│      after the client signed.                                               │
│    • Engineering Fix: SHA-256 Document Fingerprint. Once signed, the app   │
│      generates the PDF, computes its SHA-256 cryptographic hash, and writes │
│      an immutable, append-only Audit Certificate onto Page 2 of the PDF.    │
│      The quote record is marked `STATUS_LOCKED` in SQLite. Any tampering     │
│      immediately invalidates the hash signature.                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. The "No Cell Signal" Delivery Tension                                    │
│    • Vulnerability: Contractor is in a basement; client must receive a copy. │
│    • Engineering Fix: Hybrid Delivery & Offline Outbox Queue.               │
│      - Channel A (On-Site): Client scans a local dynamic QR code to save    │
│        the signed PDF directly to their phone via WiFi Direct/Local Web.    │
│      - Channel B (SMS/Email Queue): Background WorkManager queues the SMS/  │
│        Email dispatch, firing automatically the moment 4G/WiFi reconnects.  │
│      - Auto Local Storage Mirror: A copy is saved to `Documents/JobSign/`   │
│        so phone resets never wipe raw files.                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Eliminating the "Monetization Backlash"                                   │
│    • Vulnerability: Contractors revolt over hidden Stripe cuts and forced   │
│      price hikes (the exact reason Joist and Invoice Simple get 1-stars).   │
│    • Engineering Fix: Pure Zero-Fee Model.                                  │
│      - JobSign NEVER takes a cut of contractor payments.                    │
│      - Contractors display direct Peer-to-Peer QR codes (Zelle/Venmo/Bank). │
│      - "Grandfathered Pricing Promise": The $44.99/year or $79.99 lifetime  │
│        price is locked forever for early adopters.                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The "Field-Tough" Ultra-Simple UX Invariants

Contractors operate in harsh real-world conditions (bright midday glare, dirty/sweaty hands, standing on ladders). The UI adheres strictly to **Field-Tough UX Invariants**:

1. **High-Contrast Outdoor Theme:** High-contrast Material 3 typography with pure white cards and solid bold borders (no subtle pastel grays that wash out in sunlight).
2. **Fat-Finger Touch Targets:** Minimum 56dp height on all buttons and line-item triggers.
3. **No Dropdown Traps:** Line items are added via large 1-tap preset chips (*"Diagnostic \$95"*, *"Labor \$85/hr"*, *"Part Replacement \$180"*).
4. **2-Step Maximum Navigation:**
   * **Step 1:** Tap `+ New Quote` $\to$ Enter Client Name $\to$ Tap 2-3 Preset Items.
   * **Step 2:** Tap `Hand Phone to Client` $\to$ Screen rotates to Landscape Signature Canvas.
5. **Zero Mandatory Account Signup:** The contractor downloads the app and makes their first quote in `< 45 seconds`.

---

## 4. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JOBSIGN LOCAL-FIRST ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘

                  ┌────────────────────────────────────────┐
                  │       Flutter Mobile Client (Dart)     │
                  │   Material 3 • High Contrast Outdoor   │
                  └──────────────────┬─────────────────────┘
                                     │
           ┌─────────────────────────┼────────────────────────┐
           │                         │                        │
           ▼                         ▼                        ▼
┌────────────────────┐    ┌─────────────────────┐   ┌───────────────────┐
│ SQLite / Drift     │    │ Vector Signature    │   │ Local PDF Engine  │
│ Local Database     │    │ Canvas (Bézier Path)│   │ (pdf / printing)  │
│ • Jobs & Presets   │    │ • Captures Points   │   │ • 1-Page Layout   │
│ • SHA-256 Hashes   │    │ • GPS & Timestamp   │   │ • Page 2 Audit    │
│ • Outbox Queue     │    │ • Legal Consent Text│   │   Certificate     │
└────────────────────┘    └─────────────────────┘   └───────────────────┘
           │                         │                        │
           └─────────────────────────┼────────────────────────┘
                                     │
                                     ▼
                ┌────────────────────────────────────────┐
                │        Cryptographic Lock Engine       │
                │ • Computes SHA-256 of generated PDF    │
                │ • Marks job status: LOCKED_IMMUTABLE   │
                └────────────────────┬───────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     │                               │
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │   Offline Outbox Daemon   │   │   RevenueCat IAP Engine   │
       │ • Queues SMS/Email sends  │   │ • Google Play Billing v7  │
       │ • Fires when online       │   │ • Free Tier (3 quotes/mo) │
       │ • 1-Tap Google Drive sync │   │ • Pro Annual ($44.99/yr)  │
       └───────────────────────────┘   └───────────────────────────┘
```

---

## 5. Detailed Step-by-Step User Flow

### Step 1: 30-Second Quote Assembly
* Contractor taps Floating Action Button: `+ New Quote`.
* Client Name: Types or selects from recent contacts (`Sarah Jenkins`).
* Taps Item Chips:
  * `[+ Diagnostic Service: $95]`
  * `[+ Main Breaker: $220]`
  * `[+ 2 Hrs Labor: $170]`
* Subtotal: **\$485.00** | Tax (8.25%): **\$40.01** | Total: **\$525.01**.
* *Optional:* 1 tap to snap a camera photo of the burnt breaker.

### Step 2: The "Sign on Glass" Approval Pad
* Contractor taps large green button: `Get Client Signature`.
* Screen locks into high-contrast Landscape Canvas displaying:
  > *"By signing below, I authorize the work described above for \$525.01 and agree to pay upon completion."*
* Sarah signs with her finger.
* Taps `Confirm & Lock`.
* **Behind the Scenes:** The app generates the PDF, generates a SHA-256 cryptographic checksum, stamps GPS latitude/longitude, timestamp, and device model, and seals the record as **LOCKED**.

### Step 3: Work Completion & Zero-Fee Payment
* Contractor finishes work, taps `Mark Work Complete`.
* The screen displays the contractor's direct payment QR code:
  * *"Scan to Pay \$525.01 via Zelle / Venmo / CashApp"*.
* Homeowner scans and pays directly. Contractor keeps 100% of the funds.
* Signed PDF is automatically texted to homeowner's phone.

---

## 6. Phased Implementation Roadmap

### Phase 1: Core Foundation & Offline Engine (Week 1)
- [ ] Initialize Flutter project (`job_sign`) with Material 3 high-contrast theme.
- [ ] Implement SQLite schema with Drift: `quotes`, `line_items`, `presets`, `audit_logs`.
- [ ] Build Screen 1: Active Jobs Kanban Pipeline (`Draft`, `Signed`, `Completed`).
- [ ] Build Screen 2: 30-Second Quote Builder with 1-tap item chips.

### Phase 2: Signature Canvas & Cryptographic Lock (Week 2)
- [ ] Build vector signature canvas tracking velocity and Bézier curve smoothing.
- [ ] Implement legal consent disclosure and GPS/timestamp capture.
- [ ] Build on-device PDF engine rendering crisp 1-page estimates.
- [ ] Implement Page 2 **Audit Certificate** and SHA-256 document hashing.
- [ ] Implement immutable state transition (`DRAFT` $\to$ `LOCKED`).

### Phase 3: Outbox Queue & Direct Payments (Week 3)
- [ ] Implement WorkManager offline queue for SMS/Email dispatch when network returns.
- [ ] Implement dynamic on-screen QR code generator for direct P2P payments (Zelle, Venmo, UPI, Bank).
- [ ] Implement 1-tap encrypted Google Drive database backup.
- [ ] Implement local scoped storage document mirroring.

### Phase 4: RevenueCat IAP, Testing & Play Store Launch (Week 4)
- [ ] Integrate RevenueCat SDK:
  - Free Tier: 3 quotes/month with watermark.
  - Pro Tier: \$6.99/month, \$44.99/year, \$79.99 lifetime.
- [ ] Integrate Firebase Analytics (event tracking for funnels).
- [ ] Prepare Google Play Store listing (ASO keywords: *contractor estimate generator, quote maker with signature, handyman invoice*).
- [ ] Enroll 15 testers in `r/AndroidClosedTesting` for the 14-day Play Console requirement.
- [ ] Public production release across US, UK, Canada, and Australia.
