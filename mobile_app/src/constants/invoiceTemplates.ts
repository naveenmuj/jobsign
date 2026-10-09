export type InvoiceTemplateId = 'advanced_gst' | 'tally' | 'modern' | 'minimal' | 'classic' | 'contractor';

export interface InvoiceTemplateOption {
  id: InvoiceTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  fontFamilyName: string;
  tagline: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplateOption[] = [
  {
    id: 'advanced_gst',
    name: 'Advanced GST',
    subtitle: 'Enterprise GST & Trade Layout',
    badge: 'India Standard',
    tagline: 'Itemized HSN/SAC, Unit rates & Tax breakups',
    description: 'Detailed GST format with dedicated HSN/SAC codes, trade units (sq.ft/nos/mtr), CGST & SGST breakups, vector UPI QR and statutory declaration.',
    primaryColor: '#0F766E',
    accentColor: '#059669',
    fontFamilyName: 'Inter / System Sans',
  },
  {
    id: 'tally',
    name: 'Tally Accounting',
    subtitle: 'Classic Boxed Ledger',
    badge: 'CA Compliant',
    tagline: 'Bordered accounting ledger & declaration',
    description: 'Crisp grid-bordered layout favored by Indian accountants, formal supplier/buyer boxes, Rule 46 words and authorized signatory stamp box.',
    primaryColor: '#1E293B',
    accentColor: '#334155',
    fontFamilyName: 'Courier / System Sans',
  },
  {
    id: 'modern',
    name: 'Modern Executive',
    subtitle: 'Clean & Contemporary',
    badge: 'Popular',
    tagline: 'Balanced, modern & versatile',
    description: 'Slate navy headers, rounded pill badges, soft card grids, and crisp itemized tables.',
    primaryColor: '#0F172A',
    accentColor: '#2563EB',
    fontFamilyName: 'Inter / System Sans',
  },
  {
    id: 'minimal',
    name: 'Compact & Ink Saver',
    subtitle: 'Single-Sheet Thermal & A4',
    badge: 'Ink Saver',
    tagline: 'High whitespace & stark clarity',
    description: 'Swiss monochrome layout, fine hairlines, zero ink waste, optimized for mobile thermal and standard office A4 printers.',
    primaryColor: '#000000',
    accentColor: '#475569',
    fontFamilyName: 'Helvetica / Sans-Serif',
  },
  {
    id: 'contractor',
    name: 'Industrial Trade',
    subtitle: 'High-Impact Trades',
    badge: 'Trades',
    tagline: 'Rugged jobsite & contractor look',
    description: 'Dark charcoal header with safety amber strip, bold block typography, and high-visibility total banner.',
    primaryColor: '#18181B',
    accentColor: '#D97706',
    fontFamilyName: 'Heavy Industrial Sans',
  },
  {
    id: 'classic',
    name: 'Classic Executive',
    subtitle: 'Formal Serif & Legal',
    badge: 'Executive',
    tagline: 'Distinguished high-end letterhead',
    description: 'Timeless serif typography, double accounting borders, formal headers, and refined bordeaux accents.',
    primaryColor: '#1E293B',
    accentColor: '#831843',
    fontFamilyName: 'Georgia / Times Serif',
  },
];
