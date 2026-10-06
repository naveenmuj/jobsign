export type QuoteStatus = 'DRAFT' | 'SIGNED_LOCKED' | 'PAID' | 'CANCELLED';

export interface LineItem {
  id: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
}

export interface ItemPreset {
  id: string;
  title: string;
  priceCents: number;
  category: 'Labor' | 'Parts' | 'Diagnostic' | 'Common';
}

export interface Quote {
  id: string;
  quoteNumber: number;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  status: QuoteStatus;
  subtotalCents: number;
  taxRateBasisPoints: number; // e.g. 825 for 8.25%
  taxAmountCents: number;
  totalAmountCents: number;
  notes?: string;
  signatureSvg?: string;
  signatureTimestamp?: number;
  signatureGpsLat?: number;
  signatureGpsLng?: number;
  pdfSha256Hash?: string;
  createdAt: number;
  updatedAt: number;
  lineItems: LineItem[];
}
