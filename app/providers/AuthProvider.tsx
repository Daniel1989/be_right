'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (data: { email: string; password: string }, callbackUrl?: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string }, callbackUrl?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<User | null>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
} 