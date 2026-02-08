import { create } from "zustand";

type DeviceMode = "desktop" | "mobile";

interface PreviewStore {
  previewUrl: string | null;
  deviceMode: DeviceMode;
  isLoading: boolean;
  refreshKey: number;

  setPreviewUrl: (url: string) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setLoading: (loading: boolean) => void;
  triggerRefresh: () => void;
}

export const usePreviewStore = create<PreviewStore>((set) => ({
  previewUrl: null,
  deviceMode: "desktop",
  isLoading: false,
  refreshKey: 0,

  setPreviewUrl: (url) => set({ previewUrl: url }),
  setDeviceMode: (mode) => set({ deviceMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  triggerRefresh: () =>
    set((state) => ({ refreshKey: state.refreshKey + 1, isLoading: true })),
}));
