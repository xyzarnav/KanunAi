// frontend/src/components/RoleGuard.tsx
'use client';
import { useUser } from '@auth0/nextjs-auth0';
import { useEffect, useState } from 'react';

export default function RoleGuard({
    allowedRoles,
    children
}: {
    allowedRoles: string[],
    children: React.ReactNode
}) {
    const { user } = useUser();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            // Fetch user role from your API
            fetch(`/api/users/${user.sub}`)
                .then(res => res.json())
                .then(data => setUserRole(data.role));
        }
    }, [user]);

    if (!userRole || !allowedRoles.includes(userRole)) {
        return <div>Access denied</div>;
    }

    return <>{children}</>;
}