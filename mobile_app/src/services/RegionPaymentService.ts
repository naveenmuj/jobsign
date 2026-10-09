import { ContractorProfile } from '../types';

export type PaymentRegion = 'IN' | 'US' | 'GB' | 'EU' | 'CA' | 'AU' | 'GLOBAL';

export interface RegionPaymentConfig {
  region: PaymentRegion;
  regionName: string;
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
}

const REGION_CONFIGS: Record<PaymentRegion, RegionPaymentConfig> = {
  IN: {
    region: 'IN',
    regionName: 'India',
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
  },
  US: {
    region: 'US',
    regionName: 'United States',
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
  },
  GB: {
    region: 'GB',
    regionName: 'United Kingdom',
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
  },
  EU: {
    region: 'EU',
    regionName: 'Europe / Eurozone',
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
  },
  CA: {
    region: 'CA',
    regionName: 'Canada',
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
  },
  AU: {
    region: 'AU',
    regionName: 'Australia',
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
  },
  GLOBAL: {
    region: 'GLOBAL',
    regionName: 'International',
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
