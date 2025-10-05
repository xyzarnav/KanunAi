 'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Dashboard() {
  // temporary: no auth provider present yet

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><span className="text-slate-400">Name:</span> {'—'}</p>
                    <p><span className="text-slate-400">Email:</span> {'—'}</p>
                    <p><span className="text-slate-400">Role:</span> <span className="text-[var(--accent-gold)] capitalize">{'Not set'}</span></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href="/analysis">
                      <Button className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black">
                        Start Legal Analysis
                      </Button>
                    </Link>
                    <Link href="/cases">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-[var(--accent-gold)]">
                        Browse Case Law
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:border-[var(--accent-gold)]">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
