# UI/UX Design System, Screen Architecture & Motion Specification
## Project: JobSign — Field-Tough, High-Contrast & Tactile Micro-Interactions
**Design Philosophy:** "Field-Tough Precision" — Engineered for harsh sunlight, dirty work gloves, and one-handed operation.

---

## 1. Visual Design Tokens & Palette

### 1.1 Color System (High-Contrast Outdoor Mode)
- **Primary / Brand:** `#0F172A` (Deep Slate / Obsidian) — Anchor for text and primary cards.
- **Accent / Action:** `#2563EB` (Electric Blue) — Primary interactive buttons and highlights.
- **Success / Lock:** `#16A34A` (Emerald Shield) — Indicates signed, locked, and paid states.
- **Warning / Draft:** `#D97706` (Amber Ochre) — Draft indicators and pending items.
- **Canvas / Background:** `#F8FAFC` (Light Slate Tint) — Crisp, glare-resistant background.
- **Card Surface:** `#FFFFFF` (Pure Solid White) with `#E2E8F0` solid 1.5px borders (no weak drop shadows that wash out under sunlight).

### 1.2 Typography & Spacing
- **Display / Amounts:** Inter Bold, 28pt – 36pt (Instantly legible from arm's length).
- **Body / Labels:** Inter Medium/SemiBold, 15pt – 17pt.
- **Touch Target Invariant:** **Minimum 56dp height** across all buttons, chips, and tappable rows.

---

## 2. Complete Screen-by-Screen Architecture

The entire app is built around **3 Core Screens and 2 Modals**, eliminating deep navigation hierarchies:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JOBSIGN APPLICATION MAP                               │
└─────────────────────────────────────────────────────────────────────────────┘

  [ 1. HomePipelineScreen ] (Active Jobs Kanban)
         │
         ├─── Tap FAB (+ New Quote) ───────────► [ 2. QuoteBuilderScreen ]
         │                                               │
         │                                               ├── Tap "Get Client Signature"
         │                                               ▼
         │                                       [ 3. SignatureCanvasModal ]
         │                                       (Landscape 120 FPS Skia Pad)
         │                                               │
         │                                               ├── Tap "Confirm & Lock"
         │                                               ▼
         │                                       [ 4. QuoteDetailScreen ]
         │                                       (Locked View + 1-Tap PDF Share)
         │                                               │
         │                                               ├── Tap "Collect Payment"
         │                                               ▼
         └─────────────────────────────────────► [ 5. PaymentQRModal ]
                                                 (Direct Zelle/Venmo/CashApp QR)
```

---

## 3. Detailed Screen Breakdown & Elements

### Screen 1: `HomePipelineScreen` (The Command Center)
* **Header:** 
  * Contractor Business Name + Pro Status Badge (`FREE (2/3 LEFT)` or `PRO ⭐️`).
  * Quick Stats Card: *"Active Jobs: 3 • Uncollected: $1,250"*.
* **Segmented Filter Bar:** `All (3)` • `Draft (1)` • `Signed (1)` • `Paid (1)`.
* **Job Cards (Elevated Tactile Cards):**
  * Top Row: Client Name (`Sarah Jenkins`) + Amount (`$525.00`).
  * Middle Row: Short scope (`Electrical Panel Repair`) + Timestamp (`15m ago`).
  * Status Pill:
    * 🟡 Amber: `Draft • Unsigned`
    * 🔵 Blue with Pen Icon: `Signed on Glass • In Progress`
    * 🟢 Green with Checkmark: `Completed & Paid`
* **Floating Action Button (FAB):** 
  * Large Electric Blue pill: `➕ NEW 60-SEC QUOTE` (with spring micro-animation).

---

### Screen 2: `QuoteBuilderScreen` (30-Second Assembly)
* **Client Selector:**
  * Auto-fills from phone contacts or quick text input (`Sarah Jenkins`, `(512) 555-0199`).
* **1-Tap Quick Preset Chips (Horizontal Scroll):**
  * `[+ Diagnostic: $95]` `[+ Hourly Labor: $85/hr]` `[+ Panel Swap: $250]` `[+ Pipe Leak: $180]`.
  * Tapping a chip triggers an instant tactile haptic bounce and appends the row.
* **Line Items Table:**
  * Clean swipe-to-delete rows with editable quantity steppers (`-` `[ 1 ]` `+`).
* **Photo Proof Attachment:**
  * `[ 📷 Snap Worksite Photo ]` — Instantly embeds thumbnail to document pre-existing damage.
* **Sticky Bottom Action Bar:**
  * Shows real-time Total: **`$525.00`** (Tax automatically calculated).
  * Big Green Button: `✍️ HAND PHONE TO CLIENT TO SIGN`.

---

### Screen 3: `SignatureCanvasModal` (The Moment of Agreement)
* **Auto-Rotate:** Automatically shifts to landscape orientation to provide a spacious writing canvas.
* **Top Affirmative Consent Banner:**
  > *"By signing below, I authorize the work described above for $525.00 and agree to pay upon completion."*
* **The 120 FPS Skia Canvas:**
  * Deep navy ink stroke (`#0F172A`) with realistic variable line width based on touch velocity.
* **Actions:**
  * `Clear` (Reset canvas).
  * `✅ CONFIRM & SEAL ESTIMATE` (Big emerald button).

---

### Screen 4: `QuoteDetailScreen` (Locked & Defensible)
* **Status Banner:** Emerald Shield with **`LOCKED & LEGALLY SEALED`**.
* **Audit Trail Badge:** 
  * Shows SHA-256 Hash snippet (`e3b0c442...`), GPS coordinates (`Austin, TX`), and exact timestamp.
* **Action Grid:**
  * `📄 View & Send PDF` (Direct native share via SMS/WhatsApp/Email).
  * `➕ Add Change Order` (Mid-job scope discovery pad).
  * `💵 Collect Payment` (Triggers P2P QR Sheet).

---

### Screen 5: `PaymentQRModal` (Instant Zero-Fee Settlement)
* **Payment Selector Tabs:** `Zelle` • `Venmo` • `Cash App` • `Direct Bank / UPI`.
* **Dynamic QR Code:**
  * Renders a large, high-density QR code pre-filled with the exact amount (`$525.00`) and contractor account.
  * Homeowner simply scans the contractor's phone screen with their banking app.
* **1-Tap Action:** `✅ Mark as Paid in Full` (Triggers confetti celebration animation).

---

## 4. Animation & Tactile Haptic System

All animations are powered by **React Native Reanimated 3** executing on the native UI thread:

1. **Preset Chip Snap Animation:** Spring interpolation (`damping: 15`, `stiffness: 150`) when an item chip is tapped into the list.
2. **Signature Seal Transition:** When `Confirm & Seal` is tapped:
   * The signature canvas scales down into a sealed document icon.
   * Device triggers a **heavy impact haptic vibration** (`Haptics.impactAsync(ImpactFeedbackStyle.Heavy)`), giving physical tactile feedback that the contract is locked.
3. **Card Press Micro-Bounce:** All job cards scale down to `0.98` on touch down and spring back to `1.0` on release.
4. **Paid Confetti Burst:** Lightweight Lottie / Canvas particle burst when marking a job paid.
