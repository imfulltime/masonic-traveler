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
  AlertCircle,
  Activity
} from 'lucide-react';

export default function SecretaryPage() {
  const { user, hasRole } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'events' | 'activities'>('overview');

  useEffect(() => {
    if (hasRole('secretary')) {
      loadSecretaryData();
    }
  }, [hasRole]);

  const loadSecretaryData = async () => {
    try {
      setLoading(true);
      const [summaryData, verificationsData, eventsData, activitiesData] = await Promise.all([
        SecretaryService.getDashboardSummary(),
        VerificationService.getPendingVerifications(),
        SecretaryService.getPendingEvents(),
        SecretaryService.getRecentActivities(),
      ]);
      
      setSummary(summaryData);
      setPendingVerifications(verificationsData);
      setPendingEvents(eventsData);
      setRecentActivities(activitiesData);
    } catch (err) {
      console.error('Error loading secretary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVerification = async (verificationId: string) => {
    try {
      await VerificationService.approveVerification(verificationId);
      await loadSecretaryData(); // Reload data
      alert('Verification approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Error approving verification');
    }
  };

  const handleRejectVerification = async (verificationId: string) => {
    try {
      await VerificationService.rejectVerification(verificationId);
      await loadSecretaryData(); // Reload data
      alert('Verification rejected.');
    } catch (err: any) {
      alert(err.message || 'Error rejecting verification');
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await SecretaryService.approveEvent(eventId);
      await loadSecretaryData(); // Reload data
      alert('Event approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Error approving event');
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await SecretaryService.rejectEvent(eventId);
      await loadSecretaryData(); // Reload data
      alert('Event rejected.');
    } catch (err: any) {
      alert(err.message || 'Error rejecting event');
    }
  };

  const handleConfirmActivity = async (activity: any) => {
    try {
      if (activity.event?.type === 'charity') {
        await SecretaryService.confirmCharity(activity.user_id, activity.event_id);
      } else {
        await SecretaryService.confirmVisit(activity.user_id, activity.event?.lodge_id, activity.event_id);
      }
      await loadSecretaryData(); // Reload data
      alert('Activity confirmed successfully!');
    } catch (err: any) {
      alert(err.message || 'Error confirming activity');
    }
  };

  if (!hasRole('secretary')) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Access Denied
          </h2>
          <p className="text-red-700">
            Only Lodge Secretaries can access this console.
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
          <p className="text-gray-600">Loading secretary console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
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
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
          {/* Lodges */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Lodges</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {summary.lodges.map((lodge: any) => (
                <div key={lodge.id} className="card">
                  <h3 className="font-semibold text-gray-900">
                    {lodge.name} #{lodge.number}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {summary.pending_verifications}
              </div>
              <div className="text-sm text-gray-600">Pending Verifications</div>
            </div>

            <div className="card text-center">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {summary.pending_events}
              </div>
              <div className="text-sm text-gray-600">Pending Events</div>
            </div>

            <div className="card text-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {summary.recent_confirmations}
              </div>
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
                      <h3 className="font-semibold text-gray-900">
                        {verification.subject_user?.first_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-600">{verification.subject_user?.email}</p>
                      <p className="text-sm text-gray-500">
                        {verification.lodge?.name} #{verification.lodge?.number}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        verification.method === 'secretary' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {verification.method === 'secretary' ? 'Secretary' : 'Vouch'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(verification.created_at)}
                      </p>
                    </div>
                  </div>

                  {verification.method === 'vouch' && verification.vouches && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Vouches ({verification.vouches.length}):
                      </h4>
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
                    <button
                      onClick={() => handleApproveVerification(verification.id)}
                      className="btn-primary flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectVerification(verification.id)}
                      className="btn-secondary flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Events ({pendingEvents.length})
          </h2>
          
          {pendingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending events</h3>
              <p>All event requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((event) => (
                <div key={event.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{event.type} • {event.visibility}</p>
                      <p className="text-sm text-gray-500">
                        {event.lodge?.name} #{event.lodge?.number}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatDate(event.start_time)} at {formatTime(event.start_time)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created by {event.creator?.first_name}
                      </p>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-700 mb-4">{event.description}</p>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApproveEvent(event.id)}
                      className="btn-primary flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectEvent(event.id)}
                      className="btn-secondary flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Check-ins ({recentActivities.length})
          </h2>
          
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent check-ins</h3>
              <p>User check-ins will appear here for confirmation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {activity.user?.first_name} checked in
                      </h3>
                      <p className="text-sm text-gray-600">{activity.event?.title}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {activity.event?.type} event
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatTime(activity.checkin_time)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.checkin_time)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmActivity(activity)}
                    className="btn-primary w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm {activity.event?.type === 'charity' ? 'Charity' : 'Visit'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
