'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PresenceService } from '@/lib/presence';
import { NearbyBrother, LocationCoords } from '@/types';
import { Users, MessageCircle, MapPin } from 'lucide-react';

interface NearbyBrethrenMapProps {
  userLocation: LocationCoords;
}

export function NearbyBrethrenMap({ userLocation }: NearbyBrethrenMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [nearbyBrethren, setNearbyBrethren] = useState<NearbyBrother[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedBrother, setSelectedBrother] = useState<NearbyBrother | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
    });

    map.current.addControl(new NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [userLocation]);

  useEffect(() => {
    loadNearbyBrethren();
    updatePresence();
  }, [userLocation]);

  const updatePresence = async () => {
    try {
      await PresenceService.updatePresence(userLocation);
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  };

  const loadNearbyBrethren = async () => {
    try {
      setLoading(true);
      const brethren = await PresenceService.getNearbyBrethren(userLocation);
      setNearbyBrethren(brethren);
      
      if (map.current) {
        // Add markers for nearby brethren
        brethren.forEach((brother) => {
          // Create marker element
          const el = document.createElement('div');
          el.className = 'masonic-marker';
          el.style.cssText = `
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
            border: 3px solid white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          `;
          
          // Add compass icon
          const icon = document.createElement('div');
          icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          `;
          el.appendChild(icon);

          // Add click handler
          el.addEventListener('click', () => {
            setSelectedBrother(brother);
          });

          // Add marker to map
          new Marker({ element: el })
            .setLngLat(brother.approx_circle.center)
            .addTo(map.current!);
        });

        // Add user location marker
        const userEl = document.createElement('div');
        userEl.style.cssText = `
          width: 20px;
          height: 20px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        new Marker({ element: userEl })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map.current!);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading nearby brethren');
    } finally {
      setLoading(false);
    }
  };

  const handleSendIntroRequest = async (brotherId: string) => {
    try {
      await PresenceService.sendIntroRequest(brotherId);
      setSelectedBrother(null);
      alert('Intro request sent! They will be notified.');
    } catch (err: any) {
      alert(err.message || 'Error sending intro request');
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full h-64 rounded-lg overflow-hidden"
        />
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Finding nearby brethren...</p>
            </div>
          </div>
        )}
      </div>

      {/* Nearby Brethren List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Nearby Brethren ({nearbyBrethren.length})
          </h3>
          <button
            onClick={loadNearbyBrethren}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Refresh
          </button>
        </div>

        {nearbyBrethren.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No brethren nearby at the moment</p>
            <p className="text-sm">They'll appear here when they're active</p>
          </div>
        ) : (
          <div className="space-y-2">
            {nearbyBrethren.map((brother) => (
              <div
                key={brother.id}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">{brother.label}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      ~{brother.distance_km} km away
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBrother(brother)}
                  className="btn-primary text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intro Request Modal */}
      {selectedBrother && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Send Greeting</h3>
            <p className="text-gray-600 mb-4">
              Would you like to send a greeting to this {selectedBrother.label}?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleSendIntroRequest(selectedBrother.id)}
                className="btn-primary flex-1"
              >
                Send Greeting
              </button>
              <button
                onClick={() => setSelectedBrother(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
