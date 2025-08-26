'use client';

import { useState, useEffect } from 'react';
import { EventsService } from '@/lib/events';
import { EventWithLodge, LocationCoords, RSVPStatus } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Check, 
  X, 
  HelpCircle,
  Heart
} from 'lucide-react';

interface UpcomingEventsProps {
  userLocation: LocationCoords;
}

export function UpcomingEvents({ userLocation }: UpcomingEventsProps) {
  const [events, setEvents] = useState<EventWithLodge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, [userLocation]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const upcomingEvents = await EventsService.getUpcomingEvents(userLocation);
      setEvents(upcomingEvents);
    } catch (err: any) {
      setError(err.message || 'Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, status: RSVPStatus) => {
    try {
      await EventsService.rsvpToEvent(eventId, status);
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                user_rsvp: { 
                  id: event.user_rsvp?.id || '', 
                  event_id: eventId, 
                  user_id: event.user_rsvp?.user_id || '', 
                  status, 
                  checkin_time: event.user_rsvp?.checkin_time || null,
                  created_at: event.user_rsvp?.created_at || new Date().toISOString()
                },
                rsvp_count: status === 'yes' 
                  ? (event.rsvp_count || 0) + 1 
                  : Math.max(0, (event.rsvp_count || 0) - 1)
              }
            : event
        )
      );
    } catch (err: any) {
      alert(err.message || 'Error updating RSVP');
    }
  };

  const handleCheckIn = async (eventId: string) => {
    try {
      await EventsService.checkInToEvent(eventId);
      alert('Checked in successfully! A secretary will confirm your attendance.');
    } catch (err: any) {
      alert(err.message || 'Error checking in');
    }
  };

  const getRSVPButton = (event: EventWithLodge) => {
    const userStatus = event.user_rsvp?.status;
    
    const buttonClass = (status: RSVPStatus, isActive: boolean) => 
      `p-2 rounded-lg transition-colors ${
        isActive
          ? status === 'yes' ? 'bg-green-100 text-green-700' :
            status === 'no' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`;

    return (
      <div className="flex space-x-1">
        <button
          onClick={() => handleRSVP(event.id, 'yes')}
          className={buttonClass('yes', userStatus === 'yes')}
          title="Going"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleRSVP(event.id, 'maybe')}
          className={buttonClass('maybe', userStatus === 'maybe')}
          title="Maybe"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleRSVP(event.id, 'no')}
          className={buttonClass('no', userStatus === 'no')}
          title="Not Going"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

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

  const canCheckIn = (event: EventWithLodge) => {
    if (event.user_rsvp?.status !== 'yes') return false;
    if (event.user_rsvp?.checkin_time) return false;
    
    const eventStart = new Date(event.start_time);
    const now = new Date();
    const hourBeforeEvent = new Date(eventStart.getTime() - 60 * 60 * 1000);
    const hourAfterStart = new Date(eventStart.getTime() + 60 * 60 * 1000);
    
    return now >= hourBeforeEvent && now <= hourAfterStart;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading upcoming events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p>No upcoming events in your area</p>
        <p className="text-sm">Check back later for new meetings and events</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="card">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getEventIcon(event.type)}
              <div>
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600">
                  {event.lodge.name} #{event.lodge.number}
                </p>
              </div>
            </div>
            
            {isEventToday(event.start_time) && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Today
              </span>
            )}
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
                {event.lodge.city} • {(event as any).distance_km} km away
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
            {getRSVPButton(event)}
            
            {canCheckIn(event) && (
              <button
                onClick={() => handleCheckIn(event.id)}
                className="btn-primary text-sm"
              >
                I'm Here
              </button>
            )}

            {event.user_rsvp?.checkin_time && (
              <span className="text-green-600 text-sm font-medium">
                ✓ Checked In
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
