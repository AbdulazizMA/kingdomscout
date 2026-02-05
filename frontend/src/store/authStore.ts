import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSubscribed: boolean;
  subscriptionStatus: string;
  subscriptionEndsAt?: string;
  preferredLanguage?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredLanguage?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password,
        });
        
        const { user, token } = response.data;
        set({ user, token, isLoading: false, isAuthenticated: true });
        
        // Set default auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      register: async (data: RegisterData) => {
        const response = await axios.post(`${API_URL}/api/auth/register`, data);
        
        const { user, token } = response.data;
        set({ user, token, isLoading: false, isAuthenticated: true });
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete axios.defaults.headers.common['Authorization'];
      },

      checkAuth: () => {
        const { token } = get();
        
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Optionally verify token with backend
          axios.get(`${API_URL}/api/user/profile`)
            .then(response => {
              set({ user: response.data.user, isLoading: false, isAuthenticated: true });
            })
            .catch(() => {
              // Token invalid, clear it
              get().logout();
              set({ isLoading: false, isAuthenticated: false });
            });
        } else {
          set({ isLoading: false, isAuthenticated: false });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
