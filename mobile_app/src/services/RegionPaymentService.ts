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
   * Identifies the payment region based on currency code, symbol, or explicit profile region.
   */
  public static detectRegion(currencyCode?: string, currencySymbol?: string, explicitRegion?: string): PaymentRegion {
    if (explicitRegion === 'IN' || explicitRegion === 'US' || explicitRegion === 'GB' || explicitRegion === 'EU' || explicitRegion === 'CA' || explicitRegion === 'AU') {
      return explicitRegion as PaymentRegion;
    }
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
  public static getConfig(currencyCode?: string, currencySymbol?: string, explicitRegion?: string): RegionPaymentConfig {
    const region = this.detectRegion(currencyCode, currencySymbol, explicitRegion);
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
    const config = this.getConfig(currencyCode || profile.currencyCode, currencySymbol || profile.currencySymbol, profile.region);

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
    if (profile.checkPayableTo && config.region !== 'IN') {
      parts.push(`Check: Make payable to ${escapeHtml(profile.checkPayableTo)}`);
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

  /**
   * Top trade contractor service presets for the US market in USD ($).
   * Modeled after top field service contractor applications (Joist / Jobber).
   */
  public static readonly US_TRADE_PRESETS = [
    { title: 'Diagnostic & Service Call', priceCents: 9500, category: 'Diagnostic', unit: 'trip' },
    { title: 'Master Electrician Hourly Labor', priceCents: 12500, category: 'Labor', unit: 'hrs' },
    { title: '200-Amp Main Service Panel Upgrade', priceCents: 285000, category: 'Parts', unit: 'ea' },
    { title: 'Type 2 Whole-Home Surge Protector (SPD)', priceCents: 42500, category: 'Parts', unit: 'ea' },
    { title: 'Dedicated 240V EV Charger Circuit (50A)', priceCents: 85000, category: 'Labor', unit: 'ea' },
    { title: 'GFCI Receptacle Installation', priceCents: 15000, category: 'Parts', unit: 'ea' },
    { title: 'Plumbing Diagnostic & Leak Repair', priceCents: 22500, category: 'Diagnostic', unit: 'ea' },
    { title: 'Water Heater Replacement (50 Gallon)', priceCents: 195000, category: 'Parts', unit: 'ea' },
    { title: 'Garbage Disposal Replacement', priceCents: 32500, category: 'Parts', unit: 'ea' },
    { title: 'HVAC Seasonal Inspection & Tune-Up', priceCents: 14900, category: 'Diagnostic', unit: 'system' },
    { title: 'A/C Capacitor & Contactor Replacement', priceCents: 28500, category: 'Parts', unit: 'ea' },
    { title: 'Drywall Patch & Texture Matching', priceCents: 27500, category: 'Labor', unit: 'sq ft' },
    { title: 'Interior Paint & Trim Prep (Per Sq.Ft)', priceCents: 350, category: 'Labor', unit: 'sq ft' },
    { title: 'Hardwood / LVP Flooring Installation', priceCents: 450, category: 'Labor', unit: 'sq ft' },
    { title: 'Rough-In Framing & Structural Repair', priceCents: 8500, category: 'Labor', unit: 'linear ft' },
  ];

  /**
   * Standard US Trade Contractor Agreement & Legal Terms (Joist / UETA / Mechanics Lien Standard).
   */
  public static readonly US_STANDARD_TERMS = `1. Payment Schedule: Balance is due upon completion or per agreed Net terms. A late charge of 1.5% per month (18% per annum) applies to overdue balances.
2. Scope & Change Orders: Any alteration or deviation from specified scope involving extra labor or materials will be executed only upon written change order agreement.
3. Mechanics Lien Notice: Under applicable state mechanics' lien laws, contractor reserves all statutory lien rights on improved property until full and final payment is cleared.
4. Conditional Lien Waiver: Contractor shall furnish a formal Conditional/Unconditional Lien Waiver and Release upon receipt and clearance of final payment.
5. 1-Year Workmanship Warranty: All labor performed is warrantied for twelve (12) months from completion date. Manufacturer warranties apply directly to all materials and fixtures.
6. Homeowner Right of Rescission: Homeowner acknowledges receiving notice of the right to cancel within three (3) business days where required by state home solicitation laws.
7. Permits & Site Access: Homeowner supplies unobstructed access to jobsite, electricity, and water. Contractor coordinates required municipal permits and inspections.`;

  /**
   * Major US States with standard State Sales Tax rates.
   */
  public static readonly US_STATES: { code: string; name: string; standardTaxRate: string }[] = [
    { code: 'AL', name: 'Alabama', standardTaxRate: '4.00' },
    { code: 'AK', name: 'Alaska', standardTaxRate: '0.00' },
    { code: 'AZ', name: 'Arizona', standardTaxRate: '5.60' },
    { code: 'AR', name: 'Arkansas', standardTaxRate: '6.50' },
    { code: 'CA', name: 'California', standardTaxRate: '7.25' },
    { code: 'CO', name: 'Colorado', standardTaxRate: '2.90' },
    { code: 'CT', name: 'Connecticut', standardTaxRate: '6.35' },
    { code: 'DE', name: 'Delaware', standardTaxRate: '0.00' },
    { code: 'FL', name: 'Florida', standardTaxRate: '6.00' },
    { code: 'GA', name: 'Georgia', standardTaxRate: '4.00' },
    { code: 'HI', name: 'Hawaii', standardTaxRate: '4.00' },
    { code: 'ID', name: 'Idaho', standardTaxRate: '6.00' },
    { code: 'IL', name: 'Illinois', standardTaxRate: '6.25' },
    { code: 'IN', name: 'Indiana', standardTaxRate: '7.00' },
    { code: 'IA', name: 'Iowa', standardTaxRate: '6.00' },
    { code: 'KS', name: 'Kansas', standardTaxRate: '6.50' },
    { code: 'KY', name: 'Kentucky', standardTaxRate: '6.00' },
    { code: 'LA', name: 'Louisiana', standardTaxRate: '4.45' },
    { code: 'ME', name: 'Maine', standardTaxRate: '5.50' },
    { code: 'MD', name: 'Maryland', standardTaxRate: '6.00' },
    { code: 'MA', name: 'Massachusetts', standardTaxRate: '6.25' },
    { code: 'MI', name: 'Michigan', standardTaxRate: '6.00' },
    { code: 'MN', name: 'Minnesota', standardTaxRate: '6.875' },
    { code: 'MS', name: 'Mississippi', standardTaxRate: '7.00' },
    { code: 'MO', name: 'Missouri', standardTaxRate: '4.225' },
    { code: 'MT', name: 'Montana', standardTaxRate: '0.00' },
    { code: 'NE', name: 'Nebraska', standardTaxRate: '5.50' },
    { code: 'NV', name: 'Nevada', standardTaxRate: '6.85' },
    { code: 'NH', name: 'New Hampshire', standardTaxRate: '0.00' },
    { code: 'NJ', name: 'New Jersey', standardTaxRate: '6.625' },
    { code: 'NM', name: 'New Mexico', standardTaxRate: '5.125' },
    { code: 'NY', name: 'New York', standardTaxRate: '8.875' },
    { code: 'NC', name: 'North Carolina', standardTaxRate: '4.75' },
    { code: 'ND', name: 'North Dakota', standardTaxRate: '5.00' },
    { code: 'OH', name: 'Ohio', standardTaxRate: '5.75' },
    { code: 'OK', name: 'Oklahoma', standardTaxRate: '4.50' },
    { code: 'OR', name: 'Oregon', standardTaxRate: '0.00' },
    { code: 'PA', name: 'Pennsylvania', standardTaxRate: '6.00' },
    { code: 'RI', name: 'Rhode Island', standardTaxRate: '7.00' },
    { code: 'SC', name: 'South Carolina', standardTaxRate: '6.00' },
    { code: 'SD', name: 'South Dakota', standardTaxRate: '4.50' },
    { code: 'TN', name: 'Tennessee', standardTaxRate: '7.00' },
    { code: 'TX', name: 'Texas', standardTaxRate: '8.25' },
    { code: 'UT', name: 'Utah', standardTaxRate: '6.10' },
    { code: 'VT', name: 'Vermont', standardTaxRate: '6.00' },
    { code: 'VA', name: 'Virginia', standardTaxRate: '5.30' },
    { code: 'WA', name: 'Washington', standardTaxRate: '6.50' },
    { code: 'WV', name: 'West Virginia', standardTaxRate: '6.00' },
    { code: 'WI', name: 'Wisconsin', standardTaxRate: '5.00' },
    { code: 'WY', name: 'Wyoming', standardTaxRate: '4.00' },
  ];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
