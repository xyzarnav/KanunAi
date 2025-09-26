"use client";

import { IconScale } from '@tabler/icons-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ message = "Loading...", size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <style jsx global>{`
        :root{
          --accent-gold: #D4AF37;
        }
      `}</style>
      <div className="text-center">
        <div className={`${sizeClasses[size]} rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20 mx-auto mb-6`}>
          <IconScale className={`${iconSizes[size]} text-[var(--accent-gold)] animate-bounce`} />
        </div>
        <p className="text-lg text-slate-300 font-serif">{message}</p>
      </div>
    </div>
  );
}

export default Loading;
