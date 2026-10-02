import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error';
import type {
  AuthAccount,
  AuthRole,
  LoginResponseData,
  MeResponseData,
  RegisterResponseData,
} from '@/types';

const USER_KEY = 'user';

interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  city?: string;
  organization_name?: string;
}

interface AuthState {
  user: AuthAccount | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  /** False until checkAuth() has run once. Guard redirects on this, not on
   *  isAuthenticated, which starts false for signed-in users too. */
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

function cacheUser(account: AuthAccount | null) {
  if (typeof window === 'undefined') return;
  if (account) {
    localStorage.setItem(USER_KEY, JSON.stringify(account));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

/** Tolerates the literal string "undefined" that older builds wrote here. */
function readCachedUser(): AuthAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    return JSON.parse(raw) as AuthAccount;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password);
      const data: LoginResponseData = response.data.data;

      // Clients come back under `client`, admin/broker under `user`.
      const account = data.client ?? data.user ?? null;

      apiClient.setToken(data.token);
      cacheUser(account);

      set({
        user: account,
        role: data.role ?? null,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message = apiErrorMessage(error, 'Login failed');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.register(data);
      const payload: RegisterResponseData = response.data.data;

      // Register returns a flat payload rather than a nested account object.
      const account: AuthAccount = {
        id: payload.client_id,
        name: payload.name,
        email: payload.email,
      };

      apiClient.setToken(payload.token);
      cacheUser(account);

      set({
        user: account,
        role: payload.role ?? 'client',
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message = apiErrorMessage(error, 'Registration failed');
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.logout();
    } catch {
      // Revoking server-side is best effort; always clear locally.
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem(USER_KEY);
    }

    set({
      user: null,
      role: null,
      isAuthenticated: false,
      isInitialized: true,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') {
      set({ isInitialized: true });
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, role: null, isAuthenticated: false, isInitialized: true, isLoading: false });
      return;
    }

    // Paint immediately from cache, then confirm with the server.
    const cached = readCachedUser();
    set({ user: cached, isAuthenticated: Boolean(cached), isLoading: true });

    try {
      apiClient.setToken(token);
      const response = await apiClient.getMe();
      const data: MeResponseData = response.data.data;

      cacheUser(data.account);
      set({
        user: data.account,
        role: data.role ?? null,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem(USER_KEY);
      set({ user: null, role: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
