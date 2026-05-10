'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signInWithMagicLink, user, session, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session && !authLoading) {
      router.replace('/dashboard');
    }
  }, [session, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (useMagicLink) {
        await signInWithMagicLink(email);
        setSuccess('Magic link sent! Check your email to sign in.');
      } else {
        await signIn(email, password);
        router.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-ivory-50">
      {/* ─── Left: Brand / Hero panel ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden flex-col justify-between p-12 text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(212,175,55,0.6) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />

        <Link href="/" className="relative flex items-center gap-3 group">
          <span className="monogram">MT</span>
          <div>
            <p className="font-bold text-lg leading-none">Masonic Traveler</p>
            <p className="eyebrow text-gold-400/90 mt-1">Brotherhood Without Borders</p>
          </div>
        </Link>

        <div className="relative">
          <p className="eyebrow text-gold-400 mb-6">Welcome Back, Brother</p>
          <h1 className="font-bold text-5xl xl:text-6xl leading-[1.05] text-balance mb-6">
            Your brethren are<br />
            <span className="text-gold-shine">always nearby.</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Sign in to continue your journey across the global brotherhood.
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
            <p className="eyebrow mb-3">Member Sign In</p>
            <h2 className="text-4xl font-bold text-ink-900 mb-2">
              Welcome back
            </h2>
            <p className="text-ink-600">
              Enter your credentials to continue.
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="brother@example.com"
                />
              </div>
            </div>

            {!useMagicLink && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-ink-800 tracking-luxe">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-gold-700 hover:text-gold-800 tracking-luxe"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useMagicLink}
                onChange={(e) => setUseMagicLink(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-primary-800 focus:ring-2 focus:ring-gold-500/40"
              />
              <span className="text-sm text-ink-700 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-gold-500" />
                Send me a magic link instead
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-masonic w-full group"
            >
              {loading ? (
                'Processing…'
              ) : (
                <>
                  {useMagicLink ? 'Send Magic Link' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-ink-600">
                New to Masonic Traveler?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold text-gold-700 hover:text-gold-800 tracking-luxe"
                >
                  Create an account
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
