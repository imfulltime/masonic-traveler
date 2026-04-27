'use client';

import { useState, useEffect } from 'react';
import { SecretaryService } from '@/lib/secretary';
import { VerificationService } from '@/lib/verification';
import { useAuth } from '@/components/AuthProvider';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Shield,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  UserCheck,
  HelpCircle,
  UserX,
} from 'lucide-react';

const EMPTY_EVENT_FORM = {
  lodge_id: '',
  type: 'meeting' as 'meeting' | 'charity',
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  visibility: 'public' as 'public' | 'members',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default function SecretaryPage() {
  const { user, hasRole } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [allLodgeEvents, setAllLodgeEvents] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'events' | 'activities'>('overview');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Create event modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_EVENT_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit event modal
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EVENT_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Attendee modal
  const [attendeeEvent, setAttendeeEvent] = useState<any | null>(null);
  const [attendees, setAttendees] = useState<{ going: any[]; maybe: any[]; notGoing: any[]; checkedIn: any[]; total: number } | null>(null);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (hasRole('secretary')) {
      loadSecretaryData();
    }
  }, [hasRole]);

  const loadSecretaryData = async () => {
    try {
      setLoading(true);
      const [summaryData, verificationsData, allEventsData, activitiesData, pendingCheckInsData] = await Promise.all([
        SecretaryService.getDashboardSummary(),
        VerificationService.getPendingVerifications(),
        SecretaryService.getAllEventsForLodges(),
        SecretaryService.getRecentActivities(),
        SecretaryService.getPendingCheckIns(),
      ]);

      setSummary(summaryData);
      setPendingVerifications(verificationsData);
      setAllLodgeEvents(allEventsData);
      setRecentActivities(activitiesData);
      setPendingCheckIns(pendingCheckInsData);
    } catch (err) {
      console.error('Error loading secretary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (verificationId: string) => {
    try {
      await VerificationService.approveVerification(verificationId);
      await loadSecretaryData();
      showNotification('Verification approved successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error approving verification', 'error');
    }
  };

  const handleRejectVerification = async (verificationId: string) => {
    try {
      await VerificationService.rejectVerification(verificationId);
      await loadSecretaryData();
      showNotification('Verification rejected.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error rejecting verification', 'error');
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await SecretaryService.approveEvent(eventId);
      await loadSecretaryData();
      showNotification('Event approved!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error approving event', 'error');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await SecretaryService.rejectEvent(eventId);
      await loadSecretaryData();
      showNotification('Event rejected.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error rejecting event', 'error');
    }
  };

  const handleConfirmActivity = async (activity: any) => {
    try {
      if (activity.event?.type === 'charity') {
        await SecretaryService.confirmCharity(activity.user_id, activity.event_id);
      } else {
        await SecretaryService.confirmVisit(activity.user_id, activity.event?.lodge_id, activity.event_id);
      }
      await loadSecretaryData();
      showNotification('Activity confirmed!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error confirming activity', 'error');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await SecretaryService.createEvent({
        lodge_id: createForm.lodge_id,
        type: createForm.type,
        title: createForm.title,
        description: createForm.description || undefined,
        start_time: createForm.start_time,
        end_time: createForm.end_time,
        visibility: createForm.visibility,
      });
      setShowCreateModal(false);
      setCreateForm(EMPTY_EVENT_FORM);
      await loadSecretaryData();
      showNotification('Event created and approved!', 'success');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create event');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setEditForm({
      lodge_id: event.lodge?.id || '',
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
      await loadSecretaryData();
      showNotification('Event updated!', 'success');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update event');
    } finally {
      setEditLoading(false);
    }
  };

  const openAttendeesModal = async (event: any) => {
    setAttendeeEvent(event);
    setAttendees(null);
    setAttendeesLoading(true);
    try {
      const data = await SecretaryService.getEventAttendees(event.id);
      setAttendees(data);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load attendees', 'error');
      setAttendeeEvent(null);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    try {
      await SecretaryService.deleteEvent(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadSecretaryData();
      showNotification('Event deleted.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete event', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const pendingCount = allLodgeEvents.filter(e => e.status === 'pending').length;

  if (!hasRole('secretary')) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">Only Lodge Secretaries can access this console.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading secretary console...</p>
        </div>
      </div>
    );
  }

  const EventFormFields = ({
    form,
    onChange,
    lodges,
    showLodgePicker,
  }: {
    form: typeof EMPTY_EVENT_FORM;
    onChange: (f: typeof EMPTY_EVENT_FORM) => void;
    lodges: any[];
    showLodgePicker: boolean;
  }) => (
    <>
      {showLodgePicker && lodges.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lodge</label>
          <select
            value={form.lodge_id}
            onChange={e => onChange({ ...form, lodge_id: e.target.value })}
            className="input"
            required
          >
            <option value="">Select lodge…</option>
            {lodges.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name} #{l.number}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select value={form.type} onChange={e => onChange({ ...form, type: e.target.value as any })} className="input" required>
          <option value="meeting">Meeting</option>
          <option value="charity">Charity</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={form.title} onChange={e => onChange({ ...form, title: e.target.value })} className="input" placeholder="e.g. Regular Communication" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea value={form.description} onChange={e => onChange({ ...form, description: e.target.value })} className="input min-h-[72px] resize-y" placeholder="Details about this event…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
          <input type="datetime-local" value={form.start_time} onChange={e => onChange({ ...form, start_time: e.target.value })} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
          <input type="datetime-local" value={form.end_time} onChange={e => onChange({ ...form, end_time: e.target.value })} className="input" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select value={form.visibility} onChange={e => onChange({ ...form, visibility: e.target.value as any })} className="input">
          <option value="public">Public</option>
          <option value="members">Members Only</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Notification banner */}
      {notification && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 text-current opacity-60 hover:opacity-100">&#x2715;</button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Secretary Console</h1>
        <p className="text-gray-600">Manage verifications, events, and confirmations</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'verifications', label: 'Verifications', icon: Shield },
          { id: 'events', label: 'Events', icon: Calendar },
          { id: 'activities', label: 'Activities', icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Lodges</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {summary.lodges.map((lodge: any) => (
                <div key={lodge.id} className="card">
                  <h3 className="font-semibold text-gray-900">{lodge.name} #{lodge.number}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">{summary.pending_verifications}</div>
              <div className="text-sm text-gray-600">Pending Verifications</div>
            </div>
            <div className="card text-center">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending Events</div>
            </div>
            <div className="card text-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">{summary.recent_confirmations}</div>
              <div className="text-sm text-gray-600">Recent Confirmations</div>
            </div>
          </div>
        </div>
      )}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Verifications ({pendingVerifications.length})
          </h2>

          {pendingVerifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending verifications</h3>
              <p>All verification requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((verification) => (
                <div key={verification.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{verification.subject_user?.first_name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-600">{verification.subject_user?.email}</p>
                      <p className="text-sm text-gray-500">{verification.lodge?.name} #{verification.lodge?.number}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        verification.method === 'secretary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {verification.method === 'secretary' ? 'Secretary' : 'Vouch'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(verification.created_at)}</p>
                    </div>
                  </div>
                  {verification.method === 'vouch' && verification.vouches && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Vouches ({verification.vouches.length}):</h4>
                      <div className="space-y-1">
                        {verification.vouches.map((vouch: any) => (
                          <div key={vouch.id} className="text-sm text-gray-600">
                            {vouch.voucher?.first_name} from {vouch.voucher?.lodge?.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button onClick={() => handleApproveVerification(verification.id)} className="btn-primary flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </button>
                    <button onClick={() => handleRejectVerification(verification.id)} className="btn-secondary flex-1">
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Tab — Full CRUD */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lodge Events ({allLodgeEvents.length})
            </h2>
            <button
              onClick={() => {
                const firstLodge = summary?.lodges?.[0];
                setCreateForm({ ...EMPTY_EVENT_FORM, lodge_id: firstLodge?.id || '' });
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="btn-primary flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </button>
          </div>

          {allLodgeEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
              <p>Create your first event above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allLodgeEvents.map((event) => (
                <div key={event.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                        <StatusBadge status={event.status} />
                      </div>
                      <p className="text-sm text-gray-600 capitalize mt-0.5">
                        {event.type} · {event.lodge?.name} #{event.lodge?.number}
                        {event.lodge?.grand_lodge && <span className="text-gray-400"> · {event.lodge.grand_lodge}</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(event.start_time)} at {formatTime(event.start_time)}
                      </p>
                      {event.creator && (
                        <p className="text-xs text-gray-400 mt-0.5">By {event.creator.first_name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openAttendeesModal(event)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View RSVPs"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(event.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                  )}

                  {event.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleApproveEvent(event.id)} className="btn-primary flex-1 text-sm py-1.5">
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </button>
                      <button onClick={() => handleRejectEvent(event.id)} className="btn-secondary flex-1 text-sm py-1.5">
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pending Check-ins ({pendingCheckIns.length})
            </h2>
            {pendingCheckIns.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No pending check-ins</h3>
                <p className="text-sm">New check-ins awaiting confirmation will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCheckIns.map((activity, index) => (
                  <div key={`pending-${index}`} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{(activity.user as any)?.first_name} checked in</h3>
                        <p className="text-sm text-gray-600">{activity.event?.title}</p>
                        <p className="text-sm text-gray-500 capitalize">{activity.event?.type} event</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatTime(activity.checkin_time)}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.checkin_time)}</p>
                      </div>
                    </div>
                    <button onClick={() => handleConfirmActivity(activity)} className="btn-primary w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm {activity.event?.type === 'charity' ? 'Charity' : 'Visit'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Confirmed ({recentActivities.length})
            </h2>
            {recentActivities.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-base font-medium text-gray-900 mb-1">No confirmed activities yet</h3>
                <p className="text-sm">Confirmed visits and charity participations will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.user_name}</p>
                      <p className="text-sm text-gray-600">{activity.event_name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{activity.type} &middot; {formatDate(activity.date)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shrink-0 ml-4">
                      <CheckCircle className="h-3 w-3" /> Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {attendeeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">RSVPs</h2>
                <p className="text-sm text-gray-500 mt-0.5">{attendeeEvent.title}</p>
              </div>
              <button onClick={() => setAttendeeEvent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {attendeesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-500">Loading attendees…</p>
                </div>
              ) : !attendees || attendees.total === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-700">No RSVPs yet</p>
                  <p className="text-sm mt-1">Members haven't responded to this event.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Summary row */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-700">{attendees.going.length}</div>
                      <div className="text-xs text-green-600 mt-0.5">Going</div>
                    </div>
                    <div className="flex-1 bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-yellow-700">{attendees.maybe.length}</div>
                      <div className="text-xs text-yellow-600 mt-0.5">Maybe</div>
                    </div>
                    <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-red-700">{attendees.notGoing.length}</div>
                      <div className="text-xs text-red-600 mt-0.5">Not Going</div>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-700">{attendees.checkedIn.length}</div>
                      <div className="text-xs text-blue-600 mt-0.5">Checked In</div>
                    </div>
                  </div>

                  {/* Checked in */}
                  {attendees.checkedIn.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-1.5 mb-2">
                        <UserCheck className="h-4 w-4" /> Checked In ({attendees.checkedIn.length})
                      </h3>
                      <div className="space-y-1.5">
                        {attendees.checkedIn.map((r: any) => (
                          <div key={r.user_id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{(r.user as any)?.first_name || 'Brother'}</p>
                              <p className="text-xs text-gray-500">{(r.user as any)?.lodge?.name || (r.user as any)?.email}</p>
                            </div>
                            <span className="text-xs text-blue-600">{formatTime(r.checkin_time)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Going */}
                  {attendees.going.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-2">
                        <CheckCircle className="h-4 w-4" /> Going ({attendees.going.length})
                      </h3>
                      <div className="space-y-1.5">
                        {attendees.going.map((r: any) => (
                          <div key={r.user_id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                            <p className="text-sm font-medium text-gray-900">{(r.user as any)?.first_name || 'Brother'}</p>
                            <p className="text-xs text-gray-500">{(r.user as any)?.lodge?.name || (r.user as any)?.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maybe */}
                  {attendees.maybe.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-700 flex items-center gap-1.5 mb-2">
                        <HelpCircle className="h-4 w-4" /> Maybe ({attendees.maybe.length})
                      </h3>
                      <div className="space-y-1.5">
                        {attendees.maybe.map((r: any) => (
                          <div key={r.user_id} className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2">
                            <p className="text-sm font-medium text-gray-900">{(r.user as any)?.first_name || 'Brother'}</p>
                            <p className="text-xs text-gray-500">{(r.user as any)?.lodge?.name || (r.user as any)?.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Not Going */}
                  {attendees.notGoing.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-2">
                        <UserX className="h-4 w-4" /> Not Going ({attendees.notGoing.length})
                      </h3>
                      <div className="space-y-1.5">
                        {attendees.notGoing.map((r: any) => (
                          <div key={r.user_id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                            <p className="text-sm font-medium text-gray-900">{(r.user as any)?.first_name || 'Brother'}</p>
                            <p className="text-xs text-gray-500">{(r.user as any)?.lodge?.name || (r.user as any)?.email}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Create Event</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              {createError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{createError}</div>}
              <EventFormFields form={createForm} onChange={setCreateForm} lodges={summary?.lodges || []} showLodgePicker />
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createLoading || !createForm.lodge_id} className="btn-primary flex items-center">
                  {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
              <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditEvent} className="p-6 space-y-4">
              {editError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{editError}</div>}
              <EventFormFields form={editForm} onChange={setEditForm} lodges={summary?.lodges || []} showLodgePicker={false} />
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

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Event?</h2>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone. All RSVPs for this event will also be removed.</p>
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
