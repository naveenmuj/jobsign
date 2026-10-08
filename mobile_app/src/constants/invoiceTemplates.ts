export type InvoiceTemplateId = 'modern' | 'classic' | 'minimal' | 'contractor';

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
    id: 'modern',
    name: 'Modern Navy',
    subtitle: 'Clean & Contemporary',
    badge: 'Popular',
    tagline: 'Balanced, modern & versatile',
    description: 'Slate navy headers, rounded pill badges, soft card grids, and crisp itemized tables.',
    primaryColor: '#0F172A',
    accentColor: '#2563EB',
    fontFamilyName: 'Inter / System Sans',
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
  {
    id: 'minimal',
    name: 'Minimal Clean',
    subtitle: 'Monochrome Swiss',
    badge: 'Ultra Clean',
    tagline: 'High whitespace & stark clarity',
    description: 'Swiss-inspired monochrome layout, fine 1px hairlines, pure black contrast, and zero clutter.',
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
];
