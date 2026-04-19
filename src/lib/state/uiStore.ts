'use client';
import { create } from 'zustand';

type ModalType = 'booking' | 'review' | 'inquiry' | null;
type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  type: NotificationType;
  message: string;
}

interface UIState {
  isModalOpen: boolean;
  modalType: ModalType;
  notification: Notification | null;
  sidebarOpen: boolean;
  globalLoading: boolean;
}

interface UIActions {
  openModal: (type: ModalType) => void;
  closeModal: () => void;
  showNotification: (type: NotificationType, message: string) => void;
  clearNotification: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
}

const initialState: UIState = {
  isModalOpen: false,
  modalType: null,
  notification: null,
  sidebarOpen: false,
  globalLoading: false,
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,
  openModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeModal: () => set({ isModalOpen: false, modalType: null }),
  showNotification: (type, message) => set({ notification: { type, message } }),
  clearNotification: () => set({ notification: null }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
