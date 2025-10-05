'use client';
import { useAppSelector } from '@/store/hooks';
import Loading from './ui/loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) return <Loading message="Authenticating..." />;

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    return <>{children}</>;
}