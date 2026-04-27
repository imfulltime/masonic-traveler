'use client';

import { useState, useEffect, useMemo } from 'react';
import { EventsService } from '@/lib/events';
import { SecretaryService } from '@/lib/secretary';
import { useAuth } from '@/components/AuthProvider';
import { EventWithLodge, LocationCoords } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Search,
  Heart,
  X,
  Loader2,
  Globe,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const EMPTY_FORM = {
  type: 'meeting' as 'meeting' | 'charity',
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  visibility: 'public' as 'public' | 'members',
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default function EventsPage() {
  const { isVerified, user, hasRole } = useAuth();
  const isSecretary = hasRole('secretary');

  const [events, setEvents] = useState<EventWithLodge[]>([]);
  const [myPendingEvents, setMyPendingEvents] = useState<any[]>([]);
  const [lodgeEvents, setLodgeEvents] = useState<any[]>([]);   // secretary only
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'meeting' | 'charity'>('all');
  const [glFilter, setGlFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    ...EMPTY_FORM,
    lodge_id: user?.lodge?.id || '',
  });

  // Edit modal (secretary)
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirm (secretary)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // RSVP / check-in
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showNotif = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLoading(false)
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) loadEvents();
  }, [location]);

  useEffect(() => {
    if (user?.lodge?.id) setCreateForm(p => ({ ...p, lodge_id: user.lodge!.id }));
  }, [user?.lodge?.id]);

  const loadEvents = async () => {
    if (!location) return;
    try {
      setLoading(true);
      const tasks: Promise<any>[] = [
        EventsService.getUpcomingEvents(location, 100),
        EventsService.getMyPendingEvents(),
      ];
      if (isSecretary) tasks.push(SecretaryService.getAllEventsForLodges());

      const [upcoming, pending, lodgeEventsData] = await Promise.all(tasks);
      setEvents(upcoming);
      setMyPendingEvents(pending);
      if (isSecretary) setLodgeEvents(lodgeEventsData);
    } catch (err: any) {
      setError(err.message || 'Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const grandLodges = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) if (e.lodge?.grand_lodge) set.add(e.lodge.grand_lodge);
    return Array.from(set).sort();
  }, [events]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const result = await EventsService.createEvent({
        lodge_id: createForm.lodge_id,
        type: createForm.type,
        title: createForm.title,
        description: createForm.description || undefined,
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        visibility: createForm.visibility,
      });
      const msg = result?.status === 'approved'
        ? 'Event created and approved!'
        : 'Event submitted! Awaiting secretary approval.';
      setCreateSuccess(msg);
      await loadEvents();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
        setCreateForm({ ...EMPTY_FORM, lodge_id: user?.lodge?.id || '' });
      }, 2000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create event');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setEditForm({
      type: event.type,
      title: event.title,
      description: event.description || '',
      start_time: event.start_time ? event.start_time.slice(0, 16) : '',
      end_time: event.end_time ? event.end_time.slice(0, 16) : '',
      visibility: event.visibility,
    });
    setEditError('');
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditError('');
    setEditLoading(true);
    try {
      await SecretaryService.updateEvent(editingEvent.id, {
        type: editForm.type,
        title: editForm.title,
        description: editForm.description || undefined,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        visibility: editForm.visibility,
      });
      setEditingEvent(null);
      await loadEvents();
      showNotif('Event updated!');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update event');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await SecretaryService.deleteEvent(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadEvents();
      showNotif('Event deleted.');
    } catch (err: any) {
      showNotif(err.message || 'Failed to delete event', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await SecretaryService.approveEvent(eventId);
      await loadEvents();
      showNotif('Event approved!');
    } catch (err: any) {
      showNotif(err.message || 'Error approving event', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await SecretaryService.rejectEvent(eventId);
      await loadEvents();
      showNotif('Event rejected.');
    } catch (err: any) {
      showNotif(err.message || 'Error rejecting event', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRsvp = async (eventId: string, status: 'yes' | 'no' | 'maybe') => {
    setRsvpLoading(eventId);
    try {
      await EventsService.rsvpToEvent(eventId, status);
      await loadEvents();
    } catch (err: any) {
      showNotif(err.message || 'RSVP failed. Please try again.', 'error');
    } finally {
      setRsvpLoading(null);
    }
  };

  const handleCheckIn = async (eventId: string) => {
    setCheckinLoading(eventId);
    try {
      await EventsService.checkInToEvent(eventId);
      await loadEvents();
      showNotif('Checked in! Your secretary will confirm your attendance.');
    } catch (err: any) {
      showNotif(err.message || 'Check-in failed. Please try again.', 'error');
    } finally {
      setCheckinLoading(null);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesGL = glFilter === 'all' || event.lodge?.grand_lodge === glFilter;
    const matchesSearch = searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.lodge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.lodge.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesGL && matchesSearch;
  });

  const getEventIcon = (type: string) =>
    type === 'charity' ? <Heart className="h-5 w-5 text-red-500" /> : <Calendar className="h-5 w-5 text-blue-500" />;

  const isEventToday = (startTime: string) =>
    new Date(startTime).toDateString() === new Date().toDateString();

  if (!isVerified) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Calendar className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Verification Required</h2>
          <p className="text-yellow-700">You need to be verified to view lodge events and meetings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-700">{error}</p></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.msg}
          <button onClick={() => setNotification(null)} className="ml-4 opacity-60 hover:opacity-100">&#x2715;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Lodge meetings and charity events</p>
        </div>
        <button className="btn-primary" onClick={() => { setCreateError(''); setCreateSuccess(null); setShowCreateModal(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Create Event
        </button>
      </div>

      {/* ── Secretary: My Lodge Events (full CRUD) ─────────────────────── */}
      {isSecretary && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">My Lodge Events</h2>

          {lodgeEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Calendar className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">No events for your lodge yet. Create one above.</p>
            </div>
          ) : (
            lodgeEvents.map((event) => (
              <div key={event.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                      <StatusBadge status={event.status} />
                      <span className="text-xs text-gray-400 capitalize">{event.type}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(event.start_time)} at {formatTime(event.start_time)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {event.lodge?.name} #{event.lodge?.number}
                      {event.lodge?.grand_lodge ? ` · ${event.lodge.grand_lodge}` : ''}
                    </p>
                    {event.creator && (
                      <p className="text-xs text-gray-400">By {event.creator.first_name}</p>
                    )}
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(event.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                )}

                {/* Approve / Reject only for pending */}
                {event.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApproveEvent(event.id)}
                      disabled={actionLoading === event.id}
                      className="btn-primary flex-1 text-sm py-1.5 flex items-center justify-center"
                    >
                      {actionLoading === event.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectEvent(event.id)}
                      disabled={actionLoading === event.id}
                      className="btn-secondary flex-1 text-sm py-1.5 flex items-center justify-center"
                    >
                      {actionLoading === event.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Regular users: Pending Approval banner ───────────────────────── */}
      {!isSecretary && myPendingEvents.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pending Approval ({myPendingEvents.length})
          </h2>
          {myPendingEvents.map((event) => (
            <div key={event.id} className="bg-white border border-yellow-100 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                <p className="text-xs text-gray-500 capitalize">{event.type} · {formatDate(event.start_time)} at {formatTime(event.start_time)}</p>
                <p className="text-xs text-gray-400">{(event.lodge as any)?.name}</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium whitespace-nowrap ml-3">
                Awaiting approval
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Upcoming Events (approved, all lodges) ────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>

        {/* Search */}
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

        {/* Type filter */}
        <div className="flex space-x-2 flex-wrap gap-y-1">
          {(['all', 'meeting', 'charity'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === f ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f === 'all' ? 'All Types' : f === 'meeting' ? 'Meetings' : 'Charity'}
            </button>
          ))}
        </div>

        {/* Grand Lodge filter */}
        {grandLodges.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setGlFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                glFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Grand Lodges
            </button>
            {grandLodges.map(gl => (
              <button
                key={gl}
                onClick={() => setGlFilter(gl)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  glFilter === gl ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {gl}
              </button>
            ))}
          </div>
        )}

        {/* Events */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p>{searchQuery || typeFilter !== 'all' || glFilter !== 'all' ? 'Try adjusting your filters' : 'No upcoming events in your area'}</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getEventIcon(event.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.lodge.name} #{event.lodge.number}</p>
                    <p className="text-xs text-gray-500">
                      {event.lodge.grand_lodge}{event.lodge.district ? ` · District ${event.lodge.district}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {isEventToday(event.start_time) && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full block mb-1">Today</span>
                  )}
                  <span className="text-xs text-gray-500 capitalize">{event.type}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(event.start_time)} at {formatTime(event.start_time)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.lodge.address}, {event.lodge.city} · {(event as any).distance_km} km away</span>
                </div>
                {event.rsvp_count && event.rsvp_count > 0 && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{event.rsvp_count} attending</span>
                  </div>
                )}
                {event.description && <p className="text-gray-700 mt-2">{event.description}</p>}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  {(['yes', 'maybe', 'no'] as const).map((status) => {
                    const labels = { yes: 'Going', maybe: 'Maybe', no: 'Not Going' };
                    const activeClasses = { yes: 'bg-green-600 text-white', maybe: 'bg-yellow-500 text-white', no: 'bg-red-600 text-white' };
                    return (
                      <button
                        key={status}
                        onClick={() => handleRsvp(event.id, status)}
                        disabled={rsvpLoading === event.id}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          event.user_rsvp?.status === status ? activeClasses[status] : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {rsvpLoading === event.id && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        {labels[status]}
                      </button>
                    );
                  })}
                </div>
                <div>
                  {event.user_rsvp?.checkin_time ? (
                    <span className="text-green-600 text-sm font-medium">Checked In ✓</span>
                  ) : isEventToday(event.start_time) && event.user_rsvp?.status === 'yes' ? (
                    <button
                      onClick={() => handleCheckIn(event.id)}
                      disabled={checkinLoading === event.id}
                      className="btn-primary text-sm flex items-center"
                    >
                      {checkinLoading === event.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      I'm Here
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create Event Modal ─────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Event</h2>
                {isSecretary && <p className="text-xs text-green-600 mt-0.5">As secretary, your events are auto-approved.</p>}
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              {createSuccess && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">{createSuccess}</div>}
              {createError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{createError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lodge</label>
                {user?.lodge ? (
                  <div className="input bg-gray-50 text-gray-700 cursor-not-allowed">{user.lodge.name} #{(user.lodge as any).number}</div>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">You must set a lodge in your profile first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={createForm.type} onChange={e => setCreateForm(p => ({ ...p, type: e.target.value as any }))} className="input" required>
                  <option value="meeting">Meeting</option>
                  <option value="charity">Charity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Regular Communication" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} className="input min-h-[80px] resize-y" placeholder="Add any details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="datetime-local" value={createForm.start_time} onChange={e => setCreateForm(p => ({ ...p, start_time: e.target.value }))} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="datetime-local" value={createForm.end_time} onChange={e => setCreateForm(p => ({ ...p, end_time: e.target.value }))} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select value={createForm.visibility} onChange={e => setCreateForm(p => ({ ...p, visibility: e.target.value as any }))} className="input">
                  <option value="public">Public</option>
                  <option value="members">Members Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createLoading || !user?.lodge || !!createSuccess} className="btn-primary flex items-center">
                  {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isSecretary ? 'Create & Approve' : 'Submit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Event Modal (secretary) ───────────────────────────────────── */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditEvent} className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{editError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as any }))} className="input" required>
                  <option value="meeting">Meeting</option>
                  <option value="charity">Charity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="input min-h-[72px] resize-y" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input type="datetime-local" value={editForm.start_time} onChange={e => setEditForm(p => ({ ...p, start_time: e.target.value }))} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input type="datetime-local" value={editForm.end_time} onChange={e => setEditForm(p => ({ ...p, end_time: e.target.value }))} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select value={editForm.visibility} onChange={e => setEditForm(p => ({ ...p, visibility: e.target.value as any }))} className="input">
                  <option value="public">Public</option>
                  <option value="members">Members Only</option>
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingEvent(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={editLoading} className="btn-primary flex items-center">
                  {editLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Event?</h2>
            <p className="text-sm text-gray-600 mb-6">This cannot be undone. All RSVPs will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
