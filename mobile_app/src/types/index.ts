export type QuoteStatus = 'DRAFT' | 'SIGNED_LOCKED' | 'PAID' | 'CANCELLED';

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

export interface ContractorProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  licenseNumber?: string;
  zelleAccount?: string;
  venmoAccount?: string;
  cashAppAccount?: string;
  defaultTaxBasisPoints: number; // e.g. 825 for 8.25%
}

export interface Quote {
  id: string;
  quoteNumber: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  jobDescription?: string;
  status: QuoteStatus;
  subtotalCents: number;
  taxRateBasisPoints: number; // e.g. 825 for 8.25%
  taxAmountCents: number;
  totalAmountCents: number;
  notes?: string;
  photoUri?: string;          // On-site damage proof photo
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
