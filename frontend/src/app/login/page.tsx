"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FloatingDock } from "@/components/ui/floating-dock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconBook,
  IconGavel,
  IconHome,
  IconScale,
  IconId,
  IconMoodSmile,
  IconSettings,
  IconUserFilled,
  IconLogin,
} from "@tabler/icons-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay for smooth transition
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    // Redirect after a short delay to show the animation
    setTimeout(() => {
      window.location.href = '/api/auth/login';
    }, 800);
  };
  const navigationItems = [
    {
      title: "Home",
      icon: <IconHome className="text-neutral-200 dark:text-neutral-400" />,
      href: "/",
    },
    {
      title: "Legal Analysis",
      icon: <IconScale className="text-neutral-200 dark:text-neutral-400" />,
      href: "/analysis",
    },
    {
      title: "Case Law",
      icon: <IconGavel className="text-neutral-200 dark:text-neutral-400" />,
      href: "/cases",
    },
    {
      title: "Resources",
      icon: <IconBook className="text-neutral-200 dark:text-neutral-900" />,
      href: "/resources",
    },
    {
      title: "Login",
      icon: <IconLogin className="text-neutral-200 dark:text-neutral-400" />,
      href: "/login",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        :root{
          --accent-gold: #D4AF37;
          --accent-deep: #0b2340;
        }
      `}</style>

      {/* Navigation */}
      <div className="pt-8 px-4 py-2">
        <FloatingDock
          items={navigationItems}
          desktopClassName="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900"
          mobileClassName="fixed top-8 right-4 z-50"
        />
      </div>

      {/* Login Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute p-2 inset-0 bg-black" />
        <div className="container mx-auto px-6 z-10 max-w-7xl">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <Card className="bg-gradient-to-br border border-slate-800/40 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20">
                      <IconScale className={`w-8 h-8 text-[var(--accent-gold)] transition-all duration-300 ${
                        isLoading ? 'animate-bounce' : ''
                      }`} />
                    </div>
                  </div>
                  <CardTitle className="font-serif text-2xl text-white">
                    Welcome to Kanun AI
                  </CardTitle>
                  <p className="text-slate-400 mt-2">
                    {isLoading ? 'Authenticating...' : 'Sign in to access legal intelligence'}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-8 h-8 border-2 border-[var(--accent-gold)]/30 border-t-[var(--accent-gold)] rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-400">Connecting to Auth0...</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleLogin}
                      className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:scale-[1.02] transition-transform font-medium py-3"
                      size="lg"
                    >
                      <IconLogin className="w-5 h-5 mr-2" />
                      Sign in with Auth0
                    </Button>
                  )}

                  {!isLoading && (
                    <div className="text-center">
                      <Link 
                        href="/" 
                        className="text-sm text-slate-400 hover:text-[var(--accent-gold)] transition-colors"
                      >
                        ← Back to Home
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-xs text-slate-500 text-center">
                      Secure authentication powered by Auth0
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
