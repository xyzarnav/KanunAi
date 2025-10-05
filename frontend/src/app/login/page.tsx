"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconScale, IconEye, IconEyeOff } from "@tabler/icons-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(loginUser(formData));
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">

      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20">
              <IconScale className="w-6 h-6 text-[var(--accent-gold)]" />
            </div>
            <h1 className="font-serif text-2xl text-white">Kanun AI</h1>
          </div>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card className="bg-slate-900/60 border border-slate-800/40 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-xl text-center">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-md text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="emailOrMobile" className="block text-sm font-medium text-slate-300 mb-2">
                  Email or Mobile
                </label>
                <Input
                  id="emailOrMobile"
                  name="emailOrMobile"
                  type="text"
                  value={formData.emailOrMobile}
                  onChange={handleChange}
                  placeholder="Enter your email or mobile number"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black hover:scale-[1.02] transition-transform font-medium"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[var(--accent-gold)] hover:text-amber-400 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
