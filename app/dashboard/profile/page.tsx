'use client';

import { useState, useEffect } from 'react';
import { GamificationService } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import { BadgeWithDetails, Counter } from '@/types';
import { User, MapPin, Calendar, Award, Target, Edit } from 'lucide-react';

export default function ProfilePage() {
  const { user, isVerified } = useAuth();
  const [badges, setBadges] = useState<BadgeWithDetails[]>([]);
  const [counters, setCounters] = useState<Counter | null>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [badgesData, countersData, userBadgesData] = await Promise.all([
        GamificationService.getBadgesWithProgress(),
        GamificationService.getUserCounters(),
        GamificationService.getUserBadges(),
      ]);
      
      setBadges(badgesData);
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
          
          <button className="btn-secondary">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>

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
