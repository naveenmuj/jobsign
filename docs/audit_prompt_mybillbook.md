You are a Principal Mobile Architect and Fintech Systems Auditor reviewing the JobSign React Native application in `mobile_app/src/`.

MISSION: Conduct an exhaustive, end-to-end audit evaluating JobSign's feature-wise and user experience-wise compatibility and parity against "myBillBook" (com.valorem.flobooks) - India's benchmark mobile billing, GST invoicing, and accounting app for trades, contractors, and SMBs.

Please analyze the codebase in `mobile_app/src/` (screens, components, services, store, types, utils) and evaluate:

1. FEATURE COMPATIBILITY WITH myBillBook:
   - Document Types: Tax Invoice, Bill of Supply, Quotation/Estimate, Delivery Challan. Are they properly differentiated in UI, state, and PDF?
   - GST & Tax Architecture: CGST + SGST (intra-state) vs IGST (inter-state) split, Place of Supply state codes, HSN/SAC codes, tax breakdown tables in PDFs and screens.
   - Line Items & Pricing: Quantity, Unit of measurement (nos, pcs, sq.ft, mtr, hrs, kg, box, etc.), item-level discounts, unit rates, subtotal.
   - Party / Client Information: Name, Phone, Address, GSTIN / Tax ID, Place of Supply.
   - Payment Collection & Banking: Multiple saved Bank Accounts (Acc #, IFSC, Bank Name), UPI IDs & scannable dynamic QR codes (PhonePe, GPay, Paytm), advance/deposit deducted, net balance due display.
   - Invoice Themes / Templates: Professional PDF layouts (GST Standard, Modern, Thermal / Compact, etc.), logo, authorized signatory seal, amount in words (Indian numbering system).
   - Sharing & Follow-up: 1-tap WhatsApp/SMS invoice dispatch with payment link/summary text.
   - Offline Resilience: SQLite persistence, draft preservation, no loss of work.

2. USER EXPERIENCE (UX) & WORKFLOW COMPATIBILITY:
   - Speed of quote/bill creation (60-second workflow vs clutter).
   - Financial clarity: Is the math completely unambiguous (Subtotal - Discount + Tax - Deposit = Balance Due)?
   - Touch ergonomics: 48-56dp touch targets, keypad dismissal, smooth keyboard navigation.
   - State & lifecycle handling: Moving from Draft -> Signed/Locked -> Invoiced -> Paid.

3. CONCRETE GAPS & BUGS:
   Identify any concrete bugs, functional gaps, missing properties, or UX flaws. For each finding, provide:
   - Severity: [CRITICAL], [HIGH], [MEDIUM], or [LOW]
   - File & Location: exact file path and component/function
   - Problem Statement: exact bug or missing feature compared to myBillBook
   - Impact: what happens to the user or business
   - Required Remediation: exact technical fix needed

Provide your comprehensive audit report with clear sections and an executive summary.
