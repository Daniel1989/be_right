'use client';

import { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

interface LogoutButtonProps {
  className?: string;
  label?: string;
}

export default function LogoutButton({ 
  className = "py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700", 
  label = "Logout" 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Logging out...' : label}
    </button>
  );
} 