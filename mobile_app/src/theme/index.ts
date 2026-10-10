/**
 * JobSign Design System
 * Modern financial & field-service invoice design system.
 * Default mode: Clean, high-trust Light Mode with crisp typography, subtle slate borders,
 * and high-contrast accessibility for outdoor job sites.
 */

export interface ThemeColors {
  // Backgrounds & Surfaces
  background: string;
  backgroundSecondary: string;
  surface: string;
  card: string;
  cardElevated: string;
  cardBorder: string;
  cardBorderActive: string;

  // Core Brand Accent
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;

  // Status & Pills (Solid + Tint Pairs)
  emerald: string;
  successLight: string;
  amber: string;
  warningLight: string;
  rose: string;
  roseLight: string;
  purple: string;
  purpleLight: string;
  slateInfo: string;
  slateInfoLight: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textHighlight: string;

  // Signature Canvas
  canvasBg: string;
  canvasBorder: string;
  signatureInk: string;

  // Modal Overlay
  overlay: string;
}

export const LightColors: ThemeColors = {
  // Backgrounds & Surfaces
  background: '#F8FAFC',          // Slate-50 soft modern canvas
  backgroundSecondary: '#F1F5F9', // Slate-100 section wells and input fills
  surface: '#FFFFFF',             // Pure white
  card: '#FFFFFF',                // Clean elevated cards
  cardElevated: '#FFFFFF',
  cardBorder: '#E2E8F0',          // Slate-200 crisp border
  cardBorderActive: '#2563EB',    // Royal Blue active border

  // Core Brand Accent
  primary: '#2563EB',             // Royal Blue 600 (Square/Stripe caliber)
  primaryLight: '#EFF6FF',        // Blue-50 subtle wash
  primaryDark: '#1D4ED8',         // Blue-700 pressed state
  accent: '#2563EB',
  accentLight: '#EFF6FF',

  // Status & Pills
  emerald: '#059669',             // Emerald-600 (Paid / Complete)
  successLight: '#ECFDF5',        // Emerald-50
  amber: '#D97706',               // Amber-600 (Awaiting Payment / Pending)
  warningLight: '#FFFBEB',        // Amber-50
  rose: '#DC2626',                // Red-600 (Overdue / Destructive)
  roseLight: '#FEF2F2',           // Red-50
  purple: '#7C3AED',              // Violet-600 (Change Orders)
  purpleLight: '#F5F3FF',         // Violet-50
  slateInfo: '#475569',           // Slate-600 (Draft / Neutral)
  slateInfoLight: '#F1F5F9',      // Slate-100

  // Borders & Dividers
  border: '#E2E8F0',              // Slate-200
  borderSubtle: '#F1F5F9',        // Slate-100

  // Typography
  textPrimary: '#0F172A',         // Slate-900 rich charcoal
  textSecondary: '#475569',       // Slate-600 balanced body text
  textMuted: '#94A3B8',           // Slate-400 placeholders, subtle captions
  textInverse: '#FFFFFF',         // Pure White on solid buttons
  textHighlight: '#2563EB',       // Inline links & active numbers

  // Signature Canvas
  canvasBg: '#FFFFFF',
  canvasBorder: '#CBD5E1',        // Slate-300
  signatureInk: '#0F172A',

  // Modal Overlay
  overlay: 'rgba(15, 23, 42, 0.45)', // Dark translucent backdrop for light sheets
};

export const DarkColors: ThemeColors = {
  // Backgrounds & Surfaces
  background: '#0B0F19',          // Deep Obsidian Space
  backgroundSecondary: '#111827', // Slate-900
  surface: '#1E293B',             // Elevated Slate-800
  card: '#1E293B',
  cardElevated: '#334155',
  cardBorder: '#334155',
  cardBorderActive: '#3B82F6',

  // Core Brand Accent
  primary: '#3B82F6',
  primaryLight: 'rgba(59, 130, 246, 0.25)',
  primaryDark: '#2563EB',
  accent: '#3B82F6',
  accentLight: 'rgba(59, 130, 246, 0.25)',

  // Status & Pills - Enhanced Alphas & Tones for WCAG AA (>= 4.5:1)
  emerald: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.25)',
  amber: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.25)',
  rose: '#F43F5E',
  roseLight: 'rgba(244, 63, 94, 0.25)',
  purple: '#8B5CF6',
  purpleLight: 'rgba(139, 92, 246, 0.25)',
  slateInfo: '#CBD5E1',             // Crisp Slate-200 for high-contrast on dark surface
  slateInfoLight: 'rgba(203, 213, 225, 0.15)',

  // Borders & Dividers
  border: '#334155',
  borderSubtle: '#1E293B',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',         // Enhanced for WCAG AA outdoor contrast
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  textHighlight: '#38BDF8',

  // Signature Canvas
  canvasBg: '#FFFFFF',
  canvasBorder: '#475569',
  signatureInk: '#0F172A',

  // Modal Overlay
  overlay: 'rgba(11, 15, 25, 0.88)',
};

/**
 * Sunlight Mode: Maximum-contrast outdoor palette designed for bright direct sunlight.
 */
export const SunlightColors: ThemeColors = {
  ...LightColors,
  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#1E293B',
  border: '#0F172A',
  textPrimary: '#000000',           // Maximum opacity black
  textSecondary: '#1E293B',         // Deep charcoal for high outdoor visibility
  textMuted: '#475569',
  primary: '#1D4ED8',               // Saturated deep royal blue
  primaryLight: 'rgba(29, 78, 216, 0.15)',
};

export const Theme = {
  colors: LightColors, // Default is Light Mode

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 28,
  },

  touchTarget: {
    minHeight: 52, // Ergonomic 52dp touch target
  },

  borderRadius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardRaised: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
    },
    primaryBtn: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? DarkColors : LightColors;
};
