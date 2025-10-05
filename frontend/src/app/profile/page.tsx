"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconScale, IconLogout, IconUser, IconMail, IconPhone, IconShield } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { logout } = useAuth();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and not authenticated
    // Add a small delay to prevent immediate redirect during initial load
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20 mx-auto mb-4">
            <IconScale className="w-6 h-6 text-[var(--accent-gold)] animate-pulse" />
          </div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white p-4">

      <div className="container mx-auto max-w-4xl py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20">
              <IconScale className="w-6 h-6 text-[var(--accent-gold)]" />
            </div>
            <h1 className="font-serif text-3xl text-white">Profile</h1>
          </div>
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/60 border border-slate-800/40 shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <IconUser className="w-5 h-5 text-[var(--accent-gold)]" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md text-white">
                      {user.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Account Type
                    </label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md text-white flex items-center gap-2">
                      <IconShield className="w-4 h-4 text-[var(--accent-gold)]" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md text-white flex items-center gap-2">
                      <IconMail className="w-4 h-4 text-[var(--accent-gold)]" />
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mobile Number
                    </label>
                    <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-md text-white flex items-center gap-2">
                      <IconPhone className="w-4 h-4 text-[var(--accent-gold)]" />
                      {user.mobile}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-slate-900/60 border border-slate-800/40 shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/analysis" className="block">
                  <Button className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black hover:scale-[1.02] transition-transform">
                    Start Analysis
                  </Button>
                </Link>
                <Link href="/cases" className="block">
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-[var(--accent-gold)]">
                    Browse Cases
                  </Button>
                </Link>
                <Link href="/resources" className="block">
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-[var(--accent-gold)]">
                    View Resources
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border border-slate-800/40 shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-300 hover:border-red-500 hover:bg-red-500/10"
                >
                  <IconLogout className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
