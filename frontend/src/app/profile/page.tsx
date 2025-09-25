"use client";

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, error, isLoading } = useAuth();
  // local extended user shape for optional fields returned by Auth0
  type AuthUserExtras = {
    email_verified?: boolean;
    updated_at?: string;
  } & Record<string, unknown>;
  const u = user as unknown as AuthUserExtras;

  // hooks: keep at top-level so they run on every render (avoid conditional calls)
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore failures to write clipboard
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Link href="/api/auth/login">
            <Button className="bg-blue-500 hover:bg-blue-700 text-white">
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Not Logged In</h1>
          <p className="text-gray-600 mb-4">Please log in to view your profile</p>
          <Link href="/api/auth/login">
            <Button className="bg-blue-500 hover:bg-blue-700 text-white">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <div className="flex justify-center">
          <Card className="chalk-border bg-gradient-to-br from-slate-900/60 to-slate-950/60 w-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-slate-700/20 flex items-center justify-center border border-slate-700/30 overflow-hidden">
                    {user.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="w-full h-full object-cover" src={user.picture} alt={user.name || 'avatar'} />
                    ) : (
                      <span className="text-3xl font-bold text-slate-200">{user.name?.charAt(0) || 'U'}</span>
                    )}
                  </div>

                  <div>
                    <CardTitle className="font-serif text-2xl md:text-3xl">Welcome, {user.name || 'User'}!</CardTitle>
                    <p className="text-slate-300 mt-1">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href="/">
                    <Button variant="outline" className="text-white border-slate-700/50">Back to Home</Button>
                  </Link>
                  <Link href="/api/auth/logout">
                    <Button className="bg-red-600 hover:bg-red-700 text-white">Logout</Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-4">Profile Information</h3>
                  <dl className="space-y-4 text-sm text-slate-300">
                    <div>
                      <dt className="text-slate-400">Name</dt>
                      <dd className="mt-1">{user.name || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Email</dt>
                      <dd className="mt-1">{user.email || 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">User ID</dt>
                      <dd className="mt-1 flex items-center gap-3 break-words text-slate-200">
                        <span className="truncate">{user.sub || 'Not provided'}</span>
                        {user.sub && (
                          <button onClick={() => handleCopy(user.sub)} aria-label="Copy user id" className="ml-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-800/40 hover:bg-slate-800/60">
                            <IconCopy className="w-4 h-4" />
                            <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Email Verified</dt>
                      <dd className="mt-1">{u?.email_verified ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="bg-[var(--accent-gold)]/5 p-4 rounded-md border border-[var(--accent-gold)]/10">
                    <h4 className="font-serif text-lg text-[var(--accent-gold)]">Account Summary</h4>
                    <p className="text-slate-300 text-sm mt-2">Member since: <span className="text-slate-200">{u?.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'N/A'}</span></p>
                    <div className="mt-4 flex gap-3">
                      <Link href="/analysis">
                        <Button className="bg-[var(--accent-gold)]/90 text-black">Start Analysis</Button>
                      </Link>
                      <Link href="/signup">
                        <Button variant="ghost" className="text-slate-300">Edit Profile</Button>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 bg-slate-900/50 p-4 rounded-md border border-slate-800/30">
                    <h4 className="text-sm text-slate-300 font-medium">Quick Actions</h4>
                    <div className="mt-3 flex gap-2">
                      <Link href="/cases"><Button variant="ghost" className="text-slate-300">My Cases</Button></Link>
                      <Link href="/resources"><Button variant="ghost" className="text-slate-300">Resources</Button></Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <div className="text-xs text-slate-400">Profile ID: <span className="text-slate-200 ml-1">{user.sub || 'N/A'}</span></div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}