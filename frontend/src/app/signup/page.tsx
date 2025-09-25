'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'user' as 'user' | 'lawyer'
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0Id: user?.sub,
          ...formData
        })
      });
      
      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Please login first</div>;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/40 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-slate-300">Name</label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-slate-300">Email</label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium mb-1 text-slate-300">Mobile Number</label>
              <Input
                type="tel"
                id="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1 text-slate-300">I am a:</label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'lawyer'})}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]"
                required
              >
                <option value="user">User</option>
                <option value="lawyer">Lawyer</option>
              </select>
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:scale-[1.02] transition-transform"
            >
              Complete Signup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
