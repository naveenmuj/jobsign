import { create } from 'zustand';
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
  activeFilter: 'ALL' | 'DRAFT' | 'SIGNED_LOCKED' | 'PAID';
  isLoading: boolean;
  loadQuotes: () => Promise<void>;
  addQuote: (quote: Quote) => Promise<void>;
  updateProfile: (profile: Partial<ContractorProfile>) => void;
  addPreset: (preset: Omit<ItemPreset, 'id'>) => void;
  removePreset: (id: string) => void;
  setProStatus: (status: boolean) => void;
  setFilter: (filter: 'ALL' | 'DRAFT' | 'SIGNED_LOCKED' | 'PAID') => void;
}

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  quotes: [],
  presets: DEFAULT_PRESETS,
  profile: DEFAULT_PROFILE,
  isPro: false,
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

  updateProfile: (updates) => {
    set((state) => ({ profile: { ...state.profile, ...updates } }));
  },

  addPreset: (newPreset) => {
    const preset: ItemPreset = {
      ...newPreset,
      id: Math.random().toString(36).substring(7),
    };
    set((state) => ({ presets: [...state.presets, preset] }));
  },

  removePreset: (id) => {
    set((state) => ({ presets: state.presets.filter((p) => p.id !== id) }));
  },

  setProStatus: (status) => set({ isPro: status }),

  setFilter: (filter) => set({ activeFilter: filter }),
}));
