'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-12">
              <p className="text-sm text-slate-400 mb-2 uppercase tracking-wider">Welcome back, Arjun Silwal</p>
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Kanun AI
                </span>
              </h1>
              <p className="text-xl text-slate-400">Indian Law, amplified by intelligence</p>
            </div>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* AI-assisted Briefing Card */}
              <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/40 hover:border-[var(--accent-gold)]/40 transition-all group">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--accent-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">AI-assisted Briefing</CardTitle>
                      <p className="text-sm text-slate-400">Summarize judgments in seconds</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 mb-4 text-sm">
                    Concise digests, argument maps, and precedent links — all generated and verified for relevance.
                  </p>
                  <Link href="/case-analysis">
                    <Button className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black font-semibold hover:shadow-lg hover:shadow-[var(--accent-gold)]/20 transition-all">
                      Start Case Analysis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Profile Information Card */}
              <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Name</p>
                      <p className="text-slate-200">{'—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-slate-200">{'—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Role</p>
                      <p className="text-[var(--accent-gold)] capitalize">{'Not set'}</p>
                    </div>
                    <Link href="/profile">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-[var(--accent-gold)] mt-4">
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-slate-900/30 to-slate-950/30 border border-slate-800/40 hover:border-slate-700 transition-all">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <CardTitle className="text-base text-white">Explore Datasets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">Access 2M+ documents and 75K+ precedents</p>
                  <Link href="/datasets">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-slate-600 text-sm">
                      Browse
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/30 to-slate-950/30 border border-slate-800/40 hover:border-slate-700 transition-all">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <CardTitle className="text-base text-white">Recent Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">View your analysis history and saved cases</p>
                  <Link href="/cases">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-slate-600 text-sm">
                      View All
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/30 to-slate-950/30 border border-slate-800/40 hover:border-slate-700 transition-all">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <CardTitle className="text-base text-white">Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">Track your research and usage statistics</p>
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:border-slate-600 text-sm" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-slate-800/40 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--accent-gold)] mb-1">2M+</p>
                  <p className="text-sm text-slate-400">Documents</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--accent-gold)] mb-1">75K+</p>
                  <p className="text-sm text-slate-400">Precedents</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--accent-gold)] mb-1">24/7</p>
                  <p className="text-sm text-slate-400">AI Support</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--accent-gold)] mb-1">99.7%</p>
                  <p className="text-sm text-slate-400">Reliability</p>
                </div>
              </div>
            </div>

            {/* Back to Home */}
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