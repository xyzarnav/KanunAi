'use client';
import { useState } from 'react';
// import { useUser } from '@auth0/nextjs-auth0/client';
import {useUser} from '@auth0/nextjs-auth0';

export default function SignupForm() {
    const { user, error, isLoading } = useUser();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        role: 'user' as 'user' | 'lawyer'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.accessToken}`
                },
                body: JSON.stringify({
                    auth0Id: user?.sub,
                    ...formData
                })
            });

            if (response.ok) {
                // Redirect to dashboard or success page
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error('Signup error:', error);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error.message}</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>

            <div>
                <label htmlFor="mobile">Mobile Number</label>
                <input
                    type="tel"
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                />
            </div>

            <div>
                <label htmlFor="role">I am a:</label>
                <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'lawyer' })}
                    required
                >
                    <option value="user">User</option>
                    <option value="lawyer">Lawyer</option>
                </select>
            </div>

            <button type="submit">Complete Signup</button>
        </form>
    );
}