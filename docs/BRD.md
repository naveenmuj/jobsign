# Business Requirements Document (BRD)
## Project: JobSign — Mobile Estimate, Finger Signature & Direct Settlement App
**Target Markets:** United States, United Kingdom, Canada, Australia (Tier-1 English Markets)  
**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Product Owner:** Solo Developer / Founder  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Market Problem
In the United States and Tier-1 Western economies, independent trade professionals (electricians, plumbers, HVAC technicians, handymen, painters, landscapers) operate primarily out of service vehicles. When visiting customer job sites, the predominant industry practice remains verbal quoting or informal text messages (*"It'll be about \$450"*). 

This practice causes severe downstream financial leakage:
1. **Scope & Price Disputes:** Homeowners dispute the final price upon completion (*"I never agreed to \$450, I thought you said \$250"*).
2. **Credit Card Chargebacks:** Homeowners pay via credit card and later file chargeback disputes with issuing banks. Without a signed written agreement or formal authorization, merchant processors automatically rule in favor of the consumer.
3. **Software Alienation:** Existing software products (Joist, Invoice Simple, Jobber, Housecall Pro) suffer from three fatal market flaws:
   - **Cost Inflation:** Annual pricing escalates to \$200–\$999/year.
   - **High Time-to-Quote:** Complex 5-tab desktop architectures take 3–5 minutes to generate an estimate.
   - **Absence of On-Site Signature Capture:** None of the lightweight tools prioritize instant finger-on-glass quote approval before tools leave the truck.

### 1.2 The Business Objective
JobSign aims to capture market share among solo operators and micro-crews (1–3 technicians) by providing a **60-second, offline-first mobile quote, signature, and payment application**. 

**Primary Success Metrics (Year 1):**
- **Organic Installs:** 15,000+ downloads across US/UK/CA/AU via App Store Optimization (ASO).
- **Free-to-Paid Conversion:** $\ge 3.0\%$ conversion rate to annual subscriptions or lifetime unlocks.
- **ARR (Annual Recurring Revenue):** \$15,000 – \$25,000 USD (~₹15 to ₹25 Lakhs) with 0% cloud server overhead.

---

## 2. Target User Personas & Real-World Use Cases

### Persona 1: "Mike the Solo Electrician"
- **Demographics:** Self-employed licensed electrician, Austin, Texas. Ages 28–52. Operates solo from his work van.
- **Pain Points:** Works outdoors or in dark utility rooms with dirty hands. Hates sitting at a laptop at night doing paperwork. Wants proof of agreement before spending \$180 on parts.
- **Needs:** 1-tap item presets, large touch targets, fast on-screen signature, instant PDF sent via SMS.

### Persona 2: "Dave the Handyman / Remodeler"
- **Demographics:** General handyman / home repair technician, Florida. 
- **Pain Points:** Uses Joist or Invoice Simple, but angry that subscription prices increased from \$50 to \$200/year and that merchant links take 3.5% fees and hold payouts for 7 days.
- **Needs:** Zero-fee direct payment QR code (Zelle/Venmo) so clients pay him on the spot with zero commission deduction.

---

## 3. Scope of Work & Product Capabilities

### 3.1 In-Scope (Phase 1 MVP)
1. **Local-First Data Storage:** 100% functionality without internet connectivity using an embedded SQLite database.
2. **30-Second Quote Assembly:** Preset line-item catalogue, quick tax/markup configuration, and customer selector.
3. **Vector Signature Pad:** Full-screen signature canvas with high touch responsiveness (Bézier curves).
4. **Legal Audit Certificate (Page 2 of PDF):**
   - Exact UTC & Local Timestamp.
   - GPS Latitude & Longitude coordinate stamp.
   - Device hardware model identifier.
   - Standard legal ESIGN/UETA non-repudiation consent clause.
   - Document SHA-256 cryptographic checksum.
5. **PDF Rendering & Native Dispatch:** Vector PDF generation on device; instant dispatch via Android/iOS native share sheets (SMS, WhatsApp, Email).
6. **Direct Peer-to-Peer Payment QR Sheet:** Dynamic generation of Zelle, Venmo, CashApp, UPI, and Bank QR codes.
7. **Monetization Engine (RevenueCat SDK):**
   - Free Tier: 3 signed estimates per calendar month + discreet watermark.
   - Pro Tier: Unlimited estimates, watermark removal, custom business logo, Google Drive backup.

### 3.2 Out-of-Scope (Deferred to Phase 2/3)
- Multi-crew GPS live tracking dispatch (Jobber territory).
- Inventory warehouse stock barcode scanning.
- Automated merchant credit card terminal hardware integration.

---

## 4. Legal & Regulatory Requirements

### 4.1 United States ESIGN Act (15 U.S.C. § 7001) & UETA
To ensure signed estimates are legally binding and defensible in Small Claims Court:
1. **Affirmative Consent:** The client must view explicit language: *"By signing below, I certify that I authorize the specified work and agree to pay the total indicated."*
2. **Attribution:** The signature is tied to the signer through time, GPS location, and document hash.
3. **Document Integrity:** Once signed, the underlying estimate record enters `STATUS_LOCKED`. Any alteration of line items requires generating a new Change Order quote.

---

## 5. Non-Functional Requirements (NFRs)

| Metric | Target |
| :--- | :--- |
| **App Cold Start Time** | $< 1.2$ seconds on mid-range Android hardware. |
| **Quote Creation Time** | $< 45$ seconds from app open to signature canvas. |
| **PDF Generation Latency** | $< 800$ milliseconds on device CPU. |
| **Touch Canvas Latency** | $< 16$ milliseconds (smooth 60fps Bézier curve stroke). |
| **Storage Footprint** | $< 35$ MB installed app binary size. |
| **Offline Reliability** | 100% of core quote-to-PDF workflows functional in Airplane Mode. |
