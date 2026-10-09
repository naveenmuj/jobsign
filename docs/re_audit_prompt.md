You are a Principal Mobile Architect and Fintech Systems Auditor conducting the follow-up verification audit of the JobSign React Native application in `mobile_app/src/`.

MISSION: Re-audit the codebase in `mobile_app/src/` to verify that all previous gaps identified against "myBillBook" (com.valorem.flobooks) have been fully resolved.

Specifically verify:
1. DOCUMENT TYPE SELECTOR:
   - Check `QuoteBuilderScreen.tsx`: Does the user now have an interactive, prominent 4-segment Document Type selector allowing them to create Tax Invoice (`TAX_INVOICE`), Quotation/Estimate (`ESTIMATE`), Bill of Supply (`BILL_OF_SUPPLY`), and Delivery Challan (`DELIVERY_CHALLAN`)?
   - Does selecting Bill of Supply or Delivery Challan automatically handle tax exemption?
   - Does `QuoteDetailScreen.tsx` and `JobCard.tsx` clearly display the active document type title?

2. GST & PLACE OF SUPPLY ARCHITECTURE:
   - Check `QuoteBuilderScreen.tsx`: Does the Place of Supply now have quick-pick state chips (Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, UP, WB, Gujarat)?
   - Does selecting a state intelligently auto-toggle Intra-state (CGST+SGST) vs Inter-state (IGST) split based on contractor state code?
   - Does `PDFService.ts` correctly render the GST breakdown table, Place of Supply, and document title?

3. PAYMENT SCHEDULE & DUE DATE:
   - Check `QuoteBuilderScreen.tsx`: Does the Payment Terms card show a dynamic banner with the calculated Due Date (e.g. "Oct 16, 2026 (7 days)")?
   - Check `QuoteDetailScreen.tsx` & `JobCard.tsx`: Does it show the Due Date badge for pending invoices?

4. WHATSAPP INVOICE & PAYMENT SHARING:
   - Check `QuoteDetailScreen.tsx`: Does `handleShareWhatsApp` compose an itemized message including Document Type, Invoice #, Total, Balance Due, Due Date, and direct UPI ID / Bank Account details?

5. TECHNICAL INTEGRITY:
   - Confirm TypeScript integrity, offline database persistence, and absence of regressions.

Provide an updated, definitive verification report with final parity score and production readiness assessment.
