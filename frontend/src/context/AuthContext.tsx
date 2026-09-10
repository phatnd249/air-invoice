'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setTokens, clearTokens, getAccessToken } from '@/lib/api';
import { User, AuthResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (role: 'ADMIN' | 'USER') => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Timeout 5s để tránh bị đứng mãi ở màn hình loading
      const response = await Promise.race([
        api.get<User>('/auth/me'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        ),
      ]);
      setUser(response.data);
    } catch {
      setUser(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      router.push('/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
      });

      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      router.push('/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await api.post('/auth/logout');
      }
    } catch {
      // Bỏ qua lỗi logout phía server nếu token đã hết hạn
    } finally {
      clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const hasRole = (role: 'ADMIN' | 'USER') => user?.role === role;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        hasRole,
        login,
        register,
        logout,
        refreshUserProfile: fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
