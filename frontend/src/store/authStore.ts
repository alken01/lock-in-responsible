import { create } from 'zustand';
import { icpClient } from '../lib/icp-api';
import type { Principal } from '@dfinity/principal';

interface AuthState {
  principal: Principal | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  principal: null,
  isAuthenticated: false,
  isLoading: false,

  login: async () => {
    set({ isLoading: true });
    try {
      await icpClient.login();
      const principal = await icpClient.getPrincipal();
      set({
        principal,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('❌ AuthStore: Login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await icpClient.logout();
      set({
        principal: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Logout failed:', error);
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await icpClient.isAuthenticated();
      if (isAuth) {
        const principal = await icpClient.getPrincipal();
        set({
          principal,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({
          principal: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('❌ AuthStore: Auth check failed:', error);
      set({
        principal: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },
}));
