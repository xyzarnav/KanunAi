"use client";

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      {/* Centered card with chalky border */}
      <div className="relative w-full max-w-lg">
        {/* SVG overlay that creates a rough chalk-like white border */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox="0 0 800 600"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
            </filter>
          </defs>
          <rect x="8" y="8" width="784" height="584" fill="none" stroke="#ffffff" strokeWidth={16} strokeLinejoin="round" filter="url(#grain)" rx="12" ry="12" />
        </svg>

        <section className="relative bg-white/95 backdrop-blur-sm rounded-md shadow-xl px-8 py-10 border border-transparent">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
            <p className="mt-2 text-sm text-gray-600">Authenticate with Auth0 to continue</p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={() => (window.location.href = '/api/auth/login')}
              className="w-full inline-flex items-center justify-center gap-3 py-3 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
            >
              {/* Simple icon placeholder */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-90" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 18a8 8 0 1116 0H2z" clipRule="evenodd" />
              </svg>
              Sign in with Auth0
            </button>

            <div className="flex items-center justify-center">
              <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">← Back to Home</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
