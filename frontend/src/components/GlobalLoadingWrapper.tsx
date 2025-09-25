"use client";

import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import Loading from './ui/loading';

interface GlobalLoadingWrapperProps {
  children: React.ReactNode;
}

export default function GlobalLoadingWrapper({ children }: GlobalLoadingWrapperProps) {
  const { isLoading } = useGlobalLoading();

  if (isLoading) {
    return <Loading message="" />;
  }

  return <>{children}</>;
}
