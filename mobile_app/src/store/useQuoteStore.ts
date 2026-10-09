import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Quote, ItemPreset, ContractorProfile } from '../types';
import { DatabaseService } from '../services/DatabaseService';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { CurrencyService } from '../services/CurrencyService';
import { RegionPaymentService } from '../services/RegionPaymentService';
import { BackupService } from '../services/BackupService';

const detectedMarket = CurrencyService.detectMarketRegion();
const detectedCurrency = CurrencyService.detectDeviceCurrency();

export const DEFAULT_PRESETS: ItemPreset[] = detectedMarket === 'IN'
  ? RegionPaymentService.INDIAN_TRADE_PRESETS.map((p, i) => ({
      id: `in-p-${i + 1}`,
      title: p.title,
      priceCents: p.priceCents,
      category: p.category as any,
      hsnSac: p.hsnSac,
      unit: p.unit,
    }))
  : RegionPaymentService.US_TRADE_PRESETS.map((p, i) => ({
      id: `us-p-${i + 1}`,
      title: p.title,
      priceCents: p.priceCents,
      category: p.category as any,
      unit: p.unit,
    }));

// Determine region-aware tax defaults based on detected currency
const _getDefaultTaxForCurrency = (code: string): { label: string; basisPoints: number } => {
  switch (code) {
    case 'INR': return { label: 'GST', basisPoints: 1800 };   // India: 18% GST
    case 'GBP': return { label: 'VAT', basisPoints: 2000 };   // UK: 20% VAT
    case 'EUR': return { label: 'VAT', basisPoints: 2000 };   // EU: 20% VAT
    case 'CAD': return { label: 'HST/GST', basisPoints: 1300 }; // Canada: 13% HST
    case 'AUD': return { label: 'GST', basisPoints: 1000 };   // Australia: 10% GST
    default:    return { label: 'Sales Tax', basisPoints: 825 }; // US / default: 8.25%
  }
};
const _defaultTax = _getDefaultTaxForCurrency(detectedCurrency.code);

export const DEFAULT_PROFILE: ContractorProfile = {
  businessName: '',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  logoUri: undefined,
  licenseNumber: '',
  zelleAccount: '',
  venmoAccount: '',
  cashAppAccount: '',
  upiId: '',
  upiPayeeName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankName: '',
  savedBankAccounts: [],
  savedUpiAccounts: [],
  region: detectedMarket,
  defaultTaxBasisPoints: _defaultTax.basisPoints,
  taxEnabledByDefault: true,
  taxLabel: _defaultTax.label,
  isGstSplitEnabled: detectedMarket === 'IN',
  isOnboardingCompleted: false,
  hasCustomBusinessName: false,
  invoiceTemplate: detectedMarket === 'IN' ? 'advanced_gst' : 'contractor',
  notificationPreferences: {
    outboxAlerts: true,
    sealConfirmations: true,
    paymentReminders: true,
  },
  currencySymbol: detectedCurrency.symbol,
  currencyCode: detectedCurrency.code,
  defaultInvoiceType: 'ESTIMATE',
  backupSettings: {
    autoBackupEnabled: true,
    backupTarget: 'LOCAL_VAULT',
  },
};

interface QuoteStore {
  quotes: Quote[];
  presets: ItemPreset[];
  profile: ContractorProfile;
  isPro: boolean;
  isDarkMode: boolean;
  isSunlightMode: boolean;
  activeFilter: 'ALL' | 'DRAFT' | 'SIGNED_LOCKED' | 'INVOICED' | 'PAID' | 'OVERDUE';
  isLoading: boolean;
  loadQuotes: () => Promise<void>;
  addQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateProfile: (profile: Partial<ContractorProfile>) => void;
  setRegionMode: (region: 'IN' | 'US') => void;
  addPreset: (preset: Omit<ItemPreset, 'id'>) => void;
  removePreset: (id: string) => void;
  setProStatus: (status: boolean) => void;
  setFilter: (filter: 'ALL' | 'DRAFT' | 'SIGNED_LOCKED' | 'INVOICED' | 'PAID' | 'OVERDUE') => void;
  toggleDarkMode: () => void;
  toggleSunlightMode: () => void;
  getMonthlyQuoteUsage: () => {
    count: number;
    limit: number;
    remaining: number;
    isExceeded: boolean;
  };
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      quotes: [],
      presets: DEFAULT_PRESETS,
      profile: DEFAULT_PROFILE,
      isPro: FEATURE_FLAGS.FREE_ALL_FEATURES ? true : false,
      isDarkMode: false,
      isSunlightMode: false,
      activeFilter: 'ALL',
      isLoading: false,

      loadQuotes: async () => {
        set({ isLoading: true });
        try {
          const data = await DatabaseService.getAllQuotes();
          set({ quotes: data, isLoading: false });
        } catch (err) {
          console.error('Error loading quotes:', err);
          set({ isLoading: false });
        }
      },

      addQuote: async (quote: Quote) => {
        await DatabaseService.saveQuote(quote);
        const updated = [quote, ...get().quotes.filter((q) => q.id !== quote.id)];
        set({ quotes: updated });
        // Auto-backup to Google Drive / OneDrive / Local vault
        BackupService.performAutoBackup('NEW_INVOICE').catch((e) =>
          console.warn('[QuoteStore] Auto-backup non-fatal warning:', e)
        );
      },

      deleteQuote: async (id: string) => {
        await DatabaseService.deleteQuote(id);
        set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id) }));
      },

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
      },

      setRegionMode: (region: 'IN' | 'US') => {
        if (region === 'US') {
          set((state) => ({
            profile: {
              ...state.profile,
              region: 'US',
              currencySymbol: '$',
              currencyCode: 'USD',
              taxLabel: 'Sales Tax',
              defaultTaxBasisPoints: 825,
              taxEnabledByDefault: true,
              isGstSplitEnabled: false,
              invoiceTemplate: 'contractor',
              defaultInvoiceType: 'ESTIMATE',
              stateCode: undefined,
            },
            presets: RegionPaymentService.US_TRADE_PRESETS.map((p, i) => ({
              id: `us-p-${i + 1}`,
              title: p.title,
              priceCents: p.priceCents,
              category: p.category as any,
              unit: p.unit,
            })),
          }));
        } else {
          set((state) => ({
            profile: {
              ...state.profile,
              region: 'IN',
              currencySymbol: '₹',
              currencyCode: 'INR',
              taxLabel: 'GST',
              defaultTaxBasisPoints: 1800,
              taxEnabledByDefault: true,
              isGstSplitEnabled: true,
              invoiceTemplate: 'advanced_gst',
              defaultInvoiceType: 'ESTIMATE',
            },
            presets: RegionPaymentService.INDIAN_TRADE_PRESETS.map((p, i) => ({
              id: `in-p-${i + 1}`,
              title: p.title,
              priceCents: p.priceCents,
              category: p.category as any,
              hsnSac: p.hsnSac,
              unit: p.unit,
            })),
          }));
        }
      },

      addPreset: (newPreset) => {
        const preset: ItemPreset = {
          ...newPreset,
          id: Crypto.randomUUID(),
        };
        set((state) => ({ presets: [...state.presets, preset] }));
      },

      removePreset: (id) => {
        set((state) => ({ presets: state.presets.filter((p) => p.id !== id) }));
      },

      setProStatus: (status) => set({ isPro: FEATURE_FLAGS.FREE_ALL_FEATURES ? true : status }),

      setFilter: (filter) => set({ activeFilter: filter }),

      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode, isSunlightMode: !state.isDarkMode })),

      toggleSunlightMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode, isSunlightMode: !state.isDarkMode })),

      getMonthlyQuoteUsage: () => {
        if (FEATURE_FLAGS.FREE_ALL_FEATURES || !FEATURE_FLAGS.PAYMENT_ENABLED) {
          const quotes = get().quotes;
          return {
            count: quotes.length,
            limit: 999999,
            remaining: 999999,
            isExceeded: false,
          };
        }
        const quotes = get().quotes;
        const now = new Date();
        const thisMonthQuotes = quotes.filter((q) => {
          const d = new Date(q.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const count = thisMonthQuotes.length;
        const limit = 3;
        return {
          count,
          limit,
          remaining: Math.max(0, limit - count),
          isExceeded: count >= limit,
        };
      },
    }),
    {
      name: 'jobsign-store-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        presets: state.presets,
        isDarkMode: state.isDarkMode,
        isSunlightMode: state.isSunlightMode,
        isPro: state.isPro,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.profile) {
          const detected = CurrencyService.detectDeviceCurrency();
          if (
            !state.profile.currencySymbol ||
            (!state.profile.hasCustomBusinessName && state.profile.currencySymbol === '$' && detected.symbol !== '$')
          ) {
            state.profile.currencySymbol = detected.symbol;
            state.profile.currencyCode = detected.code;
          }
        }
      },
    }
  )
);
