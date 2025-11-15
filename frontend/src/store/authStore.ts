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
    console.log('🚀 AuthStore: Starting login...');
    set({ isLoading: true });
    try {
      await icpClient.login();
      const principal = await icpClient.getPrincipal();
      console.log('👤 AuthStore: Got principal:', principal?.toString());
      set({
        principal,
        isAuthenticated: true,
        isLoading: false
      });
      console.log('✅ AuthStore: Login complete, state updated');
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
    console.log('🔄 AuthStore: Checking authentication...');
    set({ isLoading: true });
    try {
      const isAuth = await icpClient.isAuthenticated();
      console.log('🔍 AuthStore: checkAuth result:', isAuth);
      if (isAuth) {
        const principal = await icpClient.getPrincipal();
        console.log('👤 AuthStore: checkAuth got principal:', principal?.toString());
        set({
          principal,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        console.log('❌ AuthStore: Not authenticated');
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
