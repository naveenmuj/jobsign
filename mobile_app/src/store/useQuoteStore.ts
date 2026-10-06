import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Quote, ItemPreset, ContractorProfile } from '../types';
import { DatabaseService } from '../services/DatabaseService';

export const DEFAULT_PRESETS: ItemPreset[] = [
  { id: 'p1', title: 'Diagnostic & Service Call', priceCents: 9500, category: 'Diagnostic' },
  { id: 'p2', title: 'Hourly Labor Rate', priceCents: 8500, category: 'Labor' },
  { id: 'p3', title: 'Main Breaker Replacement', priceCents: 22000, category: 'Parts' },
  { id: 'p4', title: 'Water Pipe Leak Repair', priceCents: 18000, category: 'Parts' },
  { id: 'p5', title: 'HVAC Capacitor Replacement', priceCents: 16500, category: 'Parts' },
  { id: 'p6', title: 'Drywall Patch & Sanding', priceCents: 14000, category: 'Labor' },
];

export const DEFAULT_PROFILE: ContractorProfile = {
  businessName: 'Apex Field Services LLC',
  ownerName: 'Mike Sullivan',
  phone: '(512) 843-9201',
  email: 'mike@apexfieldservice.com',
  licenseNumber: 'TX-EL-92841',
  zelleAccount: 'mike@apexfieldservice.com',
  venmoAccount: '@ApexServices',
  cashAppAccount: '$ApexMike',
  defaultTaxBasisPoints: 825, // 8.25%
};

interface QuoteStore {
  quotes: Quote[];
  presets: ItemPreset[];
  profile: ContractorProfile;
  isPro: boolean;
  isSunlightMode: boolean;
  activeFilter: 'ALL' | 'DRAFT' | 'SIGNED_LOCKED' | 'PAID';
  isLoading: boolean;
  loadQuotes: () => Promise<void>;
  addQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  updateProfile: (profile: Partial<ContractorProfile>) => void;
  addPreset: (preset: Omit<ItemPreset, 'id'>) => void;
  removePreset: (id: string) => void;
  setProStatus: (status: boolean) => void;
  setFilter: (filter: 'ALL' | 'DRAFT' | 'SIGNED_LOCKED' | 'PAID') => void;
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
      isPro: false,
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
      },

      deleteQuote: async (id: string) => {
        await DatabaseService.deleteQuote(id);
        set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id) }));
      },

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }));
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

      setProStatus: (status) => set({ isPro: status }),

      setFilter: (filter) => set({ activeFilter: filter }),

      toggleSunlightMode: () =>
        set((state) => ({ isSunlightMode: !state.isSunlightMode })),

      getMonthlyQuoteUsage: () => {
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
        isSunlightMode: state.isSunlightMode,
        isPro: state.isPro,
      }),
    }
  )
);
