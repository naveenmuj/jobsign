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
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
