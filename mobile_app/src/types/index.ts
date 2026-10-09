export type QuoteStatus = 'DRAFT' | 'SIGNED_LOCKED' | 'INVOICED' | 'PAID' | 'CANCELLED';

export interface LineItem {
  id: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
}

export interface ChangeOrder {
  id: string;
  quoteId: string;
  orderNumber: number; // e.g. 1, 2
  reason: string;      // e.g. "Discovered rotted subfloor beneath kitchen sink"
  addedItems: LineItem[];
  addedTotalCents: number;
  signatureSvg: string;
  signatureTimestamp: number;
  pdfSha256Hash: string;
}

export interface ItemPreset {
  id: string;
  title: string;
  priceCents: number;
  category: 'Diagnostic' | 'Labor' | 'Parts' | 'Common';
  iconName?: string;
}

import { InvoiceTemplateId } from '../constants/invoiceTemplates';
export { InvoiceTemplateId, InvoiceTemplateOption } from '../constants/invoiceTemplates';

export interface NotificationPreferences {
  outboxAlerts: boolean;       // Alerts when offline outbox dispatches upon reconnection
  sealConfirmations: boolean;  // Alerts when client signs & cryptographic seal locks
  paymentReminders: boolean;   // Polite reminders for uncollected signed estimates
}

export interface SavedBankAccount {
  id: string;
  accountNumber: string;
  bankName?: string;
  ifscOrRouting?: string;
  beneficiaryName?: string;
}

export interface SavedUpiAccount {
  id: string;
  upiId: string;
  payeeName?: string;
}

export interface ContractorProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;             // Shop/Company physical address or service area
  logoUri?: string;             // Shop logo image path/URI
  licenseNumber?: string;
  zelleAccount?: string;
  venmoAccount?: string;
  cashAppAccount?: string;
  upiId?: string;               // e.g. "contractor@bank" or virtual payment address
  upiPayeeName?: string;        // e.g. "Apex Electricals" or registered owner name
  bankAccountNumber?: string;   // Direct bank account number
  bankIfsc?: string;            // Bank routing / IFSC / sort code
  bankName?: string;            // Bank Name (e.g. "HDFC Bank", "SBI")
  savedBankAccounts?: SavedBankAccount[]; // Multiple saved bank accounts
  savedUpiAccounts?: SavedUpiAccount[];   // Multiple saved UPI / instant payment IDs
  defaultTaxBasisPoints: number; // e.g. 825 for 8.25%
  taxEnabledByDefault?: boolean; // whether tax is enabled by default on new quotes
  taxLabel?: string;             // e.g. "Sales Tax", "VAT", "GST", "HST"
  isOnboardingCompleted?: boolean; // whether onboarding was completed or dismissed
  hasCustomBusinessName?: boolean; // whether user explicitly set or confirmed their business name
  invoiceTemplate?: InvoiceTemplateId; // preferred PDF template format ('modern', 'classic', 'minimal', 'contractor')
  notificationPreferences?: NotificationPreferences; // user notification preferences
  currencySymbol?: string;      // e.g. "₹", "$", "£", "€", "CA$", "A$"
  currencyCode?: string;        // e.g. "INR", "USD", "GBP", "EUR"
  customPaymentLabel?: string;  // user-defined custom payment label (e.g. "Direct Transfer", "Bank Wire")
  customPaymentNote?: string;   // user-defined payment instructions printed on invoices
}

export interface Quote {
  id: string;
  quoteNumber: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  jobDescription?: string;
  notes?: string;
  status: QuoteStatus;
  subtotalCents: number;
  taxRateBasisPoints: number; // e.g. 825 for 8.25%, 0 if disabled
  taxAmountCents: number;
  totalAmountCents: number;
  taxLabel?: string;          // e.g. "Sales Tax", "VAT", "GST"
  currencySymbol?: string;    // Currency symbol used when created (e.g. "₹", "$")
  photoUri?: string;          // On-site damage proof / initial condition photo
  completedPhotoUri?: string; // Post-work proof / completion verification photo
  includePhotoInPdf?: boolean; // Whether worksite photo is attached as Exhibit A to PDF invoice
  invoiceIssuedTimestamp?: number; // Timestamp when estimate was converted to invoice
  signatureSvg?: string;
  signatureTimestamp?: number;
  signatureGpsLat?: number;
  signatureGpsLng?: number;
  pdfSha256Hash?: string;
  createdAt: number;
  updatedAt: number;
  lineItems: LineItem[];
  changeOrders?: ChangeOrder[];
}

export interface OutboxItem {
  id: string;
  quoteId: string;
  clientName: string;
  recipientContact: string;
  channel: 'SMS' | 'EMAIL' | 'SHARE';
  createdAt: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage?: string;
}

export type TelemetryCategory =
  | 'APP_LIFECYCLE'
  | 'SCREEN_VIEW'
  | 'USER_ACTION'
  | 'JOB_EVENT'
  | 'PDF_EVENT'
  | 'SETTINGS_CHANGE'
  | 'NETWORK'
  | 'ERROR';

export interface BehaviorLogEntry {
  id: string;
  sessionId: string;
  category: TelemetryCategory;
  action: string;
  screenName?: string;
  payloadJson?: string;
  timestamp: number;
  synced: boolean;
}
