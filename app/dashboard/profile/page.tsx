'use client';

import { useState, useEffect, useRef } from 'react';
import { GamificationService } from '@/lib/gamification';
import { EventsService } from '@/lib/events';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { BadgeWithDetails, Counter } from '@/types';
import { User, MapPin, Award, Target, Edit, X, Check, Search } from 'lucide-react';

export default function ProfilePage() {
  const { user, isVerified } = useAuth();
  const [badges, setBadges] = useState<BadgeWithDetails[]>([]);
  const [counters, setCounters] = useState<Counter | null>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Lodge picker state
  const [lodgeSearch, setLodgeSearch] = useState('');
  const [lodgeResults, setLodgeResults] = useState<any[]>([]);
  const [lodgeSearching, setLodgeSearching] = useState(false);
  const [selectedLodge, setSelectedLodge] = useState<any | null>(null);
  const [showLodgeDropdown, setShowLodgeDropdown] = useState(false);
  const lodgeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const handleEditOpen = () => {
    setEditFirstName(user?.first_name || '');
    setEditLastName(user?.last_name || '');
    setEditError('');
    setEditSuccess('');
    setLodgeSearch('');
    setLodgeResults([]);
    setSelectedLodge(null);
    setShowLodgeDropdown(false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditError('');
    setEditSuccess('');
    setLodgeSearch('');
    setLodgeResults([]);
    setSelectedLodge(null);
    setShowLodgeDropdown(false);
  };

  const handleLodgeSearchChange = (value: string) => {
    setLodgeSearch(value);
    setSelectedLodge(null);
    setShowLodgeDropdown(false);

    if (lodgeDebounceRef.current) clearTimeout(lodgeDebounceRef.current);

    if (!value.trim()) {
      setLodgeResults([]);
      return;
    }

    lodgeDebounceRef.current = setTimeout(async () => {
      setLodgeSearching(true);
      try {
        const results = await EventsService.searchLodges(value.trim());
        setLodgeResults(results);
        setShowLodgeDropdown(true);
      } catch {
        setLodgeResults([]);
      } finally {
        setLodgeSearching(false);
      }
    }, 400);
  };

  const handleLodgeSelect = (lodge: any) => {
    setSelectedLodge(lodge);
    setLodgeSearch(`${lodge.name}${lodge.number ? ` #${lodge.number}` : ''}${lodge.city ? ` — ${lodge.city}` : ''}`);
    setLodgeResults([]);
    setShowLodgeDropdown(false);
  };

  const handleEditSave = async () => {
    if (!user) return;
    setEditSaving(true);
    setEditError('');
    setEditSuccess('');
    try {
      const updates: Record<string, any> = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
      };
      if (selectedLodge) {
        updates.lodge_id = selectedLodge.id;
      }
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      setEditSuccess('Profile updated successfully.');
      setIsEditing(false);
      // Reload to reflect updated lodge in header
      window.location.reload();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [badgesResult, countersData, userBadgesData] = await Promise.all([
        GamificationService.getBadgesWithProgress(),
        GamificationService.getUserCounters(),
        GamificationService.getUserBadges(),
      ]);

      setBadges(badgesResult.badges);
      setCounters(countersData);
      setUserBadges(userBadgesData);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (code: string) => {
    // Simple badge icons based on code
    const icons: Record<string, string> = {
      traveling_man: '🚶‍♂️',
      wandering_mason: '🗺️',
      globetrotter: '🌎',
      master_traveler: '✈️',
      helping_hand: '🤝',
      charity_builder: '🏗️',
      beacon_of_light: '💡',
    };
    
    return icons[code] || '🏆';
  };

  const getProgressWidth = (progress: number) => {
    return `${Math.min(progress * 100, 100)}%`;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user?.first_name || 'Brother'}
              </h1>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {user?.lodge?.name ? `${user.lodge.name} #${user.lodge.number}` : 'No Lodge'}
              </p>
              {user?.lodge?.grand_lodge && (
                <p className="text-sm text-gray-500">
                  {user.lodge.grand_lodge} • District {user.lodge.district}
                </p>
              )}
            </div>
          </div>
          
          <button className="btn-secondary" onClick={handleEditOpen}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>

        {/* Inline edit form */}
        {isEditing && (
          <div className="mt-4 border-t border-gray-200 pt-4 space-y-3">
            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                className="input w-full"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                className="input w-full"
                placeholder="Last name"
              />
            </div>
            {/* Lodge Picker */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lodge
                {user?.lodge?.name && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (current: {user.lodge.name}{user.lodge.number ? ` #${user.lodge.number}` : ''})
                  </span>
                )}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={lodgeSearch}
                  onChange={(e) => handleLodgeSearchChange(e.target.value)}
                  className="input w-full pl-9"
                  placeholder="Search by lodge name, city, or grand lodge..."
                  autoComplete="off"
                />
                {lodgeSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
              {/* Dropdown results */}
              {showLodgeDropdown && lodgeResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {lodgeResults.map((lodge) => (
                    <button
                      key={lodge.id}
                      type="button"
                      onClick={() => handleLodgeSelect(lodge)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {lodge.name}{lodge.number ? ` #${lodge.number}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[lodge.city, lodge.grand_lodge].filter(Boolean).join(' · ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {showLodgeDropdown && !lodgeSearching && lodgeResults.length === 0 && lodgeSearch.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
                  <p className="text-sm text-gray-500">No lodges found for "{lodgeSearch}"</p>
                </div>
              )}
              {selectedLodge && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Lodge selected — will be saved with your profile
                </p>
              )}
            </div>
            <div className="flex space-x-3 pt-1">
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="btn-primary flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                {editSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleEditCancel}
                disabled={editSaving}
                className="btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {editSuccess && !isEditing && (
          <p className="mt-3 text-sm text-green-600">{editSuccess}</p>
        )}

        {/* Verification Status */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isVerified
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isVerified ? '✓ Verified Brother' : '⏳ Pending Verification'}
        </div>
      </div>

      {/* Stats Cards */}
      {counters && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {counters.visits}
            </div>
            <div className="text-sm text-gray-600">Lodge Visits</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {counters.charity}
            </div>
            <div className="text-sm text-gray-600">Charity Events</div>
          </div>
        </div>
      )}

      {/* Earned Badges */}
      {userBadges.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Earned Badges ({userBadges.length})
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {userBadges.map((userBadge) => (
              <div key={userBadge.badge.id} className="card text-center">
                <div className="text-3xl mb-2">
                  {getBadgeIcon(userBadge.badge.code)}
                </div>
                <h3 className="font-medium text-gray-900 text-sm">
                  {userBadge.badge.label}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Earned {new Date(userBadge.awarded_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge Progress */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Badge Progress
        </h2>
        
        <div className="space-y-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`card ${badge.is_earned ? 'bg-green-50 border-green-200' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {getBadgeIcon(badge.code)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">
                      {badge.label}
                      {badge.is_earned && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✓ Earned
                        </span>
                      )}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {badge.threshold} {badge.kind === 'visit' ? 'visits' : 'charity events'}
                    </span>
                  </div>
                  
                  {!badge.is_earned && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: getProgressWidth(badge.progress || 0) }}
                      ></div>
                    </div>
                  )}
                  
                  {!badge.is_earned && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((badge.progress || 0) * 100)}% complete
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="text-gray-900">{user?.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Role:</span>
            <span className="text-gray-900 capitalize">{user?.role}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Member since:</span>
            <span className="text-gray-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Handle:</span>
            <span className="text-gray-900 font-mono text-xs">
              {user?.obfuscated_handle || 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Privacy & Safety</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Your exact location is never stored or shared</p>
          <p>• Only verified brethren can see your presence on the map</p>
          <p>• Your first name is only shown after mutual connection</p>
          <p>• All activities require secretary confirmation</p>
        </div>
      </div>
    </div>
  );
}
