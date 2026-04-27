'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { NearbyBrethrenMap } from '@/components/NearbyBrethrenMap';
import { LocationCoords } from '@/types';

type GeoState = 'requesting' | 'granted' | 'denied' | 'unavailable';

export default function NearbyPage() {
  const [geoState, setGeoState] = useState<GeoState>('requesting');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState('');

  const requestLocation = () => {
    setGeoState('requesting');
    setError('');

    if (!navigator.geolocation) {
      setGeoState('unavailable');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoState('denied');
          setError('Location permission was denied. Please enable location access in your browser settings and try again.');
        } else {
          setGeoState('unavailable');
          setError('Unable to determine your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  if (geoState === 'requesting') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Locating you…</h2>
        <p className="text-sm text-gray-500">Please allow location access when prompted.</p>
      </div>
    );
  }

  if (geoState === 'denied' || geoState === 'unavailable') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 max-w-sm w-full">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {geoState === 'denied' ? 'Location Access Denied' : 'Location Unavailable'}
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          {geoState === 'unavailable' && (
            <button
              onClick={requestLocation}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
          {geoState === 'denied' && (
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">How to enable location:</p>
              <p>Tap the lock icon in your browser's address bar, then set Location to &ldquo;Allow&rdquo;.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // geoState === 'granted'
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          <h1 className="text-lg font-semibold text-gray-900">Nearby Brethren</h1>
        </div>
        <button
          onClick={requestLocation}
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Refresh location"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Full-height map */}
      {location && (
        <div className="flex-1 relative">
          <NearbyBrethrenMap userLocation={location} />
        </div>
      )}
    </div>
  );
}
