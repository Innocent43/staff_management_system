import { create } from "zustand";

const TOKEN_KEY = "access_token";

type AuthState = {
  token: string | null;
  ready: boolean;
  loadToken: () => void;
  setToken: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  ready: false,
  loadToken: () => set({ token: localStorage.getItem(TOKEN_KEY), ready: true }),
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null });
  },
}));