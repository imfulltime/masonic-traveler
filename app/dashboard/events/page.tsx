'use client';

import { useState, useEffect } from 'react';
import { EventsService } from '@/lib/events';
import { useAuth } from '@/components/AuthProvider';
import { EventWithLodge, LocationCoords } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Plus,
  Filter,
  Search,
  Heart
} from 'lucide-react';

export default function EventsPage() {
  const { isVerified } = useAuth();
  const [events, setEvents] = useState<EventWithLodge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [filter, setFilter] = useState<'all' | 'meeting' | 'charity'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
          console.error('Geolocation error:', error);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      loadEvents();
    }
  }, [location]);

  const loadEvents = async () => {
    if (!location) return;
    
    try {
      setLoading(true);
      const upcomingEvents = await EventsService.getUpcomingEvents(location, 100); // Wider radius for events page
      setEvents(upcomingEvents);
    } catch (err: any) {
      setError(err.message || 'Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.lodge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.lodge.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getEventIcon = (type: string) => {
    return type === 'charity' ? (
      <Heart className="h-5 w-5 text-red-500" />
    ) : (
      <Calendar className="h-5 w-5 text-blue-500" />
    );
  };

  const isEventToday = (startTime: string) => {
    const eventDate = new Date(startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  if (!isVerified) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Calendar className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Verification Required
          </h2>
          <p className="text-yellow-700">
            You need to be verified to view lodge events and meetings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Lodge meetings and charity events</p>
        </div>
        
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events, lodges, or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('meeting')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'meeting'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Meetings
          </button>
          <button
            onClick={() => setFilter('charity')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'charity'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Charity
          </button>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p>
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No upcoming events in your area'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getEventIcon(event.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {event.lodge.name} #{event.lodge.number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.lodge.grand_lodge} • District {event.lodge.district}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {isEventToday(event.start_time) && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full block mb-1">
                      Today
                    </span>
                  )}
                  <span className="text-xs text-gray-500 capitalize">
                    {event.type}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDate(event.start_time)} at {formatTime(event.start_time)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {event.lodge.address}, {event.lodge.city} • {(event as any).distance_km} km away
                  </span>
                </div>

                {event.rsvp_count && event.rsvp_count > 0 && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{event.rsvp_count} attending</span>
                  </div>
                )}

                {event.description && (
                  <p className="text-gray-700 mt-2">{event.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {event.user_rsvp?.status === 'yes' && (
                    <span className="text-green-600 text-sm font-medium">✓ Going</span>
                  )}
                  {event.user_rsvp?.status === 'maybe' && (
                    <span className="text-yellow-600 text-sm font-medium">? Maybe</span>
                  )}
                  {event.user_rsvp?.status === 'no' && (
                    <span className="text-red-600 text-sm font-medium">✗ Not Going</span>
                  )}
                </div>

                <button className="btn-secondary text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
