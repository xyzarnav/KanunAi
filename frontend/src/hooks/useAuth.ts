'use client';
import { useState, useEffect } from 'react';

interface User {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok) {
          setAuthState({
            user: data.user,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            error: new Error('Failed to fetch user')
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error')
        });
      }
    };

    fetchUser();
  }, []);

  return authState;
}
