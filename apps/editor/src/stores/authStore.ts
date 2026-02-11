import { create } from "zustand";

interface AuthStore {
  userId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: string | null;

  setAuthenticated: (userId: string, token: string) => void;
  setAuthenticating: (value: boolean) => void;
  setAuthError: (error: string | null) => void;
  logout: () => void;
}

const STORAGE_KEY = "hersite_auth";

function loadPersistedAuth(): { userId: string; token: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid stored data
  }
  return null;
}

const persisted = loadPersistedAuth();

export const useAuthStore = create<AuthStore>((set) => ({
  userId: persisted?.userId ?? null,
  token: persisted?.token ?? null,
  isAuthenticated: false, // Will be confirmed via socket
  isAuthenticating: !!persisted, // If we have persisted creds, we'll auto-validate
  authError: null,

  setAuthenticated: (userId, token) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, token }));
    set({
      userId,
      token,
      isAuthenticated: true,
      isAuthenticating: false,
      authError: null,
    });
  },

  setAuthenticating: (value) => set({ isAuthenticating: value }),

  setAuthError: (error) => set({ authError: error, isAuthenticating: false }),

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      userId: null,
      token: null,
      isAuthenticated: false,
      isAuthenticating: false,
      authError: null,
    });
  },
}));
