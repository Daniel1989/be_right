'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });
  const router = useRouter();
  const locale = useLocale();

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success) {
        setAuth({
          user: data.user,
          isLoading: false,
          error: null
        });
        return data.user;
      } else {
        setAuth({
          user: null,
          isLoading: false,
          error: null // No error if just not logged in
        });
        return null;
      }
    } catch (error) {
      setAuth({
        user: null,
        isLoading: false,
        error: 'Failed to fetch user data'
      });
      return null;
    }
  }, []);

  // Login user
  const login = async (data: LoginData, callbackUrl?: string) => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAuth({
          user: result.user,
          isLoading: false,
          error: null
        });
        
        // Navigate to appropriate page
        if (callbackUrl) {
          router.push(decodeURIComponent(callbackUrl));
        } else {
          router.push(`/${locale}/dashboard`);
        }
        router.refresh();
        return true;
      } else {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Invalid credentials'
        }));
        return false;
      }
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: 'An error occurred during login'
      }));
      return false;
    }
  };

  // Register user
  const register = async (data: RegisterData, callbackUrl?: string) => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAuth({
          user: result.user,
          isLoading: false,
          error: null
        });
        
        // Navigate to appropriate page
        if (callbackUrl) {
          router.push(decodeURIComponent(callbackUrl));
        } else {
          router.push(`/${locale}/dashboard`);
        }
        router.refresh();
        return true;
      } else {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Registration failed'
        }));
        return false;
      }
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: 'An error occurred during registration'
      }));
      return false;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAuth({
          user: null,
          isLoading: false,
          error: null
        });
        
        // Navigate to login page
        router.push(`/${locale}/auth/login`);
        router.refresh();
        return true;
      } else {
        setAuth(prev => ({
          ...prev,
          isLoading: false,
          error: 'Logout failed'
        }));
        return false;
      }
    } catch (error) {
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: 'An error occurred during logout'
      }));
      return false;
    }
  };

  // Check auth status on mount
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    register,
    logout,
    fetchCurrentUser
  };
}