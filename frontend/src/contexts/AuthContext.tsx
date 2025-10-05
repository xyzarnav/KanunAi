"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadUserFromStorage, logout as logoutAction, setLoading } from "@/store/slices/authSlice";

import type { User } from "@/store/slices/authSlice";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Set loading state and load user from storage on mount
    dispatch(setLoading(true));
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  const login = (_userData: User, _tokenData: string) => {
    // This will be handled by Redux thunks in the components
    // Keep a no-op to satisfy the context contract
    void _userData;
    void _tokenData;
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
