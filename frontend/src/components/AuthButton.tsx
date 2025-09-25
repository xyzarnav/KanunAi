'use client';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthButton() {
  const { user, error, isLoading } = useAuth();

  console.log('AuthButton - user:', user, 'error:', error, 'isLoading:', isLoading);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-slate-300">Welcome, {user.name}!</span>
        <Link href="/api/auth/logout">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:border-red-500 hover:text-red-400">
            Logout
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Link href="/api/auth/login">
      {/* <Button className="bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:scale-[1.02] transition-transform"> */}
       
      <Button className='bg-none' >
        {/* Login */}
      </Button>
    </Link>
  );
}
