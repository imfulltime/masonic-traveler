'use client';

import { useState, useEffect } from 'react';
import { NearbyBrethrenMap } from '@/components/NearbyBrethrenMap';
import { UpcomingEvents } from '@/components/UpcomingEvents';
import { useAuth } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MapPin, Calendar, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user, isVerified } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  useEffect(() => {
    // Get user location
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
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  if (!isVerified) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Verification Required
          </h2>
          <p className="text-yellow-700 mb-4">
            You need to be verified by a Lodge Secretary to access the full features of Masonic Traveler.
          </p>
          <button className="btn-primary">
            Request Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nearby Brethren Section */}
      <section className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Nearby Brethren</h2>
        </div>

        {locationError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{locationError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 btn-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        ) : location ? (
          <ErrorBoundary>
            <NearbyBrethrenMap userLocation={location} />
          </ErrorBoundary>
        ) : (
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Getting your location...</p>
            </div>
          </div>
        )}
      </section>

      {/* Upcoming Events Section */}
      <section className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Next 7 Days</h2>
        </div>

        {location ? (
          <ErrorBoundary>
            <UpcomingEvents userLocation={location} />
          </ErrorBoundary>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-gray-600 text-center">
              Location required to show nearby events
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
