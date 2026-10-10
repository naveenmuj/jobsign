export type QuoteStatus = 'DRAFT' | 'SIGNED_LOCKED' | 'INVOICED' | 'PAID' | 'CANCELLED';

export interface LineItem {
  id: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  hsnSac?: string;         // e.g. '9954', '8536'
  unit?: string;           // e.g. 'nos', 'sq.ft', 'mtr', 'pts', 'hrs', 'kg', 'set', 'box'
  discountPercent?: number;// e.g. 5 for 5% trade discount
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
  hsnSac?: string;
  unit?: string;
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
  taxIdNumber?: string;         // Business Tax ID / GSTIN (India) / Contractor License & EIN (US)
  stateCode?: string;           // Indian GST State & Code (e.g. "29 - Karnataka")
  isGstSplitEnabled?: boolean;  // Whether intra-state CGST + SGST split is active
  defaultInvoiceType?: 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE'; // Default document title
  showHsnSac?: boolean;         // Whether to show HSN/SAC code input on line items (default: false)
  region?: 'IN' | 'US' | 'GB' | 'EU' | 'CA' | 'AU' | 'GLOBAL'; // Explicit market/region mode ('US' or 'IN' or global)
  checkPayableTo?: string;      // US check payee (e.g. "Apex Contracting LLC")
  backupSettings?: BackupSettings; // Cloud Drive and local backup configuration
}

export interface BackupSettings {
  autoBackupEnabled: boolean;          // Automatically backup when new invoice/quote is created
  backupTarget: 'DRIVE_SAF' | 'SHARE_SHEET' | 'LOCAL_VAULT'; // Target destination
  driveFolderUri?: string;              // Selected Google Drive / OneDrive SAF folder URI
  driveFolderName?: string;             // Human-readable folder name (e.g. "Google Drive / JobSign Backups")
  driveMasterFileUri?: string;          // Persistent URI of the single cloud master backup file
  lastBackupTimestamp?: number;        // When the last backup was successfully created
  lastBackupInvoiceCount?: number;     // How many invoices were backed up
  lastBackupSizeBytes?: number;        // Size of the backup file in bytes
}

export interface JobSignBackupPayload {
  app: 'JobSign';
  schemaVersion: number;
  exportedAt: number;
  appVersion: string;
  devicePlatform: string;
  contractorProfile: ContractorProfile;
  quotes: Quote[];
  presets: ItemPreset[];
  metadata: {
    totalQuotes: number;
    businessName: string;
    totalRevenueCents: number;
    checksum?: string;
  };
}

export interface BackupPreview {
  valid: boolean;
  businessName: string;
  invoiceCount: number;
  presetCount: number;
  exportedAt: number;
  appVersion: string;
  totalRevenueCents: number;
  currencySymbol: string;
  payload: JobSignBackupPayload;
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
  photoSha256?: string;       // SHA-256 hash of worksite photo byte content
  completedPhotoUri?: string; // Post-work proof / completion verification photo
  completedPhotoSha256?: string; // SHA-256 hash of completed work photo byte content
  includePhotoInPdf?: boolean; // Whether worksite photo is attached as Exhibit A to PDF invoice
  invoiceIssuedTimestamp?: number; // Timestamp when estimate was converted to invoice
  paymentTerms?: string;       // e.g. 'DUE_ON_RECEIPT', 'NET_7', 'NET_15', 'NET_30', 'CUSTOM'
  dueDateTimestamp?: number;   // Expected payment due date timestamp
  depositAmountCents?: number; // Advance / deposit already collected
  documentType?: 'TAX_INVOICE' | 'BILL_OF_SUPPLY' | 'ESTIMATE' | 'DELIVERY_CHALLAN'; // Document title
  placeOfSupply?: string;      // Place of supply / client state code (e.g. "29 - Karnataka")
  isGstSplit?: boolean;        // Split into CGST + SGST (intra-state) vs IGST (inter-state)
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
