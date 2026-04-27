'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map, NavigationControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PresenceService } from '@/lib/presence';
import { MessagingService } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import { NearbyBrother, LocationCoords } from '@/types';
import { Users, MessageCircle, MapPin, Building2 } from 'lucide-react';

interface NearbyBrethrenMapProps {
  userLocation: LocationCoords;
}

export function NearbyBrethrenMap({ userLocation }: NearbyBrethrenMapProps) {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [nearbyBrethren, setNearbyBrethren] = useState<NearbyBrother[]>([]);
  const [nearbyLodges, setNearbyLodges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedBrother, setSelectedBrother] = useState<NearbyBrother | null>(null);
  const [selectedLodge, setSelectedLodge] = useState<any | null>(null);
  const [messagingBrotherId, setMessagingBrotherId] = useState<string | null>(null);

  // Initialize the map exactly once — no location in deps
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new Map({
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
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
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
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center map and refresh markers when location or nearby users change
  useEffect(() => {
    if (map.current) {
      map.current.setCenter([userLocation.lng, userLocation.lat]);
    }
    loadNearbyBrethren();
    updatePresence();
  }, [userLocation.lat, userLocation.lng]);

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
      setError('');
      const brethren = await PresenceService.getNearbyBrethren(userLocation);
      setNearbyBrethren(brethren);

      // Fetch nearby lodges using a bounding box (~0.5 deg ≈ 55 km)
      const delta = 0.5;
      const { data: lodgeData } = await supabase
        .from('lodges')
        .select('id, name, number, lat, lng, address, city')
        .gte('lat', userLocation.lat - delta)
        .lte('lat', userLocation.lat + delta)
        .gte('lng', userLocation.lng - delta)
        .lte('lng', userLocation.lng + delta);
      setNearbyLodges(lodgeData || []);

      if (map.current) {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add markers for nearby brethren
        brethren.forEach((brother) => {
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

          const icon = document.createElement('div');
          icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          `;
          el.appendChild(icon);

          el.addEventListener('click', () => {
            setSelectedBrother(brother);
          });

          const marker = new Marker({ element: el })
            .setLngLat(brother.approx_circle.center)
            .addTo(map.current!);
          markersRef.current.push(marker);
        });

        // Add markers for nearby lodges
        (lodgeData || []).forEach((lodge: any) => {
          if (!lodge.lat || !lodge.lng) return;

          const lodgeEl = document.createElement('div');
          lodgeEl.className = 'lodge-marker';
          lodgeEl.style.cssText = `
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #92400e 0%, #d97706 100%);
            border: 2px solid white;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          `;

          const lodgeIcon = document.createElement('div');
          lodgeIcon.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          `;
          lodgeEl.appendChild(lodgeIcon);

          lodgeEl.addEventListener('click', () => {
            setSelectedLodge(lodge);
          });

          const lodgeMarker = new Marker({ element: lodgeEl })
            .setLngLat([lodge.lng, lodge.lat])
            .addTo(map.current!);
          markersRef.current.push(lodgeMarker);
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

        const userMarker = new Marker({ element: userEl })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map.current!);
        markersRef.current.push(userMarker);
      }
    } catch (err: any) {
      console.error('Error loading nearby brethren:', err);
      setError(err.message || 'Error loading nearby brethren');
    } finally {
      setLoading(false);
    }
  };

  const handleSendIntroRequest = async (brotherId: string) => {
    try {
      await PresenceService.sendIntroRequest(brotherId);
      setSelectedBrother(null);
    } catch (err: any) {
      console.error('Error sending intro request:', err);
    }
  };

  const handleStartMessage = async (brotherId: string) => {
    try {
      setMessagingBrotherId(brotherId);
      const conversationId = await MessagingService.createConversation(brotherId);
      router.push(`/dashboard/messages/${conversationId}`);
    } catch (err: any) {
      console.error('Error starting conversation:', err);
    } finally {
      setMessagingBrotherId(null);
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

      {/* Selected Lodge Info Panel */}
      {selectedLodge && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedLodge.name}
                  {selectedLodge.number ? ` #${selectedLodge.number}` : ''}
                </p>
                {selectedLodge.city && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedLodge.city}
                  </p>
                )}
                {selectedLodge.address && (
                  <p className="text-sm text-gray-500">{selectedLodge.address}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedLodge(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
              aria-label="Close lodge info"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartMessage(brother.id)}
                    disabled={messagingBrotherId === brother.id}
                    className="btn-primary text-sm flex items-center space-x-1"
                    title="Message"
                  >
                    {messagingBrotherId === brother.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => setSelectedBrother(brother)}
                    className="btn-secondary text-sm"
                    title="Send greeting"
                  >
                    Greet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Lodges List */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">
          Nearby Lodges ({nearbyLodges.length})
        </h3>

        {nearbyLodges.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No lodges found in your area</p>
          </div>
        ) : (
          <div className="space-y-2">
            {nearbyLodges.map((lodge) => (
              <div
                key={lodge.id}
                className="card flex items-center space-x-3 cursor-pointer hover:bg-amber-50 transition-colors"
                onClick={() => setSelectedLodge(lodge)}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {lodge.name}
                    {lodge.number ? ` #${lodge.number}` : ''}
                  </p>
                  {lodge.city && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {lodge.city}
                    </p>
                  )}
                </div>
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
