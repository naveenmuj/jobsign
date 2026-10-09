import { ContractorProfile } from '../types';

export type PaymentRegion = 'IN' | 'US' | 'GB' | 'EU' | 'CA' | 'AU' | 'GLOBAL';

export interface RegionPaymentConfig {
  region: PaymentRegion;
  regionName: string;
  locale: string;
  instantRailLabel: string;
  instantRailName: string;
  instantIdLabel: string;
  instantIdPlaceholder: string;
  bankRailLabel: string;
  bankTitle: string;
  bankAccountLabel: string;
  bankAccountPlaceholder: string;
  bankCodeLabel: string;
  bankCodePlaceholder: string;
  scannerTitle: string;
  scannerApps: string;
  invoiceInstantLabel: string;
  invoiceBankLabel: string;
  invoiceBankCodePrefix: string;
  defaultTaxLabel: string;
  invoiceTitle: string;
  estimateTitle: string;
  legalSealedBadge: string;
  legalConsentCitation: string;
  waiverTitle: string;
  waiverBodyText: string;
  auditCertificateTitle: string;
  auditGoverningStandard: string;
  businessIdLabel: string;
  businessIdPlaceholder: string;
  depositLabel: string;
  balanceDueLabel: string;
}

const REGION_CONFIGS: Record<PaymentRegion, RegionPaymentConfig> = {
  IN: {
    region: 'IN',
    regionName: 'India',
    locale: 'en-IN',
    instantRailLabel: '⚡ UPI (GPay • PhonePe • Paytm)',
    instantRailName: 'UPI',
    instantIdLabel: 'UPI ID / VPA *',
    instantIdPlaceholder: 'e.g. 9876543210@paytm, contractor@okhdfcbank',
    bankRailLabel: '🏛️ Bank (IMPS / NEFT)',
    bankTitle: 'Direct Bank Transfer (NEFT / IMPS)',
    bankAccountLabel: 'Bank Account Number *',
    bankAccountPlaceholder: 'e.g. 50100234567890',
    bankCodeLabel: 'Bank IFSC Code *',
    bankCodePlaceholder: 'e.g. HDFC0001234, SBIN0000456',
    scannerTitle: 'SCAN WITH ANY UPI APP',
    scannerApps: 'Google Pay • PhonePe • Paytm • BHIM • Cred • Any Bank UPI App',
    invoiceInstantLabel: 'UPI (GPay/PhonePe/Paytm)',
    invoiceBankLabel: 'Bank (IMPS/NEFT)',
    invoiceBankCodePrefix: 'IFSC',
    defaultTaxLabel: 'GST',
    invoiceTitle: 'TAX INVOICE & RECEIPT',
    estimateTitle: 'QUOTATION & WORK AGREEMENT',
    legalSealedBadge: 'IT Act 2000 Certified',
    legalConsentCitation: 'the Information Technology Act, 2000 (Section 10A) and the Indian Contract Act, 1872',
    waiverTitle: 'FULL SATISFACTION & DISCHARGE OF ACCOUNT',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor certifies receipt in full, discharges this invoice, and releases all financial claims for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'LEGAL AUDIT CERTIFICATE OF AUTHENTICITY',
    auditGoverningStandard: 'Information Technology Act, 2000 (§ 10A - Validity of electronic contracts) and Section 65B of the Indian Evidence Act.',
    businessIdLabel: 'GSTIN / PAN Number',
    businessIdPlaceholder: 'e.g. 29ABCDE1234F1Z5 or PAN',
    depositLabel: 'Advance Received (बयाना)',
    balanceDueLabel: 'Balance Due (बकाया राशि)',
  },
  US: {
    region: 'US',
    regionName: 'United States',
    locale: 'en-US',
    instantRailLabel: '⚡ Instant Pay (Zelle / Venmo)',
    instantRailName: 'Instant Pay',
    instantIdLabel: 'Zelle / Payment Email or Mobile *',
    instantIdPlaceholder: 'e.g. payments@apexservices.com',
    bankRailLabel: '🏛️ Bank (ACH / Wire)',
    bankTitle: 'Direct Bank Transfer (ACH / Wire)',
    bankAccountLabel: 'Account Number *',
    bankAccountPlaceholder: 'e.g. 1029384756',
    bankCodeLabel: 'Routing Number (ABA / ACH) *',
    bankCodePlaceholder: 'e.g. 021000021 (9 digits)',
    scannerTitle: 'SCAN WITH CAMERA OR BANKING APP',
    scannerApps: 'Camera • Mobile Banking • Zelle • Venmo • Cash App',
    invoiceInstantLabel: 'Zelle / Instant Pay',
    invoiceBankLabel: 'Bank Deposit (ACH/Wire)',
    invoiceBankCodePrefix: 'Routing',
    defaultTaxLabel: 'Sales Tax',
    invoiceTitle: 'TAX INVOICE & RECEIPT',
    estimateTitle: 'ESTIMATE & AGREEMENT',
    legalSealedBadge: 'UETA / ESIGN Sealed',
    legalConsentCitation: '15 U.S. Code § 7001 (ESIGN Act), the Uniform Electronic Transactions Act (UETA), and applicable state commercial laws',
    waiverTitle: 'AUTOMATIC CONDITIONAL LIEN WAIVER & RELEASE',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor waives and releases any and all mechanic\'s lien, stop notice, or bond rights for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'UETA / ESIGN ACT COURTROOM AUDIT CERTIFICATE',
    auditGoverningStandard: '15 U.S. Code § 7001 (Electronic Signatures in Global and National Commerce Act) & Uniform Electronic Transactions Act (UETA § 7).',
    businessIdLabel: 'Contractor License # / EIN',
    businessIdPlaceholder: 'e.g. CA Lic #1049281 or EIN 12-3456789',
    depositLabel: 'Deposit Paid',
    balanceDueLabel: 'Balance Due',
  },
  GB: {
    region: 'GB',
    regionName: 'United Kingdom',
    locale: 'en-GB',
    instantRailLabel: '⚡ Faster Payments',
    instantRailName: 'Faster Payments',
    instantIdLabel: 'Instant Pay Reference / Link *',
    instantIdPlaceholder: 'e.g. contractor@bank.co.uk',
    bankRailLabel: '🏛️ Bank (Sort Code)',
    bankTitle: 'Direct Bank Transfer (Faster Payments / BACS)',
    bankAccountLabel: 'Account Number (8 digits) *',
    bankAccountPlaceholder: 'e.g. 12345678',
    bankCodeLabel: 'Sort Code (6 digits) *',
    bankCodePlaceholder: 'e.g. 20-04-15 or 40-47-84',
    scannerTitle: 'SCAN OR TRANSFER VIA UK BANKING APP',
    scannerApps: 'Barclays • HSBC • Lloyds • NatWest • Monzo • Revolut',
    invoiceInstantLabel: 'Faster Payments',
    invoiceBankLabel: 'Bank Transfer (Faster Payments)',
    invoiceBankCodePrefix: 'Sort Code',
    defaultTaxLabel: 'VAT',
    invoiceTitle: 'VAT INVOICE & RECEIPT',
    estimateTitle: 'QUOTATION & CONTRACT AGREEMENT',
    legalSealedBadge: 'UK eIDAS Sealed',
    legalConsentCitation: 'the UK Electronic Communications Act 2000, Electronic Signatures Regulations 2002, and UK eIDAS Regulations',
    waiverTitle: 'FULL & FINAL SETTLEMENT DISCHARGE & RELEASE',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor discharges all liabilities under this contract and releases any and all claims, charges, or liens for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'ELECTRONIC SIGNATURE & AUDIT CERTIFICATE',
    auditGoverningStandard: 'UK Electronic Communications Act 2000 and Electronic Identification and Trust Services for Electronic Transactions (UK eIDAS).',
    businessIdLabel: 'Company Reg / VAT No.',
    businessIdPlaceholder: 'e.g. GB 123 4567 89',
    depositLabel: 'Deposit Paid',
    balanceDueLabel: 'Balance Due',
  },
  EU: {
    region: 'EU',
    regionName: 'Europe / Eurozone',
    locale: 'en-IE',
    instantRailLabel: '⚡ SEPA Instant Pay',
    instantRailName: 'SEPA Instant',
    instantIdLabel: 'Payee Reference / Virtual IBAN *',
    instantIdPlaceholder: 'e.g. contractor@europay.eu',
    bankRailLabel: '🏛️ Bank (SEPA / IBAN)',
    bankTitle: 'SEPA Credit Transfer (IBAN / BIC)',
    bankAccountLabel: 'IBAN (International Bank Account Number) *',
    bankAccountPlaceholder: 'e.g. DE89 3704 0044 0532 0130 00',
    bankCodeLabel: 'BIC / SWIFT Code',
    bankCodePlaceholder: 'e.g. DEUTDEDDFXX',
    scannerTitle: 'SEPA INSTANT BANK TRANSFER',
    scannerApps: 'Compatible with all SEPA-compliant European banking apps',
    invoiceInstantLabel: 'SEPA Instant',
    invoiceBankLabel: 'SEPA Bank Transfer',
    invoiceBankCodePrefix: 'BIC/SWIFT',
    defaultTaxLabel: 'VAT',
    invoiceTitle: 'TAX INVOICE & PAYMENT RECEIPT',
    estimateTitle: 'PROPOSAL & WORK AGREEMENT',
    legalSealedBadge: 'eIDAS Regulation Compliant',
    legalConsentCitation: 'EU Regulation No 910/2014 (eIDAS) on electronic identification and trust services for electronic transactions in the internal market',
    waiverTitle: 'CERTIFICATE OF DISCHARGE & FULL SETTLEMENT',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor confirms receipt in full and releases all contractual claims and property charges for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'eIDAS COMPLIANCE AUDIT CERTIFICATE',
    auditGoverningStandard: 'Regulation (EU) No 910/2014 (eIDAS) of the European Parliament and of the Council on electronic transactions in the internal market.',
    businessIdLabel: 'VAT / Tax ID Number',
    businessIdPlaceholder: 'e.g. DE123456789',
    depositLabel: 'Advance / Deposit Paid',
    balanceDueLabel: 'Balance Due',
  },
  CA: {
    region: 'CA',
    regionName: 'Canada',
    locale: 'en-CA',
    instantRailLabel: '⚡ Interac e-Transfer',
    instantRailName: 'Interac',
    instantIdLabel: 'Interac e-Transfer Email or Mobile *',
    instantIdPlaceholder: 'e.g. billing@apexservices.ca',
    bankRailLabel: '🏛️ Direct Deposit',
    bankTitle: 'Direct Deposit / Wire Details',
    bankAccountLabel: 'Account Number (7-12 digits) *',
    bankAccountPlaceholder: 'e.g. 1234567',
    bankCodeLabel: 'Transit & Institution No. *',
    bankCodePlaceholder: 'e.g. 12345-004 (Transit-Institution)',
    scannerTitle: 'INTERAC E-TRANSFER OR DIRECT DEPOSIT',
    scannerApps: 'RBC • TD • Scotiabank • BMO • CIBC • Desjardins',
    invoiceInstantLabel: 'Interac e-Transfer',
    invoiceBankLabel: 'Direct Deposit',
    invoiceBankCodePrefix: 'Transit',
    defaultTaxLabel: 'HST/GST',
    invoiceTitle: 'TAX INVOICE & RECEIPT',
    estimateTitle: 'ESTIMATE & SERVICE AGREEMENT',
    legalSealedBadge: 'PIPEDA / UECA Sealed',
    legalConsentCitation: 'the Personal Information Protection and Electronic Documents Act (PIPEDA) and Provincial Electronic Commerce Acts',
    waiverTitle: 'CONDITIONAL BUILDER\'S LIEN WAIVER & RELEASE',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor waives and releases any and all builder\'s lien, holdback, or bond claims for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'ELECTRONIC COMMERCE AUDIT CERTIFICATE',
    auditGoverningStandard: 'Personal Information Protection and Electronic Documents Act (PIPEDA) and Uniform Electronic Commerce Act (UECA).',
    businessIdLabel: 'Business / GST/HST Number',
    businessIdPlaceholder: 'e.g. 123456789 RT0001',
    depositLabel: 'Deposit Paid',
    balanceDueLabel: 'Balance Due',
  },
  AU: {
    region: 'AU',
    regionName: 'Australia',
    locale: 'en-AU',
    instantRailLabel: '⚡ PayID Instant Pay',
    instantRailName: 'PayID',
    instantIdLabel: 'PayID (Mobile, Email, or ABN) *',
    instantIdPlaceholder: 'e.g. 0412345678 or billing@contractor.com.au',
    bankRailLabel: '🏛️ Bank (BSB)',
    bankTitle: 'Direct Bank Transfer (BSB & Account)',
    bankAccountLabel: 'Account Number *',
    bankAccountPlaceholder: 'e.g. 1234 5678',
    bankCodeLabel: 'BSB Number (6 digits) *',
    bankCodePlaceholder: 'e.g. 082-001 or 063-000',
    scannerTitle: 'PAYID & OSKO INSTANT BANK TRANSFER',
    scannerApps: 'CommBank • ANZ • NAB • Westpac • Macquarie • All Osko Apps',
    invoiceInstantLabel: 'PayID',
    invoiceBankLabel: 'Bank Transfer (BSB)',
    invoiceBankCodePrefix: 'BSB',
    defaultTaxLabel: 'GST',
    invoiceTitle: 'TAX INVOICE & RECEIPT',
    estimateTitle: 'QUOTATION & TRADE CONTRACT',
    legalSealedBadge: 'ETA 1999 Sealed',
    legalConsentCitation: 'the Electronic Transactions Act 1999 (Cth) and relevant state Electronic Transactions legislation',
    waiverTitle: 'FINAL PAYMENT DISCHARGE & CLAIM RELEASE',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor acknowledges full payment and releases any rights under security of payment legislation, liens, or claims for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'ELECTRONIC TRANSACTIONS AUDIT CERTIFICATE',
    auditGoverningStandard: 'Electronic Transactions Act 1999 (Cth) and Electronic Transactions Regulations.',
    businessIdLabel: 'ABN / ACN Number',
    businessIdPlaceholder: 'e.g. ABN 12 345 678 901',
    depositLabel: 'Deposit Paid',
    balanceDueLabel: 'Balance Due',
  },
  GLOBAL: {
    region: 'GLOBAL',
    regionName: 'International',
    locale: 'en-US',
    instantRailLabel: '⚡ Instant QR Pay',
    instantRailName: 'Instant Pay',
    instantIdLabel: 'Receiving Payment ID / Virtual Address *',
    instantIdPlaceholder: 'e.g. contractor@bank, mobile@bank',
    bankRailLabel: '🏛️ Bank Transfer',
    bankTitle: 'Direct Bank Transfer / Wire Details',
    bankAccountLabel: 'Bank Account Number *',
    bankAccountPlaceholder: 'e.g. 1029384756',
    bankCodeLabel: 'Routing / Sort / SWIFT Code',
    bankCodePlaceholder: 'e.g. Routing Number or SWIFT Code',
    scannerTitle: 'SCAN WITH ANY CAMERA OR BANKING APP',
    scannerApps: 'Compatible with all major banking, wallet, and scan-to-pay apps',
    invoiceInstantLabel: 'Instant QR Pay',
    invoiceBankLabel: 'Bank Transfer',
    invoiceBankCodePrefix: 'Code',
    defaultTaxLabel: 'Tax',
    invoiceTitle: 'INVOICE & RECEIPT',
    estimateTitle: 'ESTIMATE & AGREEMENT',
    legalSealedBadge: 'Digitally Sealed & Certified',
    legalConsentCitation: 'applicable electronic commerce, contract, and digital transaction laws',
    waiverTitle: 'FULL SATISFACTION & RELEASE OF CLAIMS',
    waiverBodyText: 'Upon final clearance of settlement funds in the amount of {AMOUNT}, contractor acknowledges full satisfaction and releases any and all claims or liens for labor and materials furnished through {DATE}.',
    auditCertificateTitle: 'DIGITAL TRANSACTION AUDIT CERTIFICATE',
    auditGoverningStandard: 'UNCITRAL Model Law on Electronic Signatures and applicable international electronic transaction standards.',
    businessIdLabel: 'Tax ID / Business Registration',
    businessIdPlaceholder: 'e.g. Tax Registration ID',
    depositLabel: 'Deposit / Advance Paid',
    balanceDueLabel: 'Balance Due',
  },
};

export class RegionPaymentService {
  /**
   * Identifies the payment region based on currency code and symbol.
   */
  public static detectRegion(currencyCode?: string, currencySymbol?: string): PaymentRegion {
    const code = (currencyCode || '').trim().toUpperCase();
    const symbol = (currencySymbol || '').trim();

    if (code === 'INR' || symbol === '₹') return 'IN';
    if (code === 'USD' || (code === '' && symbol === '$')) return 'US';
    if (code === 'GBP' || symbol === '£') return 'GB';
    if (code === 'EUR' || symbol === '€') return 'EU';
    if (code === 'CAD' || symbol === 'CA$') return 'CA';
    if (code === 'AUD' || symbol === 'A$') return 'AU';

    return 'GLOBAL';
  }

  /**
   * Retrieves the comprehensive regional configuration.
   */
  public static getConfig(currencyCode?: string, currencySymbol?: string): RegionPaymentConfig {
    const region = this.detectRegion(currencyCode, currencySymbol);
    return REGION_CONFIGS[region] || REGION_CONFIGS.GLOBAL;
  }

  /**
   * Formats the payment accounts and instructions for PDF contracts / invoices.
   */
  public static formatInvoicePaymentAccounts(
    profile: ContractorProfile,
    currencySymbol?: string,
    currencyCode?: string
  ): string {
    const config = this.getConfig(currencyCode || profile.currencyCode, currencySymbol || profile.currencySymbol);

    // If contractor set custom label override
    const instantLabel = profile.customPaymentLabel || config.invoiceInstantLabel;
    const bankLabel = config.invoiceBankLabel;

    const parts: string[] = [];

    // Instant rail (UPI in IN, Zelle in US, Interac in CA, PayID in AU, etc.)
    if (profile.upiId) {
      const payeeTag = profile.upiPayeeName ? ` [${escapeHtml(profile.upiPayeeName)}]` : '';
      parts.push(`${instantLabel}: ${escapeHtml(profile.upiId)}${payeeTag}`);
    }

    // Direct Bank Rail
    if (profile.bankAccountNumber) {
      let bankStr = `${bankLabel}: A/C: ${escapeHtml(profile.bankAccountNumber)}`;
      if (profile.bankIfsc) {
        bankStr += ` (${config.invoiceBankCodePrefix}: ${escapeHtml(profile.bankIfsc)})`;
      }
      if (profile.bankName) {
        bankStr += ` - ${escapeHtml(profile.bankName)}`;
      }
      parts.push(bankStr);
    }

    // US rails if present and applicable
    if (profile.zelleAccount && config.region !== 'IN') {
      parts.push(`Zelle: ${escapeHtml(profile.zelleAccount)}`);
    }
    if (profile.venmoAccount && config.region !== 'IN') {
      parts.push(`Venmo: ${escapeHtml(profile.venmoAccount)}`);
    }
    if (profile.cashAppAccount && config.region !== 'IN') {
      parts.push(`CashApp: ${escapeHtml(profile.cashAppAccount)}`);
    }

    return parts.filter(Boolean).join('  •  ');
  }

  /**
   * Official list of 37 Indian States and Union Territories with standard 2-digit GST codes.
   */
  public static readonly INDIAN_GST_STATES: { code: string; name: string }[] = [
    { code: '01', name: 'Jammu & Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '28', name: 'Andhra Pradesh (Old)' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman & Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh (New)' },
    { code: '38', name: 'Ladakh' },
  ];

  /**
   * Top trade contractor service presets for the Indian market in INR (₹).
   */
  public static readonly INDIAN_TRADE_PRESETS = [
    { title: 'Electrical Wiring (Per Point)', priceCents: 25000, category: 'Labor', hsnSac: '9954', unit: 'pts' },
    { title: 'Switchboard / Socket Installation', priceCents: 35000, category: 'Labor', hsnSac: '9954', unit: 'nos' },
    { title: 'Ceiling Fan / Exhaust Fitting', priceCents: 30000, category: 'Labor', hsnSac: '9954', unit: 'nos' },
    { title: 'MCB / Distribution Board Repair', priceCents: 120000, category: 'Diagnostic', hsnSac: '9954', unit: 'set' },
    { title: 'Inverter & Battery Wiring Setup', priceCents: 150000, category: 'Labor', hsnSac: '9954', unit: 'set' },
    { title: 'Plumbing Leakage & Pipe Joint Repair', priceCents: 65000, category: 'Diagnostic', hsnSac: '9954', unit: 'nos' },
    { title: 'Tap / Cock / Bib Cock Replacement', priceCents: 30000, category: 'Labor', hsnSac: '9954', unit: 'nos' },
    { title: 'Water Tank Fitting & Valve Setup', priceCents: 180000, category: 'Labor', hsnSac: '9954', unit: 'set' },
    { title: 'Wall Putty & Primer Coat (Per Sq.Ft)', priceCents: 1200, category: 'Labor', hsnSac: '9954', unit: 'sq.ft' },
    { title: 'Interior Emulsion Painting 2 Coats (Per Sq.Ft)', priceCents: 1800, category: 'Labor', hsnSac: '9954', unit: 'sq.ft' },
    { title: 'AC General Service & Jet Wash', priceCents: 80000, category: 'Diagnostic', hsnSac: '9987', unit: 'nos' },
    { title: 'AC Gas Charging & Refrigerant Top-up', priceCents: 220000, category: 'Parts', hsnSac: '8415', unit: 'kg' },
    { title: 'Door Lock / Handle Fitting & Repair', priceCents: 45000, category: 'Labor', hsnSac: '9954', unit: 'nos' },
    { title: 'Bathroom Tile Laying (Per Sq.Ft)', priceCents: 3500, category: 'Labor', hsnSac: '9954', unit: 'sq.ft' },
    { title: 'Granite Countertop Cutting & Fitting', priceCents: 250000, category: 'Labor', hsnSac: '9954', unit: 'sq.ft' },
  ];

  /**
   * Standard Indian commercial trade Terms & Conditions preset.
   */
  public static readonly INDIAN_STANDARD_TERMS = `1. Goods & services once supplied/installed are deemed accepted upon test run.
2. Advance/bayaana received is non-refundable upon commencement of work.
3. Balance payment due immediately upon invoice submission.
4. Interest @ 18% per annum will be charged on all delayed dues beyond agreed credit period.
5. Material warranty is governed directly by original manufacturer policies.
6. All disputes subject to local jurisdiction only.`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
