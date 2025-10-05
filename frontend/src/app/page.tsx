"use client";

import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconBook,
  IconGavel,
  IconHome,
  IconScale,
  IconUserFilled,
  IconLogin,
  IconLogout,
} from "@tabler/icons-react";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";


export default function HomePage() {
  const { logout } = useAuth();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

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
      title: isAuthenticated ? `Profile (${user?.name})` : "Login",
      icon: isAuthenticated ? (
        <div className="relative">
          <IconUserFilled className="text-neutral-200 dark:text-neutral-900" />
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-neutral-800 ${
            user?.role === 'lawyer' ? 'bg-blue-500' : 'bg-green-500'
          }`}></div>
        </div>
      ) : (
        <IconLogin className="text-neutral-200 dark:text-neutral-900" />
      ),
      href: isAuthenticated ? "/profile" : "/login",
    },
    ...(isAuthenticated ? [{
      title: "Logout",
      icon: <IconLogout className="text-red-400" />,
      href: "#",
      onClick: logout,
    }] : []),
  ];

  // New: feature and stat data with icon component references (not JSX elements)
  const features = [
    {
      icon: IconScale,
      title: "Legal Analysis",
      description:
        "AI-driven insights that interpret statutes and case law with contextual accuracy.",
    },
    {
      icon: IconGavel,
      title: "Case Research",
      description:
        "Fast, authoritative retrieval of Indian precedents and judicial reasoning.",
    },
    {
      icon: IconBook,
      title: "Statutory Intelligence",
      description:
        "Structured access to statutes, rules and regulatory frameworks for confident decision-making.",
    },
  ];

  const stats = [
    { value: "2M+", label: "Documents" },
    { value: "75K+", label: "Precedents" },
    { value: "24/7", label: "AI Support" },
    { value: "99.7%", label: "Reliability" },
  ];

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Existing navbar */}
      <div className="pt-8 px-4 py-2">
        <FloatingDock
          items={navigationItems}
          desktopClassName="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900"
          mobileClassName="fixed top-8 right-4 z-50"
        />
      </div>

      {/* Hero Section - two column professional layout */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute p-2 inset-0 bg-black" />
        <div className="container mx-auto px-6 z-10 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24">
            {/* Left: Headline + CTAs */}
            <div className="space-y-8">
              {isAuthenticated ? (
                <div className="text-sm text-slate-400 uppercase tracking-wider">
                  Welcome back, {user?.name}
                </div>
              ) : (
                <div className="text-sm text-slate-400 uppercase tracking-wider">
                  Introducing
                </div>
              )}
              <h1 className="font-serif text-5xl md:text-6xl leading-tight">
                Kanun AI
                <span className="block text-slate-300 text-3xl font-light mt-2">
                  Indian Law, amplified by intelligence
                </span>
              </h1>

              <p className="text-slate-400 max-w-xl leading-relaxed">
                Trusted legal intelligence tailored for the Indian jurisdiction.
                Rapid research, concise analysis, and dependable insights — designed
                for practitioners and scholars.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                {isAuthenticated ? (
                  <>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:scale-[1.02] transition-transform"
                    >
                      Start a Case Analysis
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-slate-700 text-yellow-900 font-bold hover:border-[var(--accent-gold)]"
                    >
                      Explore Datasets
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black shadow-[0_8px_30px_rgba(212,175,55,0.15)] hover:scale-[1.02] transition-transform"
                      >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-slate-700 text-yellow-900 font-bold hover:border-[var(--accent-gold)]"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="flex gap-8 mt-6">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="font-serif text-2xl text-[var(--accent-gold)] font-bold">
                      {s.value}
                    </div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual card with subtle illustration */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/40 shadow-lg">
                <CardHeader className="p-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-md flex items-center justify-center bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20">
                      <IconScale className="w-6 h-6 text-[var(--accent-gold)]" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-lg text-white">
                        AI-assisted Briefing
                      </CardTitle>
                      <div className="text-xs text-slate-400">
                        Summarize judgments in seconds
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="rounded-md bg-gradient-to-b from-[var(--accent-deep)]/30 to-transparent p-4">
                    {/* Minimal circuit + scales SVG */}
                    <svg
                      viewBox="0 0 240 120"
                      className="w-full h-40"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="g1" x1="0" x2="1">
                          <stop
                            offset="0"
                            stopColor="#D4AF37"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="1"
                            stopColor="#60A5FA"
                            stopOpacity="0.8"
                          />
                        </linearGradient>
                      </defs>
                      <rect
                        x="6"
                        y="6"
                        width="228"
                        height="108"
                        rx="8"
                        stroke="rgba(212,175,55,0.08)"
                      />
                      <g
                        stroke="url(#g1)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.95"
                      >
                        <path d="M30 80 V40 H60" />
                        <path d="M60 40 H90" />
                        <circle cx="100" cy="48" r="3" />
                        <path d="M120 30 V80" />
                        <path d="M140 40 H180" />
                        <path d="M180 40 V70" />
                        <path d="M170 60 Q160 68 150 60" />
                        <path d="M60 70 Q80 60 100 70" />
                      </g>
                      <g
                        transform="translate(40,10)"
                        fill="none"
                        stroke="rgba(212,175,55,0.9)"
                        strokeLinecap="round"
                      >
                        <path d="M120 50 L140 50" strokeWidth="2" />
                        <path d="M130 40 L130 60" strokeWidth="2" />
                      </g>
                    </svg>
                  </div>

                  <p className="text-slate-300 mt-4">
                    Concise digests, argument maps, and precedent links — all
                    generated and verified for relevance.
                  </p>

                  <div className="mt-6 flex gap-3">
                    <Button
                      size="sm"
                      className="bg-[var(--accent-gold)]/90 text-black"
                    >
                      Try Demo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-300"
                    >
                      Request Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - clean cards */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl">Capabilities</h2>
            <p className="text-slate-400 mt-3">
              Focused tools for legal professionals and institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, idx) => {
              const IconComp = f.icon;
              return (
                <Card
                  key={idx}
                  className="p-6 bg-slate-900/40 border border-slate-800/40 hover:translate-y-[-4px] transition-transform"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20">
                      <IconComp className="w-6 h-6 text-[var(--accent-gold)]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg">{f.title}</h3>
                      <p className="text-slate-400 mt-2 text-sm">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <Footer/>
      <div className="h-24" />
    </main>
  );
}
