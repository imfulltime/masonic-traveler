'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Calendar, MapPin, Shield, ArrowRight, Sparkles, Globe2, Lock } from 'lucide-react';

export default function HomePage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 text-ink-900">
      {/* ─── Hero ─────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-navy-gradient text-white">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(212,175,55,0.5) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />

        {/* Top nav */}
        <nav className="relative container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="monogram">MT</span>
            <div>
              <p className="font-serif font-bold text-lg leading-none">Masonic Traveler</p>
              <p className="eyebrow text-gold-400/90 mt-1">Brotherhood Without Borders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showInstallPrompt && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-colors text-sm font-medium tracking-luxe"
              >
                <Sparkles className="h-4 w-4 text-gold-400" />
                Install App
              </button>
            )}
            <Link
              href="/auth/login"
              className="text-white/90 hover:text-gold-400 transition-colors text-sm font-medium tracking-luxe"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative container mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32 text-center">
          <p className="eyebrow text-gold-400 mb-6 animate-fade-in">EST. ESTABLISHED FOR THE CRAFT</p>

          <h1 className="font-serif font-bold leading-[1.05] tracking-tight text-balance text-5xl sm:text-6xl md:text-7xl mb-6 animate-slide-up">
            Brotherhood,<br />
            <span className="text-gold-shine">refined for the road.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/70 leading-relaxed text-balance mb-10 animate-fade-in">
            A privacy-first platform for verified Freemasons. Find nearby brethren,
            discover lodge meetings, and travel the world with brothers at your side.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Link href="/auth/register" className="btn-gold w-full sm:w-auto group">
              Get Started
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-white/90 hover:text-white border border-white/20 hover:border-gold-400/60 transition-all text-sm font-medium tracking-luxe"
            >
              I&apos;m already a member
            </Link>
          </div>

          {/* Decorative gold divider */}
          <div className="mt-16 max-w-xs mx-auto divider-gold" />
        </div>
      </header>

      {/* ─── Features ──────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="eyebrow mb-4">Why Brethren Choose Us</p>
            <h2 className="text-balance">Designed for the discerning traveler</h2>
            <p className="text-ink-600 max-w-xl mx-auto mt-4 text-lg">
              Every feature is built around three principles: brotherhood, privacy, and trust.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Globe2, title: 'Find Brethren', body: 'Discover verified Masons within your travel radius — anywhere in the world.' },
              { icon: Calendar, title: 'Lodge Meetings', body: 'Browse upcoming meetings, charity events, and RSVP with one tap.' },
              { icon: Lock, title: 'Privacy First', body: 'Your exact location is fuzzed by 250–500m. Always. No exceptions.' },
              { icon: Shield, title: 'Verified Only', body: 'Secretary approval and member vouching ensure genuine brotherhood.' },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="card-premium hover:shadow-luxe-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-navy-gradient flex items-center justify-center mb-4 shadow-luxe group-hover:shadow-gold-glow transition-shadow">
                  <Icon className="h-6 w-6 text-gold-400" />
                </div>
                <h3 className="font-serif font-bold text-lg mb-2 text-ink-900">{title}</h3>
                <p className="text-ink-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ────────────────────────────────── */}
      <section className="relative px-6 pb-20">
        <div className="container mx-auto max-w-5xl">
          <div className="relative card-dark text-center px-8 py-16 md:px-16 md:py-20 overflow-hidden">
            {/* Decorative gold accents */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gold-gradient" />

            <Compass className="h-10 w-10 text-gold-400 mx-auto mb-6 opacity-80" />
            <h2 className="font-serif font-bold text-balance text-3xl md:text-5xl mb-4 text-white">
              Where will the Craft<br />take you next?
            </h2>
            <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
              Join the platform built for brethren who travel — and the brothers who welcome them home.
            </p>
            <Link href="/auth/register" className="btn-gold inline-flex group">
              Begin Your Journey
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────── */}
      <footer className="bg-ink-950 text-ink-300 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="monogram">MT</span>
              <div>
                <p className="font-serif font-bold text-white">Masonic Traveler</p>
                <p className="text-xs text-ink-500">An independent platform for the traveling Mason.</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs tracking-luxe">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-gold-500" /> Privacy by design
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-gold-500" /> Brotherhood first
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-gold-500" /> Open source
              </span>
            </div>
          </div>

          <div className="divider-gold mt-8 mb-6" />

          <p className="text-center text-xs text-ink-500">
            Not officially affiliated with any Grand Lodge. Built with respect for the Craft.
          </p>
        </div>
      </footer>
    </div>
  );
}
