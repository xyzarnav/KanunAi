"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconScale, IconEye, IconEyeOff } from "@tabler/icons-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signupUser, clearError } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "user" as "user" | "lawyer",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    dispatch(clearError());

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    dispatch(signupUser({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      password: formData.password,
    }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        :root{
          --accent-gold: #D4AF37;
          --accent-deep: #0b2340;
        }
      `}</style>

      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent-gold)]/10 flex items-center justify-center border border-[var(--accent-gold)]/20">
              <IconScale className="w-6 h-6 text-[var(--accent-gold)]" />
            </div>
            <h1 className="font-serif text-2xl text-white">Kanun AI</h1>
          </div>
          <p className="text-slate-400">Create your account</p>
        </div>

        {/* Signup Form */}
        <Card className="bg-slate-900/60 border border-slate-800/40 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-xl text-center">Join Kanun AI</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || validationError) && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-md text-red-300 text-sm">
                  {error || validationError}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-slate-300 mb-2">
                  Mobile Number
                </label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20"
                  required
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                  Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-md focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 focus:outline-none"
                  required
                >
                  <option value="user">User</option>
                  <option value="lawyer">Lawyer</option>
                </select>
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
                    placeholder="Create a password (min 6 characters)"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-[var(--accent-gold)] focus:ring-[var(--accent-gold)]/20 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[var(--accent-gold)] to-amber-500 text-black hover:scale-[1.02] transition-transform font-medium"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[var(--accent-gold)] hover:text-amber-400 font-medium"
                >
                  Sign in
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
