'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { VerificationService } from '@/lib/verification';
import { useAuth } from '@/components/AuthProvider';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface VouchRequest {
  id: string;
  created_at: string;
  subject_user: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
  } | null;
  lodge: {
    id: string;
    name: string;
    number: number;
  } | null;
  vouches: {
    id: string;
    voucher_user_id: string;
  }[];
}

interface NotificationState {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function VouchesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VouchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const fetchPendingVouches = useCallback(async () => {
    try {
      setFetchError('');
      const { data, error } = await supabase
        .from('verifications')
        .select(`
          id, created_at,
          subject_user:subject_user_id (id, first_name, last_name, email),
          lodge:lodge_id (id, name, number),
          vouches:vouches (id, voucher_user_id)
        `)
        .eq('status', 'pending')
        .eq('method', 'vouch')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRequests((data as unknown as VouchRequest[]) || []);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load vouch requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingVouches();
  }, [fetchPendingVouches]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (type: 'success' | 'error', message: string, verificationId: string) => {
    const notif: NotificationState = { id: verificationId, type, message };
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== verificationId);
      return [...filtered, notif];
    });
    // Auto-dismiss success after 4 seconds
    if (type === 'success') {
      setTimeout(() => dismissNotification(verificationId), 4000);
    }
  };

  const handleVouch = async (verificationId: string) => {
    try {
      setSubmitting(verificationId);
      // Clear any existing notification for this card
      setNotifications((prev) => prev.filter((n) => n.id !== verificationId));

      await VerificationService.vouchForUser(verificationId);

      addNotification('success', 'Your vouch has been recorded.', verificationId);

      // Optimistically update local state so the button reflects the change immediately
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id !== verificationId || !user) return req;
          return {
            ...req,
            vouches: [...req.vouches, { id: 'optimistic', voucher_user_id: user.id }],
          };
        })
      );
    } catch (err: any) {
      addNotification('error', err.message || 'Failed to record vouch.', verificationId);
    } finally {
      setSubmitting(null);
    }
  };

  const hasCurrentUserVouched = (req: VouchRequest): boolean => {
    if (!user) return false;
    return req.vouches.some((v) => v.voucher_user_id === user.id);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Users className="h-7 w-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vouch Requests</h1>
          <p className="text-sm text-gray-500">
            Verified brothers awaiting your vouch
          </p>
        </div>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{fetchError}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && requests.length === 0 && (
        <div className="card text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No pending vouch requests
          </h2>
          <p className="text-sm text-gray-500">
            All pending vouch requests have been handled.
          </p>
        </div>
      )}

      {/* Request cards */}
      {!loading && requests.map((req) => {
        const alreadyVouched = hasCurrentUserVouched(req);
        const isSubmitting = submitting === req.id;
        const notification = notifications.find((n) => n.id === req.id);
        const vouchCount = req.vouches.length;

        return (
          <div key={req.id} className="card space-y-4">
            {/* Brother info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {req.subject_user
                    ? `${req.subject_user.first_name}${req.subject_user.last_name ? ` ${req.subject_user.last_name}` : ''}`
                    : 'Unknown Brother'}
                </h3>
                <p className="text-sm text-gray-500">
                  {req.subject_user?.email || ''}
                </p>
              </div>

              {/* Already vouched badge */}
              {alreadyVouched && (
                <span className="inline-flex items-center space-x-1 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>You vouched</span>
                </span>
              )}
            </div>

            {/* Lodge */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">Lodge:</span>{' '}
              {req.lodge
                ? `${req.lodge.name} #${req.lodge.number}`
                : 'Unknown Lodge'}
            </div>

            {/* Vouch count & date */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>
                  {vouchCount === 0
                    ? 'No vouches yet'
                    : vouchCount === 1
                    ? '1 vouch'
                    : `${vouchCount} vouches`}
                </span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Requested {formatDate(req.created_at)}</span>
              </span>
            </div>

            {/* Inline notification */}
            {notification && (
              <div
                className={`rounded-lg px-4 py-3 text-sm flex items-start justify-between space-x-3 ${
                  notification.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                <span>{notification.message}</span>
                <button
                  onClick={() => dismissNotification(req.id)}
                  className="flex-shrink-0 text-current opacity-60 hover:opacity-100"
                  aria-label="Dismiss"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Action button */}
            {!alreadyVouched && (
              <button
                onClick={() => handleVouch(req.id)}
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? 'Recording vouch...' : 'Vouch for Brother'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
