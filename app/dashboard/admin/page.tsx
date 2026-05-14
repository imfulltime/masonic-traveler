'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AdminService,
  type PlatformStats,
  type AdminUser,
  type AdminLodge,
} from '@/lib/admin';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AddressAutocomplete, type AddressResult } from '@/components/AddressAutocomplete';
import {
  Shield,
  Users,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  Activity,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'users' | 'lodges';
type Notification = { message: string; type: 'success' | 'error' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleBadge(role: AdminUser['role']) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold';
  switch (role) {
    case 'admin':
      return <span className={`${base} bg-red-100 text-red-800`}>Admin</span>;
    case 'secretary':
      return <span className={`${base} bg-blue-100 text-blue-800`}>Secretary</span>;
    default:
      return <span className={`${base} bg-gray-100 text-gray-700`}>Brother</span>;
  }
}

function verifiedBadge(isVerified: boolean) {
  if (isVerified) {
    return (
      <span className="inline-flex items-center space-x-1 text-green-700 text-xs font-medium">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>Verified</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 text-yellow-600 text-xs font-medium">
      <Clock className="h-3.5 w-3.5" />
      <span>Pending</span>
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, iconBg, onClick }: StatCardProps) {
  return (
    <div
      className={`card flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={`flex-shrink-0 p-3 rounded-full ${iconBg}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
        <div className="text-sm text-gray-600">{label}</div>
        {onClick && (
          <div className="text-xs text-primary-600 mt-0.5">Click to filter &rarr;</div>
        )}
      </div>
    </div>
  );
}

// ─── Secretary Modal ─────────────────────────────────────────────────────────

interface SecretaryModalProps {
  user: AdminUser;
  lodges: AdminLodge[];
  onConfirm: (lodgeId: string) => void;
  onCancel: () => void;
}

function SecretaryModal({ user, lodges, onConfirm, onCancel }: SecretaryModalProps) {
  const [selectedLodgeId, setSelectedLodgeId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Promote to Secretary</h3>
            <p className="text-sm text-gray-600 mt-1">
              Select the lodge for{' '}
              <span className="font-medium">
                {user.first_name || user.email}
              </span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lodge</label>
          <div className="relative">
            <select
              value={selectedLodgeId}
              onChange={(e) => setSelectedLodgeId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">— Select a lodge —</option>
              {lodges.map((lodge) => (
                <option key={lodge.id} value={lodge.id}>
                  {lodge.name} #{lodge.number} — {lodge.city}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={() => selectedLodgeId && onConfirm(selectedLodgeId)}
            disabled={!selectedLodgeId}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Promotion
          </button>
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Row ────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: AdminUser;
  lodges: AdminLodge[];
  onVerify: (userId: string, verified: boolean) => void;
  onRoleChange: (userId: string, role: AdminUser['role']) => void;
  onPromoteToSecretary: (userId: string, lodgeId: string) => void;
  busy: boolean;
}

function UserRow({
  user,
  lodges,
  onVerify,
  onRoleChange,
  onPromoteToSecretary,
  busy,
}: UserRowProps) {
  const [showSecretaryModal, setShowSecretaryModal] = useState(false);

  const handleRoleButton = (role: AdminUser['role']) => {
    if (role === 'secretary') {
      setShowSecretaryModal(true);
    } else {
      onRoleChange(user.id, role);
    }
  };

  return (
    <>
      <div className="card space-y-3">
        {/* Top row: name + badges */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">
              {[user.first_name, user.last_name].filter(Boolean).join(' ') || '(No name)'}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user.lodge ? `${user.lodge.name} #${user.lodge.number}` : 'No lodge'}
              {' · '}Joined {formatDate(user.created_at)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {roleBadge(user.role)}
            {verifiedBadge(user.is_verified)}
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          {/* Verify / Unverify */}
          <button
            onClick={() => onVerify(user.id, !user.is_verified)}
            disabled={busy}
            className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
              user.is_verified
                ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {user.is_verified ? 'Unverify' : 'Verify'}
          </button>

          {/* Role buttons */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400 mr-1">Role:</span>
            {(['brother', 'secretary', 'admin'] as AdminUser['role'][]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleButton(r)}
                disabled={busy || user.role === r}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-50 capitalize ${
                  user.role === r
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showSecretaryModal && (
        <SecretaryModal
          user={user}
          lodges={lodges}
          onConfirm={(lodgeId) => {
            setShowSecretaryModal(false);
            onPromoteToSecretary(user.id, lodgeId);
          }}
          onCancel={() => setShowSecretaryModal(false)}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminConsoleContent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [notification, setNotification] = useState<Notification | null>(null);
  const notifTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Data
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [lodges, setLodges] = useState<AdminLodge[]>([]);
  const [search, setSearch] = useState('');
  const [pendingFilter, setPendingFilter] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLodges, setLoadingLodges] = useState(true);

  // ── Lodge CRUD state ──

  type LodgeForm = {
    name: string; number: string; grand_lodge: string; district: string;
    address: string; city: string; state: string; zip_code: string; country: string;
    lat: string; lng: string; contact_email: string; contact_phone: string;
    meeting_schedule: string;
  };

  const emptyLodgeForm: LodgeForm = {
    name: '', number: '', grand_lodge: '', district: '',
    address: '', city: '', state: '', zip_code: '', country: '',
    lat: '', lng: '', contact_email: '', contact_phone: '',
    meeting_schedule: '',
  };

  const [showCreateLodgeModal, setShowCreateLodgeModal] = useState(false);
  const [createLodgeForm, setCreateLodgeForm] = useState<LodgeForm>(emptyLodgeForm);
  const [createLodgeLoading, setCreateLodgeLoading] = useState(false);
  const [createLodgeError, setCreateLodgeError] = useState<string | null>(null);

  const [editingLodge, setEditingLodge] = useState<AdminLodge | null>(null);
  const [editLodgeForm, setEditLodgeForm] = useState<LodgeForm>(emptyLodgeForm);
  const [editLodgeLoading, setEditLodgeLoading] = useState(false);
  const [editLodgeError, setEditLodgeError] = useState<string | null>(null);

  const [deleteLodgeConfirmId, setDeleteLodgeConfirmId] = useState<string | null>(null);
  const [deleteLodgeLoading, setDeleteLodgeLoading] = useState(false);

  // ── Notifications ──

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (notifTimeout.current) clearTimeout(notifTimeout.current);
    setNotification({ message, type });
    notifTimeout.current = setTimeout(() => setNotification(null), 4000);
  };

  // ── Data loaders ──

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await AdminService.getPlatformStats();
      setStats(data);
    } catch (err: any) {
      showNotification(err.message || 'Error loading stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async (q?: string) => {
    try {
      setLoadingUsers(true);
      const data = await AdminService.getAllUsers(q);
      setUsers(data);
    } catch (err: any) {
      showNotification(err.message || 'Error loading users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadLodges = async () => {
    try {
      setLoadingLodges(true);
      const allLodges = await AdminService.getAllLodges();
      // Attach member counts
      const { data: userData } = await import('@/lib/supabase').then((m) =>
        m.supabase.from('users').select('lodge_id').not('lodge_id', 'is', null)
      );
      const countMap: Record<string, number> = {};
      (userData || []).forEach((u: { lodge_id: string | null }) => {
        if (u.lodge_id) countMap[u.lodge_id] = (countMap[u.lodge_id] || 0) + 1;
      });
      setLodges(allLodges.map((l) => ({ ...l, member_count: countMap[l.id] || 0 })));
    } catch (err: any) {
      showNotification(err.message || 'Error loading lodges', 'error');
    } finally {
      setLoadingLodges(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadUsers();
    loadLodges();
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(search || undefined);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // ── User actions ──

  const handleVerify = async (userId: string, verified: boolean) => {
    setBusyUserId(userId);
    try {
      await AdminService.setUserVerified(userId, verified);
      await loadUsers(search || undefined);
      await loadStats();
      showNotification(
        verified ? 'User verified successfully.' : 'User verification removed.',
        'success'
      );
    } catch (err: any) {
      showNotification(err.message || 'Error updating verification', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: AdminUser['role']) => {
    setBusyUserId(userId);
    try {
      await AdminService.updateUserRole(userId, role);
      await loadUsers(search || undefined);
      showNotification(`Role updated to ${role}.`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error updating role', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const handlePromoteToSecretary = async (userId: string, lodgeId: string) => {
    setBusyUserId(userId);
    try {
      await AdminService.promoteToSecretary(userId, lodgeId);
      await loadUsers(search || undefined);
      showNotification('User promoted to Secretary.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error promoting to secretary', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  // ── Lodge actions ──

  const handleCreateLodge = async () => {
    setCreateLodgeError(null);
    if (!createLodgeForm.name.trim() || !createLodgeForm.number.trim() ||
        !createLodgeForm.grand_lodge.trim() || !createLodgeForm.city.trim() ||
        !createLodgeForm.country.trim()) {
      setCreateLodgeError('Name, Number, Grand Lodge, City, and Country are required.');
      return;
    }
    setCreateLodgeLoading(true);
    try {
      await AdminService.createLodge({
        name: createLodgeForm.name.trim(),
        number: createLodgeForm.number.trim(),
        grand_lodge: createLodgeForm.grand_lodge.trim(),
        district: createLodgeForm.district.trim() || undefined,
        address: createLodgeForm.address.trim() || undefined,
        city: createLodgeForm.city.trim(),
        state: createLodgeForm.state.trim() || undefined,
        zip_code: createLodgeForm.zip_code.trim() || undefined,
        country: createLodgeForm.country.trim(),
        lat: createLodgeForm.lat ? parseFloat(createLodgeForm.lat) : undefined,
        lng: createLodgeForm.lng ? parseFloat(createLodgeForm.lng) : undefined,
        contact_email: createLodgeForm.contact_email.trim() || undefined,
        contact_phone: createLodgeForm.contact_phone.trim() || undefined,
        meeting_schedule: createLodgeForm.meeting_schedule.trim() || undefined,
      });
      setShowCreateLodgeModal(false);
      setCreateLodgeForm(emptyLodgeForm);
      await loadLodges();
      await loadStats();
      showNotification('Lodge created successfully.', 'success');
    } catch (err: any) {
      setCreateLodgeError(err.message || 'Error creating lodge.');
    } finally {
      setCreateLodgeLoading(false);
    }
  };

  const openEditLodge = (lodge: AdminLodge) => {
    setEditingLodge(lodge);
    setEditLodgeError(null);
    setEditLodgeForm({
      name: lodge.name,
      number: lodge.number,
      grand_lodge: lodge.grand_lodge,
      district: lodge.district ?? '',
      address: lodge.address ?? '',
      city: lodge.city,
      state: lodge.state ?? '',
      zip_code: lodge.zip_code ?? '',
      country: lodge.country,
      lat: lodge.lat != null ? String(lodge.lat) : '',
      lng: lodge.lng != null ? String(lodge.lng) : '',
      contact_email: lodge.contact_email ?? '',
      contact_phone: lodge.contact_phone ?? '',
      meeting_schedule: lodge.meeting_schedule ?? '',
    });
  };

  const handleEditLodge = async () => {
    if (!editingLodge) return;
    setEditLodgeError(null);
    if (!editLodgeForm.name.trim() || !editLodgeForm.number.trim() ||
        !editLodgeForm.grand_lodge.trim() || !editLodgeForm.city.trim() ||
        !editLodgeForm.country.trim()) {
      setEditLodgeError('Name, Number, Grand Lodge, City, and Country are required.');
      return;
    }
    setEditLodgeLoading(true);
    try {
      await AdminService.updateLodge(editingLodge.id, {
        name: editLodgeForm.name.trim(),
        number: editLodgeForm.number.trim(),
        grand_lodge: editLodgeForm.grand_lodge.trim(),
        district: editLodgeForm.district.trim(),
        address: editLodgeForm.address.trim(),
        city: editLodgeForm.city.trim(),
        state: editLodgeForm.state.trim(),
        zip_code: editLodgeForm.zip_code.trim(),
        country: editLodgeForm.country.trim(),
        lat: editLodgeForm.lat ? parseFloat(editLodgeForm.lat) : 0,
        lng: editLodgeForm.lng ? parseFloat(editLodgeForm.lng) : 0,
        contact_email: editLodgeForm.contact_email.trim(),
        contact_phone: editLodgeForm.contact_phone.trim(),
        meeting_schedule: editLodgeForm.meeting_schedule.trim(),
      });
      setEditingLodge(null);
      await loadLodges();
      showNotification('Lodge updated successfully.', 'success');
    } catch (err: any) {
      setEditLodgeError(err.message || 'Error updating lodge.');
    } finally {
      setEditLodgeLoading(false);
    }
  };

  const handleDeleteLodge = async () => {
    if (!deleteLodgeConfirmId) return;
    setDeleteLodgeLoading(true);
    try {
      await AdminService.deleteLodge(deleteLodgeConfirmId);
      setDeleteLodgeConfirmId(null);
      await loadLodges();
      await loadStats();
      showNotification('Lodge deleted successfully.', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error deleting lodge.', 'error');
    } finally {
      setDeleteLodgeLoading(false);
    }
  };

  // ── Derived data ──

  const displayedUsers = pendingFilter
    ? users.filter((u) => !u.is_verified)
    : users;

  const handlePendingStatClick = () => {
    setPendingFilter(true);
    setActiveTab('users');
  };

  // ── Tabs config ──

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'lodges', label: 'Lodges', icon: Building2 },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Notification banner */}
      {notification && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-4 text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            &#x2715;
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
        <p className="text-gray-600">Platform-wide management and oversight</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'users') setPendingFilter(false);
              }}
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

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Platform Statistics</h2>

          {loadingStats ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading stats...</p>
            </div>
          ) : stats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Total Users"
                value={stats.totalUsers}
                icon={<Users className="h-6 w-6 text-blue-600" />}
                iconBg="bg-blue-100"
              />
              <StatCard
                label="Verified Users"
                value={stats.verifiedUsers}
                icon={<CheckCircle className="h-6 w-6 text-green-600" />}
                iconBg="bg-green-100"
              />
              <StatCard
                label="Total Lodges"
                value={stats.totalLodges}
                icon={<Building2 className="h-6 w-6 text-purple-600" />}
                iconBg="bg-purple-100"
              />
              <StatCard
                label="Total Events"
                value={stats.totalEvents}
                icon={<Calendar className="h-6 w-6 text-orange-600" />}
                iconBg="bg-orange-100"
              />
              <StatCard
                label="Pending Verifications"
                value={stats.pendingVerifications}
                icon={<Clock className="h-6 w-6 text-yellow-600" />}
                iconBg="bg-yellow-100"
                onClick={stats.pendingVerifications > 0 ? handlePendingStatClick : undefined}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Could not load statistics.</p>
          )}
        </div>
      )}

      {/* ── Users Tab ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {pendingFilter && (
              <button
                onClick={() => setPendingFilter(false)}
                className="flex items-center space-x-1 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <span>Pending only</span>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {loadingUsers ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading users...</p>
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
              <p className="text-sm">
                {search ? 'Try a different search term.' : 'No users in the platform yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Showing {displayedUsers.length} user{displayedUsers.length !== 1 ? 's' : ''}
                {pendingFilter ? ' (pending verification)' : ''}
              </p>
              {displayedUsers.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  lodges={lodges}
                  onVerify={handleVerify}
                  onRoleChange={handleRoleChange}
                  onPromoteToSecretary={handlePromoteToSecretary}
                  busy={busyUserId === u.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lodges Tab ── */}
      {activeTab === 'lodges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Lodges</h2>
            <button
              onClick={() => { setCreateLodgeForm(emptyLodgeForm); setCreateLodgeError(null); setShowCreateLodgeModal(true); }}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Lodge</span>
            </button>
          </div>

          {loadingLodges ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading lodges...</p>
            </div>
          ) : lodges.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No lodges found</h3>
              <p className="text-sm">No lodges have been created yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {lodges.map((lodge) => (
                <div key={lodge.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {lodge.name}{' '}
                        <span className="text-gray-500 font-normal">#{lodge.number}</span>
                      </h3>
                      <p className="text-sm text-gray-600">{lodge.grand_lodge}</p>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {lodge.member_count ?? 0} member{lodge.member_count !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => openEditLodge(lodge)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        aria-label="Edit lodge"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteLodgeConfirmId(lodge.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Delete lodge"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {lodge.district && (
                      <span>
                        <span className="font-medium text-gray-700">District:</span>{' '}
                        {lodge.district}
                      </span>
                    )}
                    <span>
                      <span className="font-medium text-gray-700">Location:</span>{' '}
                      {[lodge.city, lodge.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Create Lodge Modal ── */}
      {showCreateLodgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Lodge</h3>
                <p className="text-sm text-gray-500 mt-0.5">Add a new lodge to the platform</p>
              </div>
              <button
                onClick={() => setShowCreateLodgeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createLodgeError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {createLodgeError}
              </p>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={createLodgeForm.name} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Lodge name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Number <span className="text-red-500">*</span></label>
                  <input type="text" value={createLodgeForm.number} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. 123" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Grand Lodge <span className="text-red-500">*</span></label>
                <input type="text" value={createLodgeForm.grand_lodge} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, grand_lodge: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. Grand Lodge of California" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <input type="text" value={createLodgeForm.district} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address <span className="text-gray-400 font-normal">(auto-fills city, state, ZIP, coords)</span>
                </label>
                <AddressAutocomplete
                  value={createLodgeForm.address}
                  onChange={(addr) => setCreateLodgeForm((f) => ({ ...f, address: addr }))}
                  onSelect={(result: AddressResult) => {
                    setCreateLodgeForm((f) => ({
                      ...f,
                      address: result.road || f.address,
                      city: result.city || f.city,
                      state: result.state || f.state,
                      zip_code: result.zip_code || f.zip_code,
                      country: result.country || f.country,
                      lat: String(result.lat),
                      lng: String(result.lng),
                    }));
                  }}
                  placeholder="Search for the lodge address…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" value={createLodgeForm.city} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
                  <input type="text" value={createLodgeForm.state} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State or province" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                  <input type="text" value={createLodgeForm.zip_code} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, zip_code: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ZIP code" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <input type="text" value={createLodgeForm.country} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Country" />
                </div>
              </div>
              {(createLodgeForm.lat || createLodgeForm.lng) && (
                <div className="text-[11px] text-ink-500 bg-ivory-100 border border-ink-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="font-medium text-gold-700">📍 Geotag:</span>
                  <span>{createLodgeForm.lat}, {createLodgeForm.lng}</span>
                  <button
                    type="button"
                    onClick={() => setCreateLodgeForm((f) => ({ ...f, lat: '', lng: '' }))}
                    className="ml-auto text-ink-400 hover:text-red-600 text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meeting Schedule <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={createLodgeForm.meeting_schedule}
                  onChange={(e) => setCreateLodgeForm((f) => ({ ...f, meeting_schedule: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. 2nd Tuesday of every month at 7:30 PM"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                  <input type="email" value={createLodgeForm.contact_email} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, contact_email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input type="tel" value={createLodgeForm.contact_phone} onChange={(e) => setCreateLodgeForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional" />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button onClick={handleCreateLodge} disabled={createLodgeLoading}
                className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {createLodgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>{createLodgeLoading ? 'Creating…' : 'Create Lodge'}</span>
              </button>
              <button onClick={() => setShowCreateLodgeModal(false)} disabled={createLodgeLoading}
                className="btn-secondary flex-1 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Lodge Modal ── */}
      {editingLodge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Lodge</h3>
                <p className="text-sm text-gray-500 mt-0.5">{editingLodge.name} #{editingLodge.number}</p>
              </div>
              <button
                onClick={() => setEditingLodge(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editLodgeError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {editLodgeError}
              </p>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={editLodgeForm.name} onChange={(e) => setEditLodgeForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Lodge name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Number <span className="text-red-500">*</span></label>
                  <input type="text" value={editLodgeForm.number} onChange={(e) => setEditLodgeForm((f) => ({ ...f, number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. 123" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Grand Lodge <span className="text-red-500">*</span></label>
                <input type="text" value={editLodgeForm.grand_lodge} onChange={(e) => setEditLodgeForm((f) => ({ ...f, grand_lodge: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. Grand Lodge of California" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <input type="text" value={editLodgeForm.district} onChange={(e) => setEditLodgeForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address <span className="text-gray-400 font-normal">(auto-fills city, state, ZIP, coords)</span>
                </label>
                <AddressAutocomplete
                  value={editLodgeForm.address}
                  onChange={(addr) => setEditLodgeForm((f) => ({ ...f, address: addr }))}
                  onSelect={(result: AddressResult) => {
                    setEditLodgeForm((f) => ({
                      ...f,
                      address: result.road || f.address,
                      city: result.city || f.city,
                      state: result.state || f.state,
                      zip_code: result.zip_code || f.zip_code,
                      country: result.country || f.country,
                      lat: String(result.lat),
                      lng: String(result.lng),
                    }));
                  }}
                  placeholder="Search for a new address…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" value={editLodgeForm.city} onChange={(e) => setEditLodgeForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State / Province</label>
                  <input type="text" value={editLodgeForm.state} onChange={(e) => setEditLodgeForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State or province" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                  <input type="text" value={editLodgeForm.zip_code} onChange={(e) => setEditLodgeForm((f) => ({ ...f, zip_code: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ZIP code" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <input type="text" value={editLodgeForm.country} onChange={(e) => setEditLodgeForm((f) => ({ ...f, country: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Country" />
                </div>
              </div>
              {(editLodgeForm.lat || editLodgeForm.lng) && (
                <div className="text-[11px] text-ink-500 bg-ivory-100 border border-ink-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="font-medium text-gold-700">📍 Geotag:</span>
                  <span>{editLodgeForm.lat}, {editLodgeForm.lng}</span>
                  <button
                    type="button"
                    onClick={() => setEditLodgeForm((f) => ({ ...f, lat: '', lng: '' }))}
                    className="ml-auto text-ink-400 hover:text-red-600 text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meeting Schedule <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editLodgeForm.meeting_schedule}
                  onChange={(e) => setEditLodgeForm((f) => ({ ...f, meeting_schedule: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. 2nd Tuesday of every month at 7:30 PM"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Email</label>
                  <input type="email" value={editLodgeForm.contact_email} onChange={(e) => setEditLodgeForm((f) => ({ ...f, contact_email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input type="tel" value={editLodgeForm.contact_phone} onChange={(e) => setEditLodgeForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional" />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button onClick={handleEditLodge} disabled={editLodgeLoading}
                className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {editLodgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                <span>{editLodgeLoading ? 'Saving…' : 'Save Changes'}</span>
              </button>
              <button onClick={() => setEditingLodge(null)} disabled={editLodgeLoading}
                className="btn-secondary flex-1 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Lodge Confirm Modal ── */}
      {deleteLodgeConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Lodge</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-medium">
                    {lodges.find((l) => l.id === deleteLodgeConfirmId)?.name ?? 'this lodge'}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeleteLodgeConfirmId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteLodge}
                disabled={deleteLodgeLoading}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLodgeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>{deleteLodgeLoading ? 'Deleting…' : 'Delete Lodge'}</span>
              </button>
              <button
                onClick={() => setDeleteLodgeConfirmId(null)}
                disabled={deleteLodgeLoading}
                className="btn-secondary flex-1 disabled:opacity-50"
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

// ─── Export ───────────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminConsoleContent />
    </ProtectedRoute>
  );
}
