'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export interface AddressResult {
  display_name: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  road?: string;
}

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Address autocomplete powered by OpenStreetMap Nominatim (free, no API key).
 * Calls onSelect with parsed lat/lng/city/country when the user picks a result.
 * Debounced 400ms to stay within Nominatim's 1 req/sec usage policy.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address…',
  disabled,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', q);
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '5');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Geocoding failed');
        const data: NominatimSuggestion[] = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Nominatim search failed:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePick = (s: NominatimSuggestion) => {
    const addr = s.address ?? {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.county ||
      '';
    const country = addr.country || '';
    const road = addr.house_number && addr.road
      ? `${addr.house_number} ${addr.road}`
      : addr.road || '';

    const result: AddressResult = {
      display_name: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
      city,
      country,
      road,
    };

    // Pass the road / first segment of display_name to the address field
    onChange(road || s.display_name.split(',')[0]);
    onSelect(result);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-ink-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value.length >= 3) setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          disabled={disabled}
          className="w-full border border-ink-200 rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-500 disabled:bg-ink-50 disabled:text-ink-400"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-ink-400 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 left-0 right-0 max-h-64 overflow-y-auto bg-white border border-ink-100 rounded-lg shadow-luxe-lg">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="w-full text-left px-3 py-2.5 hover:bg-ivory-50 border-b border-ink-50 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-gold-600 mt-0.5 shrink-0" />
                  <span className="text-xs text-ink-700 line-clamp-2">{s.display_name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && value.trim().length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white border border-ink-100 rounded-lg shadow-luxe-lg px-3 py-2 text-xs text-ink-500">
          No matches found. Try a different search.
        </div>
      )}

      <p className="mt-1 text-[10px] text-ink-400">
        Powered by OpenStreetMap · Picking an address auto-fills coordinates & city.
      </p>
    </div>
  );
}
