'use client';
import { create } from 'zustand';

interface BookingState {
  currentOccurrenceId: string | null;
  partySize: number;
  selectedParticipants: string[];
  loading: boolean;
  error: string | null;
}

interface BookingActions {
  setOccurrence: (id: string) => void;
  setPartySize: (size: number) => void;
  addParticipant: (id: string) => void;
  removeParticipant: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: BookingState = {
  currentOccurrenceId: null,
  partySize: 1,
  selectedParticipants: [],
  loading: false,
  error: null,
};

export const useBookingStore = create<BookingState & BookingActions>((set) => ({
  ...initialState,
  setOccurrence: (id) => set({ currentOccurrenceId: id }),
  setPartySize: (size) => set({ partySize: size }),
  addParticipant: (id) => set((state) => ({ selectedParticipants: [...state.selectedParticipants, id] })),
  removeParticipant: (id) => set((state) => ({ selectedParticipants: state.selectedParticipants.filter((p) => p !== id) })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
