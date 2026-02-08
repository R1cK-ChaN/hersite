import { create } from "zustand";

interface UIStore {
  sidebarWidth: number;
  wizardStep: number;
  isPublishDialogOpen: boolean;
  isConnected: boolean;

  setSidebarWidth: (width: number) => void;
  setWizardStep: (step: number) => void;
  setPublishDialogOpen: (open: boolean) => void;
  setConnected: (connected: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarWidth: 400,
  wizardStep: 0,
  isPublishDialogOpen: false,
  isConnected: false,

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setWizardStep: (step) => set({ wizardStep: step }),
  setPublishDialogOpen: (open) => set({ isPublishDialogOpen: open }),
  setConnected: (connected) => set({ isConnected: connected }),
}));
