'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Mail, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.firstName);
      setSuccess('Account created! Please check your email to verify your account.');
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ivory-50">
      {/* ─── Left: Brand panel ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden flex-col justify-between p-12 text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(212,175,55,0.6) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="monogram">MT</span>
          <div>
            <p className="font-bold text-lg leading-none">Masonic Traveler</p>
            <p className="eyebrow text-gold-400/90 mt-1">Brotherhood Without Borders</p>
          </div>
        </Link>

        <div className="relative">
          <p className="eyebrow text-gold-400 mb-6">Become a Member</p>
          <h1 className="font-bold text-5xl xl:text-6xl leading-[1.05] text-balance mb-6">
            Begin your<br />
            <span className="text-gold-shine">global journey.</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Create your account in moments. Verification by your Lodge Secretary unlocks the full brotherhood.
          </p>
          <div className="mt-12 max-w-xs divider-gold" />
        </div>

        <p className="relative text-xs text-white/40 tracking-luxe">
          An independent platform for the traveling Mason.
        </p>
      </div>

      {/* ─── Right: Form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <span className="monogram">MT</span>
            <div>
              <p className="font-bold text-ink-900">Masonic Traveler</p>
              <p className="eyebrow text-gold-700">Brotherhood Without Borders</p>
            </div>
          </Link>

          <div className="mb-10">
            <p className="eyebrow mb-3">Create Your Account</p>
            <h2 className="text-4xl font-bold text-ink-900 mb-2">
              Join the brotherhood
            </h2>
            <p className="text-ink-600">
              Already a member?{' '}
              <Link href="/auth/login" className="font-semibold text-gold-700 hover:text-gold-800 tracking-luxe">
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-2">
                <Sparkles className="h-5 w-5 mt-0.5 shrink-0 text-gold-500" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-ink-800 mb-1.5 tracking-luxe">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Brother"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink-800 mb-1.5 tracking-luxe">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="brother@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink-800 mb-1.5 tracking-luxe">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-ink-800 mb-1.5 tracking-luxe">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-masonic w-full group">
              {loading ? (
                'Creating Account…'
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="text-xs text-ink-500 text-center pt-2 leading-relaxed">
              By creating an account, you agree to our privacy policy and terms.
              An independent platform — not officially affiliated with any Grand Lodge.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
