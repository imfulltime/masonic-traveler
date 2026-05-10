'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NearbyBrethrenMap } from '@/components/NearbyBrethrenMap';
import { UpcomingEvents } from '@/components/UpcomingEvents';
import { useAuth } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MapPin, Calendar, ShieldAlert, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, isVerified } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError('Unable to access location. Please enable location services.');
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // ─── Verification Gate ─────────────────────────────────
  if (!isVerified) {
    return (
      <div className="p-6 max-w-xl mx-auto pt-12">
        <div className="card-premium text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy-gradient flex items-center justify-center shadow-luxe">
            <ShieldAlert className="h-8 w-8 text-gold-400" />
          </div>
          <p className="eyebrow mb-3">Members Only</p>
          <h2 className="text-3xl font-bold text-ink-900 mb-3">
            Verification Required
          </h2>
          <p className="text-ink-600 max-w-sm mx-auto mb-8 text-balance">
            To unlock the full brotherhood experience, your status must be verified by a Lodge Secretary.
          </p>
          <button onClick={() => router.push('/verification/required')} className="btn-masonic group">
            Request Verification
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* ─── Welcome banner ──────────────────────────────── */}
      <div className="px-4 pt-6 pb-2">
        <div className="max-w-3xl">
          <p className="eyebrow mb-1.5">Welcome Back</p>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-900 leading-tight">
            Hello, {user?.first_name || 'Brother'}.
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            Here&apos;s what&apos;s happening near you today.
          </p>
        </div>
      </div>

      {/* ─── Nearby Brethren Section ─────────────────────── */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-navy-gradient flex items-center justify-center shadow-luxe">
              <MapPin className="h-4 w-4 text-gold-400" />
            </div>
            <h2 className="text-xl font-bold text-ink-900">Nearby Brethren</h2>
          </div>
        </div>

        {locationError ? (
          <div className="card border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-amber-900 text-sm font-medium mb-2">{locationError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : location ? (
          <ErrorBoundary>
            <div className="rounded-2xl overflow-hidden shadow-luxe border border-ink-100">
              <NearbyBrethrenMap userLocation={location} />
            </div>
          </ErrorBoundary>
        ) : (
          <div className="card flex items-center justify-center h-64 bg-ivory-100">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-primary-800 mx-auto mb-2 animate-spin" />
              <p className="text-ink-600 text-sm tracking-luxe">Locating your position…</p>
            </div>
          </div>
        )}
      </section>

      {/* ─── Upcoming Events Section ─────────────────────── */}
      <section className="px-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold">
              <Calendar className="h-4 w-4 text-ink-900" />
            </div>
            <h2 className="text-xl font-bold text-ink-900">Next 7 Days</h2>
          </div>
          <button
            onClick={() => router.push('/dashboard/events')}
            className="text-xs font-semibold text-gold-700 hover:text-gold-800 tracking-luxe flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {location ? (
          <ErrorBoundary>
            <UpcomingEvents userLocation={location} />
          </ErrorBoundary>
        ) : (
          <div className="card text-center py-8">
            <p className="text-ink-500 text-sm">Location required to show nearby events.</p>
          </div>
        )}
      </section>
    </div>
  );
}
