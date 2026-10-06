export const Theme = {
  colors: {
    // Rich Dark Backgrounds & Contrast Surfaces
    background: '#0B0F19',        // Deep Obsidian Space
    backgroundSecondary: '#111827',
    card: '#1E293B',              // Elevated Slate Card
    cardElevated: '#334155',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardBorderActive: '#3B82F6',

    // Core Brand Accents
    primary: '#3B82F6',           // Bright Electric Blue
    primaryGlow: 'rgba(59, 130, 246, 0.25)',
    accent: '#3B82F6',
    accentLight: '#1E293B',

    // Status Colors
    emerald: '#10B981',           // Emerald Shield
    emeraldGlow: 'rgba(16, 185, 129, 0.25)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',

    amber: '#F59E0B',             // Amber Ochre
    amberGlow: 'rgba(245, 158, 11, 0.25)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',

    rose: '#F43F5E',              // Rose Red
    purple: '#8B5CF6',            // Change Orders

    // Borders & Dividers
    border: '#334155',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',

    // Typography Hierarchy
    textPrimary: '#F8FAFC',       // Pure Crisp White
    textSecondary: '#94A3B8',     // Muted Slate
    textMuted: '#64748B',
    textHighlight: '#38BDF8',

    // Canvas Spec
    canvasBg: '#FFFFFF',
    signatureInk: '#0F172A',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 28,
  },

  touchTarget: {
    minHeight: 56,               // Field-tough glove-friendly invariant
  },

  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    glowPrimary: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8,
    },
    glowSuccess: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
