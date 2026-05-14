'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Map, NavigationControl, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/lib/supabase';
import { formatDate, formatTime } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Clock,
  Navigation,
  Loader2,
  AlertCircle,
  Heart,
  Globe,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface Lodge {
  id: string;
  name: string;
  number: string;
  grand_lodge: string;
  district: string | null;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  meeting_schedule: string | null;
}

interface LodgeEvent {
  id: string;
  title: string;
  description: string | null;
  type: 'meeting' | 'charity';
  start_time: string;
  end_time: string;
  visibility: 'public' | 'members';
}

/**
 * Build a "Get Directions" URL that opens the user's native map app.
 * - iOS Safari → uses maps:// (opens Apple Maps)
 * - Android → uses geo: URI
 * - Desktop / fallback → opens google.com/maps in a new tab
 */
function buildDirectionsUrl(lat: number, lng: number, label?: string): string {
  if (typeof window === 'undefined') return '#';
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod|Macintosh/.test(ua) && 'ontouchend' in document;

  if (isIOS) {
    // Apple Maps — daddr = destination address (lat,lng), q = label
    return `maps://?daddr=${lat},${lng}&q=${encodeURIComponent(label || '')}`;
  }
  // Universal Google Maps directions link (works on Android via intent + on web)
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${
    label ? `&destination_place_id=&travelmode=driving` : ''
  }`;
}

export default function LodgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [events, setEvents] = useState<LodgeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load lodge + upcoming events in parallel
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const [{ data: lodgeData, error: lodgeErr }, { data: eventsData, error: eventsErr }] =
          await Promise.all([
            supabase
              .from('lodges')
              .select('id, name, number, grand_lodge, district, address, city, state, zip_code, country, lat, lng, contact_email, contact_phone, meeting_schedule')
              .eq('id', id)
              .single(),
            supabase
              .from('events')
              .select('id, title, description, type, start_time, end_time, visibility')
              .eq('lodge_id', id)
              .eq('status', 'approved')
              .gte('end_time', new Date().toISOString())
              .order('start_time', { ascending: true })
              .limit(20),
          ]);

        if (cancelled) return;
        if (lodgeErr) throw lodgeErr;
        if (eventsErr) throw eventsErr;

        setLodge(lodgeData as unknown as Lodge);
        setEvents((eventsData || []) as unknown as LodgeEvent[]);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load lodge details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Initialize the map after the lodge data loads
  useEffect(() => {
    if (!lodge || !lodge.lat || !lodge.lng || !mapContainer.current || mapRef.current) return;

    mapRef.current = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO',
          },
        },
        layers: [
          { id: 'simple-tiles', type: 'raster', source: 'raster-tiles', minzoom: 0, maxzoom: 22 },
        ],
      },
      center: [lodge.lng, lodge.lat],
      zoom: 15,
    });

    mapRef.current.addControl(new NavigationControl(), 'top-right');

    // Gold temple pin marker (matches NearbyBrethrenMap styling)
    const el = document.createElement('div');
    el.style.cssText = `
      width: 44px; height: 52px;
      filter: drop-shadow(0 4px 6px rgba(10,21,56,0.35));
    `;
    el.innerHTML = `
      <svg width="44" height="52" viewBox="0 0 44 52" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldPin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E8C76B"/>
            <stop offset="50%" stop-color="#D4AF37"/>
            <stop offset="100%" stop-color="#B8862C"/>
          </linearGradient>
        </defs>
        <path d="M22 0 C9.8 0 0 9.6 0 21.5 C0 36 22 52 22 52 C22 52 44 36 44 21.5 C44 9.6 34.2 0 22 0 Z"
          fill="url(#goldPin)" stroke="#0a1538" stroke-width="1.5"/>
        <path d="M11 17 L22 9 L33 17 Z" fill="#0a1538"/>
        <rect x="10" y="17" width="24" height="2" fill="#0a1538"/>
        <rect x="12" y="20" width="2.5" height="10" fill="#0a1538"/>
        <rect x="17" y="20" width="2.5" height="10" fill="#0a1538"/>
        <rect x="22" y="20" width="2.5" height="10" fill="#0a1538"/>
        <rect x="27" y="20" width="2.5" height="10" fill="#0a1538"/>
        <rect x="10" y="30" width="24" height="2.5" fill="#0a1538"/>
      </svg>
    `;

    new Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lodge.lng, lodge.lat])
      .addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lodge]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-800" />
      </div>
    );
  }

  if (error || !lodge) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-gold-700 mb-4 text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 font-medium">{error || 'Lodge not found'}</p>
        </div>
      </div>
    );
  }

  // Compose a clean address line: "123 Main St, City, State 12345, Country"
  const cityStatePart = [lodge.city, lodge.state].filter(Boolean).join(', ')
    + (lodge.zip_code ? ` ${lodge.zip_code}` : '');
  const fullAddress = [lodge.address, cityStatePart, lodge.country]
    .filter((p) => p && p.trim())
    .join(', ');
  const hasGeotag = lodge.lat !== null && lodge.lng !== null && (lodge.lat !== 0 || lodge.lng !== 0);

  return (
    <div className="pb-16 max-w-3xl mx-auto">
      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gold-700 hover:text-gold-800 text-sm font-medium tracking-luxe"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
      </div>

      {/* ─── Hero / Header card ────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="card-premium">
          <p className="eyebrow mb-2">{lodge.grand_lodge}{lodge.district && ` · ${lodge.district}`}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-900 leading-tight">
            {lodge.name}
            <span className="text-gold-700 ml-2 font-normal">#{lodge.number}</span>
          </h1>
          {fullAddress && (
            <p className="text-ink-600 text-sm mt-2 flex items-start gap-1.5">
              <MapPin className="h-4 w-4 text-gold-600 mt-0.5 shrink-0" />
              <span>{fullAddress}</span>
            </p>
          )}

          {/* Get Directions — the main CTA */}
          {hasGeotag && (
            <a
              href={buildDirectionsUrl(lodge.lat!, lodge.lng!, `${lodge.name} #${lodge.number}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-5 w-full sm:w-auto inline-flex group"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
              <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
        </div>
      </div>

      {/* ─── Map preview ───────────────────────────────────── */}
      {hasGeotag && (
        <div className="px-4 pt-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-navy-gradient flex items-center justify-center shadow-luxe">
              <MapPin className="h-4 w-4 text-gold-400" />
            </div>
            <h2 className="text-lg font-bold text-ink-900">Location</h2>
          </div>
          <div
            ref={mapContainer}
            className="w-full h-64 rounded-2xl overflow-hidden shadow-luxe border border-ink-100"
          />
          <p className="text-[11px] text-ink-400 mt-1.5 text-center">
            Tap "Get Directions" above to open in your map app.
          </p>
        </div>
      )}

      {/* ─── Meeting schedule ──────────────────────────────── */}
      {lodge.meeting_schedule && (
        <div className="px-4 pt-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold">
              <Clock className="h-4 w-4 text-ink-900" />
            </div>
            <h2 className="text-lg font-bold text-ink-900">Regular Meeting Schedule</h2>
          </div>
          <div className="card">
            <p className="text-ink-800 leading-relaxed">{lodge.meeting_schedule}</p>
          </div>
        </div>
      )}

      {/* ─── Upcoming events ───────────────────────────────── */}
      <div className="px-4 pt-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-navy-gradient flex items-center justify-center shadow-luxe">
            <Calendar className="h-4 w-4 text-gold-400" />
          </div>
          <h2 className="text-lg font-bold text-ink-900">
            Upcoming Events
            <span className="text-ink-400 font-normal ml-2 text-sm">({events.length})</span>
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="card text-center py-8 text-ink-500 text-sm">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-ink-300" />
            No upcoming events scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="card hover:shadow-luxe transition-shadow block group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                    event.type === 'charity' ? 'bg-pink-50 text-pink-700' : 'bg-primary-50 text-primary-800'
                  }`}>
                    {event.type === 'charity' ? <Heart className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`badge ${event.visibility === 'public' ? 'badge-navy' : 'badge-warning'} text-[10px]`}>
                        {event.visibility === 'public' ? <><Globe className="h-2.5 w-2.5" /> Public</> : <><Lock className="h-2.5 w-2.5" /> Members</>}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink-900 group-hover:text-gold-700 transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {formatDate(event.start_time)} · {formatTime(event.start_time)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-gold-600 transition-colors self-center shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── Contact ───────────────────────────────────────── */}
      {(lodge.contact_email || lodge.contact_phone) && (
        <div className="px-4 pt-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold">
              <Mail className="h-4 w-4 text-ink-900" />
            </div>
            <h2 className="text-lg font-bold text-ink-900">Contact</h2>
          </div>
          <div className="card space-y-2">
            {lodge.contact_email && (
              <a
                href={`mailto:${lodge.contact_email}`}
                className="flex items-center gap-2 text-sm text-gold-700 hover:text-gold-800"
              >
                <Mail className="h-4 w-4 text-ink-400" />
                {lodge.contact_email}
              </a>
            )}
            {lodge.contact_phone && (
              <a
                href={`tel:${lodge.contact_phone}`}
                className="flex items-center gap-2 text-sm text-gold-700 hover:text-gold-800"
              >
                <Phone className="h-4 w-4 text-ink-400" />
                {lodge.contact_phone}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
