'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventsService } from '@/lib/events';
import { useAuth } from '@/components/AuthProvider';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Share2,
  CheckCircle,
  Loader2,
  Heart,
  Globe,
  Lock,
} from 'lucide-react';

type RSVPStatus = 'yes' | 'no' | 'maybe';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotif = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await EventsService.getEventDetails(id);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadEvent();
  }, [id]);

  const handleRsvp = async (status: RSVPStatus) => {
    setRsvpLoading(true);
    try {
      await EventsService.rsvpToEvent(id, status);
      await loadEvent();
      showNotif(status === 'yes' ? "You're going!" : status === 'maybe' ? 'Marked as maybe' : 'RSVP updated');
    } catch (err: any) {
      showNotif(err.message || 'RSVP failed', 'error');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckinLoading(true);
    try {
      await EventsService.checkInToEvent(id);
      await loadEvent();
      showNotif('Checked in! Your secretary will confirm your attendance.');
    } catch (err: any) {
      showNotif(err.message || 'Check-in failed', 'error');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/events/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      showNotif('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-4">
        <button onClick={() => router.back()} className="flex items-center text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{error || 'Event not found'}</p>
        </div>
      </div>
    );
  }

  const rsvps = event.rsvps || [];
  const goingCount = rsvps.filter((r: any) => r.status === 'yes').length;
  const maybeCount = rsvps.filter((r: any) => r.status === 'maybe').length;
  const userRsvp = rsvps.find((r: any) => r.user?.first_name && r.user_id === user?.id) ||
    rsvps.find((r: any) => (r.user as any)?.id === user?.id);

  const isToday = new Date(event.start_time).toDateString() === new Date().toDateString();
  const isPast = new Date(event.end_time) < new Date();
  const canCheckIn = isToday && userRsvp?.status === 'yes' && !userRsvp?.checkin_time;
  const hasCheckedIn = !!userRsvp?.checkin_time;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center text-primary-600 hover:text-primary-800 text-sm font-medium">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Events
      </button>

      {/* Event Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                event.type === 'charity' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {event.type === 'charity' ? <><Heart className="h-3 w-3 mr-1" /> Charity</> : <><Calendar className="h-3 w-3 mr-1" /> Meeting</>}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                event.visibility === 'public' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
              }`}>
                {event.visibility === 'public' ? <><Globe className="h-3 w-3 mr-1" /> Public</> : <><Lock className="h-3 w-3 mr-1" /> Members Only</>}
              </span>
              {isPast && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Past</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          </div>
          <button onClick={handleShare} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Share">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {event.description && (
          <p className="text-gray-600 mb-4">{event.description}</p>
        )}

        {/* Date & Time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-700">
            <Clock className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">{formatDate(event.start_time)}</p>
              <p className="text-xs text-gray-500">
                {formatTime(event.start_time)} — {formatTime(event.end_time)}
              </p>
            </div>
          </div>
        </div>

        {/* RSVP Summary */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-700">{goingCount}</div>
            <div className="text-xs text-green-600">Going</div>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-700">{maybeCount}</div>
            <div className="text-xs text-yellow-600">Maybe</div>
          </div>
        </div>

        {/* RSVP Actions */}
        {!isPast && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['yes', 'maybe', 'no'] as RSVPStatus[]).map((status) => {
                const isActive = userRsvp?.status === status;
                const labels: Record<RSVPStatus, string> = { yes: 'Going', maybe: 'Maybe', no: 'Not Going' };
                const colors: Record<RSVPStatus, string> = {
                  yes: isActive ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100',
                  maybe: isActive ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100',
                  no: isActive ? 'bg-gray-600 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100',
                };
                return (
                  <button
                    key={status}
                    onClick={() => handleRsvp(status)}
                    disabled={rsvpLoading}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${colors[status]}`}
                  >
                    {isActive && <CheckCircle className="h-3.5 w-3.5 inline mr-1" />}
                    {labels[status]}
                  </button>
                );
              })}
            </div>

            {/* Check-in */}
            {canCheckIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkinLoading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                {checkinLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                I'm Here — Check In
              </button>
            )}
            {hasCheckedIn && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-700 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4" /> Checked in at {formatTime(userRsvp.checkin_time)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lodge Info */}
      {event.lodge && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" /> Lodge Information
          </h2>
          <div className="space-y-2">
            <p className="font-medium text-gray-900">
              {event.lodge.name} #{event.lodge.number}
            </p>
            {event.lodge.grand_lodge && (
              <p className="text-sm text-gray-600">{event.lodge.grand_lodge}{event.lodge.district && ` — ${event.lodge.district}`}</p>
            )}
            {event.lodge.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <span>{event.lodge.address}, {event.lodge.city}</span>
              </div>
            )}
            {event.lodge.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${event.lodge.contact_email}`} className="text-primary-600 hover:underline">{event.lodge.contact_email}</a>
              </div>
            )}
            {event.lodge.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${event.lodge.contact_phone}`} className="text-primary-600 hover:underline">{event.lodge.contact_phone}</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendees */}
      {rsvps.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" /> Attendees ({goingCount} going)
          </h2>
          <div className="space-y-2">
            {rsvps
              .filter((r: any) => r.status === 'yes')
              .map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{(r.user as any)?.first_name || 'Brother'}</p>
                    <p className="text-xs text-gray-500">{(r.user as any)?.lodge?.name || ''}</p>
                  </div>
                  {r.checkin_time && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Checked in
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
