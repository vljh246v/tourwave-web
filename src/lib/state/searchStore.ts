'use client';
import { create } from 'zustand';

interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  dateFrom?: string;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  sortBy: 'relevance' | 'price' | 'rating';
  page: number;
  pageSize: number;
  loading: boolean;
  results: unknown[];
  totalCount: number;
}

interface SearchActions {
  setQuery: (q: string) => void;
  setFilter: (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => void;
  setSortBy: (sort: SearchState['sortBy']) => void;
  setPage: (p: number) => void;
  setResults: (results: unknown[], totalCount: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState: SearchState = {
  query: '',
  filters: {},
  sortBy: 'relevance',
  page: 1,
  pageSize: 20,
  loading: false,
  results: [],
  totalCount: 0,
};

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  ...initialState,
  setQuery: (q) => set({ query: q, page: 1 }),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value }, page: 1 })),
  setSortBy: (sort) => set({ sortBy: sort, page: 1 }),
  setPage: (p) => set({ page: p }),
  setResults: (results, totalCount) => set({ results, totalCount }),
  setLoading: (loading) => set({ loading }),
  reset: () => set(initialState),
}));
