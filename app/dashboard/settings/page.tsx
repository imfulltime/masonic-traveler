'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';

// ─── Notification preference keys stored in localStorage ─────────────────────
const NOTIF_KEYS = {
  nearby: 'notif_nearby_brethren',
  events: 'notif_upcoming_events',
  confirmations: 'notif_confirmations',
  badges: 'notif_new_badges',
} as const;

type NotifKey = keyof typeof NOTIF_KEYS;

function loadNotifPrefs(): Record<NotifKey, boolean> {
  const defaults: Record<NotifKey, boolean> = {
    nearby: true,
    events: true,
    confirmations: true,
    badges: true,
  };

  if (typeof window === 'undefined') return defaults;

  return (Object.keys(defaults) as NotifKey[]).reduce(
    (acc, key) => {
      const stored = localStorage.getItem(NOTIF_KEYS[key]);
      acc[key] = stored === null ? defaults[key] : stored === 'true';
      return acc;
    },
    {} as Record<NotifKey, boolean>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SuccessBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-4">
      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
      <p className="text-green-800 text-sm flex-1">{message}</p>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <p className="text-red-800 text-sm flex-1">{message}</p>
      <button onClick={onClose} className="text-red-600 hover:text-red-800">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();

  // Account section state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Privacy section state
  const [isVisible, setIsVisible] = useState(true);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  // Notification section state
  const [notifPrefs, setNotifPrefs] = useState<Record<NotifKey, boolean>>({
    nearby: true,
    events: true,
    confirmations: true,
    badges: true,
  });

  // Danger zone state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Feedback banners
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // ── Load initial values ──────────────────────────────────────────────────
  useEffect(() => {
    setNotifPrefs(loadNotifPrefs());

    if (user) {
      // Load is_visible from the users table
      supabase
        .from('users')
        .select('is_visible')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          const row = data as { is_visible: boolean } | null;
          if (row) setIsVisible(row.is_visible ?? true);
        });
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setError('');
    setSuccess(msg);
  };

  const showError = (msg: string) => {
    setSuccess('');
    setError(msg);
  };

  // ── Account: change email ────────────────────────────────────────────────
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      showSuccess('Confirmation email sent to your new address. Please check your inbox.');
      setNewEmail('');
    } catch (err: any) {
      showError(err.message || 'Failed to update email.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Account: change password ─────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      // Re-authenticate with current password first
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) throw new Error('No active session.');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      showSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Privacy: toggle visibility ────────────────────────────────────────────
  const handleVisibilityToggle = async () => {
    if (!user) return;

    setVisibilityLoading(true);
    const next = !isVisible;
    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({ is_visible: next })
        .eq('id', user.id);

      if (error) throw error;
      setIsVisible(next);
      showSuccess(
        next
          ? 'You are now visible to nearby brethren.'
          : 'You are now hidden from nearby brethren.'
      );
    } catch (err: any) {
      showError(err.message || 'Failed to update visibility.');
    } finally {
      setVisibilityLoading(false);
    }
  };

  // ── Notifications: toggle preference ─────────────────────────────────────
  const handleNotifToggle = (key: NotifKey) => {
    const next = !notifPrefs[key];
    setNotifPrefs(prev => ({ ...prev, [key]: next }));
    localStorage.setItem(NOTIF_KEYS[key], String(next));
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account, privacy, and notifications</p>
      </div>

      {/* Feedback banners */}
      {success && (
        <SuccessBanner message={success} onClose={() => setSuccess('')} />
      )}
      {error && (
        <ErrorBanner message={error} onClose={() => setError('')} />
      )}

      {/* ── Account ─────────────────────────────────────────────────────── */}
      <section className="card space-y-6">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
          <User className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        </div>

        {/* Change email */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3">Change Email Address</h3>
          <form onSubmit={handleChangeEmail} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className="input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={emailLoading || !newEmail.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {emailLoading ? 'Sending...' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(v => !v)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </section>

      {/* ── Privacy ──────────────────────────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
          <Lock className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-800">Visible to Nearby Brethren</p>
            <p className="text-sm text-gray-500 mt-0.5">
              When enabled, your approximate location is shared on the map so other verified
              brethren can find you. Your exact address is never shown.
            </p>
          </div>

          <button
            onClick={handleVisibilityToggle}
            disabled={visibilityLoading}
            aria-pressed={isVisible}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 ${
              isVisible ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                isVisible ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
          <Bell className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>

        <p className="text-sm text-gray-500">
          These preferences are stored locally on this device.
        </p>

        {(
          [
            { key: 'nearby' as NotifKey, label: 'Nearby Brethren', description: 'Alert when brethren are detected near your location' },
            { key: 'events' as NotifKey, label: 'Upcoming Events', description: 'Reminders about events you have RSVPed to' },
            { key: 'confirmations' as NotifKey, label: 'Visit & Charity Confirmations', description: 'Notify me when a secretary confirms my participation' },
            { key: 'badges' as NotifKey, label: 'New Badges', description: 'Celebrate when you earn a new achievement badge' },
          ] as const
        ).map(({ key, label, description }) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            </div>

            <button
              onClick={() => handleNotifToggle(key)}
              aria-pressed={notifPrefs[key]}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                notifPrefs[key] ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  notifPrefs[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <section className="card border-red-200 space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-red-100">
          <Trash2 className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-gray-800">Delete Account</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="btn-secondary border-red-300 text-red-700 hover:bg-red-50 whitespace-nowrap flex-shrink-0"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* ── Delete confirmation dialog ────────────────────────────────────── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              This will permanently delete your account, visits, badges, and all personal data.
              Type <strong>DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="input mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    // Delete user data from all tables (cascades handle most)
                    if (user) {
                      // Clear presence and counter rows first
                      await supabase.from('presence').delete().eq('user_id', user.id);
                      await supabase.from('counters').delete().eq('user_id', user.id);
                      await supabase.from('user_badges').delete().eq('user_id', user.id);
                      await supabase.from('notifications').delete().eq('user_id', user.id);

                      // Delete the user profile row
                      await supabase.from('users').delete().eq('id', user.id);
                    }

                    // Sign out and delete the auth account
                    // Note: full auth.admin.deleteUser() requires service role,
                    // so we sign out locally. The orphaned auth record can be
                    // cleaned up by an admin cron job or Supabase dashboard.
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  } catch (err: any) {
                    setDeleteLoading(false);
                    showError(err.message || 'Failed to delete account. Please contact support.');
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
