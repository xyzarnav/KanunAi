// frontend/src/components/ProtectedRoute.tsx
'use client';
import { useUser } from '@auth0/nextjs-auth0';
// import {getUser} from
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/api/auth/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) return <div>Loading...</div>;
    if (!user) return null;

    return <>{children}</>;
}