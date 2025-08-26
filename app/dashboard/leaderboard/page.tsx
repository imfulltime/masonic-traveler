'use client';

import { useState, useEffect } from 'react';
import { GamificationService } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const { user, isVerified } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'gl' | 'district'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRanks, setUserRanks] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isVerified && user) {
      loadLeaderboard();
      loadUserRanks();
    }
  }, [activeTab, isVerified, user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let data: LeaderboardEntry[] = [];

      switch (activeTab) {
        case 'global':
          data = await GamificationService.getGlobalLeaderboard();
          break;
        case 'gl':
          if (user?.lodge?.grand_lodge) {
            data = await GamificationService.getGrandLodgeLeaderboard(user.lodge.grand_lodge);
          }
          break;
        case 'district':
          if (user?.lodge?.district) {
            data = await GamificationService.getDistrictLeaderboard(user.lodge.district);
          }
          break;
      }

      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message || 'Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRanks = async () => {
    if (!user?.id) return;
    
    try {
      const ranks = await GamificationService.getUserRanks(user.id);
      setUserRanks(ranks);
    } catch (err) {
      console.error('Error loading user ranks:', err);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getUserCurrentRank = () => {
    switch (activeTab) {
      case 'global':
        return userRanks.global;
      case 'gl':
        return userRanks.grand_lodge;
      case 'district':
        return userRanks.district;
      default:
        return null;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'global':
        return 'Global Leaderboard';
      case 'gl':
        return `${user?.lodge?.grand_lodge || 'Grand Lodge'} Leaderboard`;
      case 'district':
        return `District ${user?.lodge?.district || ''} Leaderboard`;
      default:
        return 'Leaderboard';
    }
  };

  if (!isVerified) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Verification Required
          </h2>
          <p className="text-yellow-700">
            You need to be verified to view leaderboards and compete with other brethren.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboards</h1>
        <p className="text-gray-600">Celebrating fraternal engagement and service</p>
      </div>

      {/* User Rank Summary */}
      {Object.keys(userRanks).length > 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-white">
          <h3 className="font-semibold mb-3 flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Your Rankings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {userRanks.global && (
              <div className="text-center">
                <div className="text-2xl font-bold">#{userRanks.global.rank}</div>
                <div className="text-sm opacity-90">Global</div>
                <div className="text-xs opacity-75">{userRanks.global.score} points</div>
              </div>
            )}
            {userRanks.grand_lodge && (
              <div className="text-center">
                <div className="text-2xl font-bold">#{userRanks.grand_lodge.rank}</div>
                <div className="text-sm opacity-90">Grand Lodge</div>
                <div className="text-xs opacity-75">{userRanks.grand_lodge.score} points</div>
              </div>
            )}
            {userRanks.district && (
              <div className="text-center">
                <div className="text-2xl font-bold">#{userRanks.district.rank}</div>
                <div className="text-sm opacity-90">District</div>
                <div className="text-xs opacity-75">{userRanks.district.score} points</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'global'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setActiveTab('gl')}
          disabled={!user?.lodge?.grand_lodge}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'gl'
              ? 'bg-white text-primary-600 shadow-sm'
              : user?.lodge?.grand_lodge
              ? 'text-gray-600 hover:text-gray-900'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          Grand Lodge
        </button>
        <button
          onClick={() => setActiveTab('district')}
          disabled={!user?.lodge?.district}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'district'
              ? 'bg-white text-primary-600 shadow-sm'
              : user?.lodge?.district
              ? 'text-gray-600 hover:text-gray-900'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          District
        </button>
      </div>

      {/* Leaderboard Content */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{getTabTitle()}</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
            <p>Be the first to earn points through visits and charity work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`card ${
                  entry.user_id === user?.id
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {entry.user_display}
                      {entry.user_id === user?.id && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </h3>
                    {entry.lodge_name && (
                      <p className="text-sm text-gray-600 truncate">{entry.lodge_name}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      {entry.score}
                    </div>
                    <div className="text-xs text-gray-500 space-x-2">
                      <span>{entry.visits} visits</span>
                      <span>•</span>
                      <span>{entry.charity} charity</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scoring Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How scoring works</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Lodge Visits:</strong> 1 point each (confirmed by Secretary)</p>
          <p>• <strong>Charity Events:</strong> 2 points each (confirmed by Secretary)</p>
          <p>• Rankings update daily based on confirmed activities</p>
        </div>
      </div>
    </div>
  );
}
