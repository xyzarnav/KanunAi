"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function useGlobalLoading() {
  const { isLoading: authLoading } = useAuth();
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Simulate component loading time
    const componentTimer = setTimeout(() => {
      setComponentsLoaded(true);
    }, 500);

    // Initial load timer
    const initialTimer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);

    return () => {
      clearTimeout(componentTimer);
      clearTimeout(initialTimer);
    };
  }, []);

  // Show loading until all components are ready
  const isLoading = authLoading || !componentsLoaded || initialLoad;

  return {
    isLoading,
    authLoading,
    componentsLoaded,
    initialLoad
  };
}
