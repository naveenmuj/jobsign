# Technical Architecture & Systems Engineering Document (TRD)
## Project: JobSign — Offline-First Mobile Systems Specification
**Version:** 1.0.0  
**Stack:** Flutter / Dart • SQLite (Drift) • RevenueCat • Google Play Billing v7  
**Architecture Pattern:** Local-First Repository Pattern with Reactive Streams  

---

## 1. System Architecture Overview

JobSign implements a **100% Local-First Architecture**. The application executes entirely on the client device (Snapdragon / MediaTek / Apple Bionic processor) with zero mandatory cloud dependencies for core business operations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JOBSIGN LOCAL ARCHITECTURE LAYOUT                     │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                            PRESENTATION LAYER                           │
  │   Material 3 • High-Contrast Field Theme • Large 56dp Touch Targets      │
  │   - HomePipelineScreen (Active Jobs Kanban: Draft | Signed | Paid)      │
  │   - QuoteBuilderScreen (Preset Chips, Tax Math, Camera Photo)           │
  │   - SignatureScreen (Vector Bézier Canvas, GPS & Consent Stamp)         │
  │   - PaymentSheetModal (Direct P2P QR Code Renderer)                     │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │                           APPLICATION / BLOC LAYER                      │
  │   - QuoteCubit (State machine: Draft -> Signed -> Paid)                 │
  │   - SignatureCubit (Point velocity, smoothing, cryptographic seal)      │
  │   - BillingCubit (RevenueCat Entitlement state listener)               │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │                            CORE ENGINES & DOMAIN                        │
  │   ┌───────────────────────────┐         ┌───────────────────────────┐   │
  │   │   PDF Document Generator  │         │   Cryptographic Sealer    │   │
  │   │   - 1-Page Line Item Grid │         │   - Computes SHA-256 Hash │   │
  │   │   - Page 2 Audit Cert     │         │   - Seals Document Record │   │
  │   └───────────────────────────┘         └───────────────────────────┘   │
  └────────────────────────────────────┬────────────────────────────────────┘
                                       │
  ┌────────────────────────────────────▼────────────────────────────────────┐
  │                         DATA & PERSISTENCE LAYER                        │
  │   - AppDatabase (Drift / SQLite Engine in sandboxed storage)            │
  │   - Table Quotes, Table LineItems, Table Presets, Table AuditLogs       │
  │   - SecureStorage (Business Profile, Tax Presets, Encrypted Keys)       │
  │   - OutboxQueueService (Background WorkManager for queued SMS/Email)    │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Specification (SQLite / Drift)

All tables are indexed, normalized, and managed under Drift type-safe ORM.

### 2.1 Table: `quotes`
```sql
CREATE TABLE quotes (
    id TEXT PRIMARY KEY NOT NULL,                -- UUID v4
    quote_number INTEGER NOT NULL,               -- Auto-incrementing human readable (e.g. 1001)
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    client_address TEXT,
    status TEXT NOT NULL,                        -- 'DRAFT', 'SIGNED_LOCKED', 'PAID', 'CANCELLED'
    subtotal_cents INTEGER NOT NULL,             -- Currency stored in integer cents ($450.00 = 45000)
    tax_rate_basis_points INTEGER DEFAULT 0,     -- 8.25% = 825
    tax_amount_cents INTEGER DEFAULT 0,
    total_amount_cents INTEGER NOT NULL,
    notes TEXT,
    photo_attachment_path TEXT,                  -- Sandboxed local file path
    signature_svg_path TEXT,                     -- Vector path of client signature
    signature_timestamp INTEGER,                 -- UTC epoch milliseconds
    signature_gps_lat REAL,
    signature_gps_lng REAL,
    pdf_sha256_hash TEXT,                        -- Cryptographic hash of locked PDF
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 2.2 Table: `line_items`
```sql
CREATE TABLE line_items (
    id TEXT PRIMARY KEY NOT NULL,
    quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity REAL NOT NULL DEFAULT 1.0,
    total_cents INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);
```

### 2.3 Table: `item_presets`
```sql
CREATE TABLE item_presets (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,                         -- e.g. "Diagnostic Fee"
    default_price_cents INTEGER NOT NULL,        -- e.g. 9500
    category TEXT,                               -- "Labor", "Parts", "Service"
    usage_count INTEGER DEFAULT 0                -- Sorted by most frequently used
);
```

---

## 3. Cryptographic Immutability & Signature Verification Engine

To satisfy the legal non-repudiation invariants identified during the Claude CLI review:

```dart
import 'dart:convert';
import 'package:crypto/crypto.dart';

class AuditCertificateEngine {
  /// Generates the SHA-256 fingerprint for a signed quote and appends the Audit Certificate
  static String computeDocumentHash({
    required String quoteId,
    required int totalCents,
    required String clientName,
    required String signatureData,
    required int timestampEpoch,
    required double? lat,
    required double? lng,
  }) {
    final payload = jsonEncode({
      'quote_id': quoteId,
      'total_cents': totalCents,
      'client': clientName,
      'signature': signatureData,
      'timestamp': timestampEpoch,
      'gps': '${lat ?? 0.0},${lng ?? 0.0}',
    });
    
    // Compute SHA-256 digest
    final digest = sha256.convert(utf8.encode(payload));
    return digest.toString();
  }
}
```

### The Invariant:
1. When a client signs, the state transition `DRAFT` $\to$ `SIGNED_LOCKED` occurs in a single atomic SQLite transaction.
2. If any line item is modified after this state transition, the application **blocks the write** or flags the document as **TAMPERED / INVALID**.

---

## 4. Offline Queue & Direct Payment QR Engine

### 4.1 Background Outbox Queue (`WorkManager`)
When network connectivity is unavailable on-site:
1. The app saves the PDF locally to `Documents/JobSign/Signed/`.
2. A job entry is queued in `outbox_dispatches` table.
3. Android `WorkManager` listens for `NetworkType.CONNECTED` constraint.
4. Upon reconnection, the queued SMS/Email dispatch triggers silently in the background.

### 4.2 Dynamic P2P Payment QR Generation
The payment sheet renders standard QR codes locally using `qr_flutter`:
* **Zelle / Email:** Encodes standard `mailto:` or Zelle deep-link syntax.
* **Venmo:** Encodes `https://venmo.com/?txn=pay&audience=private&recipients={username}&amount={total}&note={quoteNumber}`.
* **CashApp:** Encodes `https://cash.app/${cashtag}/{amount}`.
* **UPI (for international/India users):** Encodes `upi://pay?pa={vpa}&pn={name}&am={amount}&cu=INR`.

---

## 5. Monetization Integration (RevenueCat SDK)

```dart
class BillingService {
  static const String entitlementId = "pro_access";

  static Future<bool> isUserPro() async {
    try {
      final customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.all[entitlementId]?.isActive == true;
    } catch (_) {
      return false; // Fail gracefully to free tier
    }
  }

  static Future<bool> canCreateQuote(int currentMonthQuoteCount) async {
    final isPro = await isUserPro();
    if (isPro) return true;
    return currentMonthQuoteCount < 3; // Free tier allows 3 quotes/month
  }
}
```
