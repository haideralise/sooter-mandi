import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

interface User {
  id: number;
  name: string;
  email: string;
  type: 'client' | 'broker' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      const { token, user } = response.data.data;

      apiClient.setToken(token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.register(data);
      const { token, client } = response.data.data;

      apiClient.setToken(token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(client));
      }

      set({ user: client, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('user');

        if (token && user) {
          apiClient.setToken(token);
          const response = await apiClient.getMe();
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      set({ isAuthenticated: false, isLoading: false });
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
