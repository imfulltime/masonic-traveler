'use client';

import { useState, useEffect } from 'react';
import { GamificationService } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, Crown, Star } from 'lucide-react';

// ---------------------------------------------------------------------------
// Static badge metadata — defined outside the component
// ---------------------------------------------------------------------------
const BADGE_META: Record<string, { icon: string; flavor: string; steps: string[] }> = {
  traveling_man: {
    icon: '🧭',
    flavor: 'Attend a lodge meeting outside your Mother Lodge and have the host Secretary confirm your visit.',
    steps: [
      'RSVP to any lodge event on the Events page',
      'Attend and tap "I\'m Here" to check in',
      'The host Lodge Secretary confirms your visit',
    ],
  },
  wandering_mason: {
    icon: '⚓',
    flavor: 'Prove your dedication as a traveling brother by visiting 6 lodge meetings beyond your own.',
    steps: [
      'Continue visiting lodges and checking in',
      'Each Secretary-confirmed visit counts',
      'Accumulate 6 confirmed visits total',
    ],
  },
  globetrotter: {
    icon: '🌍',
    flavor: 'A true pilgrim of the Craft. Your travels have taken you far across the fraternity.',
    steps: [
      'Keep attending and checking into lodge events',
      'Reach 16 total confirmed lodge visits',
    ],
  },
  master_traveler: {
    icon: '👑',
    flavor: 'The highest honor for a traveling brother. Your commitment to the Craft is unmatched.',
    steps: ['Reach 31 total confirmed lodge visits — the ultimate milestone'],
  },
  helping_hand: {
    icon: '🤝',
    flavor: 'Your first act of Masonic charity. The journey of service begins with a single deed.',
    steps: [
      'RSVP to a charity event on the Events page',
      'Attend and tap "I\'m Here" to check in',
      'The Secretary confirms your charity participation',
    ],
  },
  charity_builder: {
    icon: '⚒️',
    flavor: 'Five acts of service — a clear demonstration of Masonic virtue in daily life.',
    steps: [
      'Continue participating in charity events',
      'Each Secretary-confirmed charity event counts',
      'Accumulate 5 confirmed charity events',
    ],
  },
  beacon_of_light: {
    icon: '🕯️',
    flavor: 'Your light shines throughout the fraternity. Fifteen acts of service mark you as a pillar of the Craft.',
    steps: ['Reach 15 total confirmed charity events'],
  },
};

// ---------------------------------------------------------------------------
// SVG Progress Ring — defined outside the component
// ---------------------------------------------------------------------------
function ProgressRing({ progress, size = 56, earned }: { progress: number; size?: number; earned: boolean }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={earned ? '#16a34a' : '#2563eb'}
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function LeaderboardPage() {
  const { user, isVerified } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'gl' | 'district' | 'badges'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRanks, setUserRanks] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Badge state
  const [badgeData, setBadgeData] = useState<{ badges: any[]; newlyAwarded: any[] }>({ badges: [], newlyAwarded: [] });
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);

  // Load leaderboard when on a leaderboard tab
  useEffect(() => {
    if (isVerified && user && activeTab !== 'badges') {
      loadLeaderboard();
      loadUserRanks();
    }
  }, [activeTab, isVerified, user]);

  // Load badges when on the badges tab
  useEffect(() => {
    if (activeTab === 'badges' && isVerified && user) {
      loadBadges();
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

  const loadBadges = async () => {
    try {
      setBadgesLoading(true);
      const result = await GamificationService.getBadgesWithProgress();
      setBadgeData(result);
      if (result.newlyAwarded.length > 0) {
        setBadgeToast(`New Badge Conferred: ${result.newlyAwarded[0].label}!`);
        setTimeout(() => setBadgeToast(null), 5000);
      }
    } catch (err) {
      console.error('Error loading badges:', err);
    } finally {
      setBadgesLoading(false);
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

  // ---------------------------------------------------------------------------
  // Badge card renderer — defined inside component (uses state)
  // ---------------------------------------------------------------------------
  const renderBadgeCard = (badge: any) => {
    const meta = BADGE_META[badge.code] || { icon: '🏅', flavor: '', steps: [] };
    const isExpanded = expandedBadge === badge.id;
    const currentCount = Math.round(badge.progress * badge.threshold);
    const notStarted = badge.progress === 0 && !badge.is_earned;

    return (
      <div
        key={badge.id}
        className={`rounded-xl border p-4 transition-all ${
          badge.is_earned
            ? 'border-green-300 bg-green-50'
            : notStarted
            ? 'border-gray-200 bg-gray-50 opacity-70'
            : 'border-blue-200 bg-white'
        }`}
      >
        <div className="flex items-center space-x-4">
          {/* Progress ring + icon */}
          <div className="relative flex-shrink-0">
            <ProgressRing progress={badge.progress} earned={badge.is_earned} />
            <span className="absolute inset-0 flex items-center justify-center text-xl">
              {badge.is_earned ? '✓' : meta.icon}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${badge.is_earned ? 'text-green-800' : 'text-gray-900'}`}>
                {badge.label}
              </h3>
              {badge.is_earned && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Conferred
                </span>
              )}
              {notStarted && (
                <span className="text-xs text-gray-400">🔒 Locked</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {badge.is_earned
                ? `${badge.threshold} ${badge.kind === 'visit' ? 'lodge visit' : 'charity event'}${badge.threshold > 1 ? 's' : ''} completed`
                : `${currentCount} / ${badge.threshold} ${badge.kind === 'visit' ? 'lodge visit' : 'charity event'}${badge.threshold > 1 ? 's' : ''}`
              }
            </p>
            {/* Progress bar */}
            {!badge.is_earned && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${badge.progress * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpandedBadge(isExpanded ? null : badge.id)}
            className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 underline"
          >
            {isExpanded ? 'Hide' : 'How?'}
          </button>
        </div>

        {/* Expandable how-to-earn */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 italic mb-3">"{meta.flavor}"</p>
            <p className="text-xs font-medium text-gray-700 mb-2">Steps to earn:</p>
            <ol className="space-y-1">
              {meta.steps.map((step, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start space-x-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium text-xs">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Verification gate
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leaderboards</h1>
        <p className="text-gray-600">Celebrating fraternal engagement and service</p>
      </div>

      {/* User Rank Summary — only show on leaderboard tabs */}
      {activeTab !== 'badges' && Object.keys(userRanks).length > 0 && (
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
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'badges'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Badges
        </button>
      </div>

      {/* Leaderboard Content — hidden on Badges tab */}
      {activeTab !== 'badges' && (
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
      )}

      {/* Badges Tab Content */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          {/* Toast notification */}
          {badgeToast && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center space-x-3">
              <span className="text-2xl">🎉</span>
              <span className="font-medium text-yellow-900">{badgeToast}</span>
            </div>
          )}

          {badgesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading your journey...</p>
            </div>
          ) : (
            <>
              {/* Visiting Path */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                  <span>🧭</span><span>The Traveling Path</span>
                </h2>
                <p className="text-sm text-gray-500 mb-4">Earned through confirmed lodge visits</p>
                <div className="space-y-3">
                  {badgeData.badges.filter(b => b.kind === 'visit').map(badge => renderBadgeCard(badge))}
                </div>
              </div>

              {/* Service Path */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center space-x-2">
                  <span>🕯️</span><span>The Service Path</span>
                </h2>
                <p className="text-sm text-gray-500 mb-4">Earned through confirmed charity participation</p>
                <div className="space-y-3">
                  {badgeData.badges.filter(b => b.kind === 'charity').map(badge => renderBadgeCard(badge))}
                </div>
              </div>

              {/* How scoring works reminder */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 space-y-1">
                <p className="font-medium text-blue-900">How points are confirmed</p>
                <p>• RSVP to an event → attend → tap "I'm Here"</p>
                <p>• The Lodge Secretary confirms your attendance</p>
                <p>• Visits = 1 pt each · Charity events = 2 pts each</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Scoring Info — only show on leaderboard tabs */}
      {activeTab !== 'badges' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How scoring works</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Lodge Visits:</strong> 1 point each (confirmed by Secretary)</p>
            <p>• <strong>Charity Events:</strong> 2 points each (confirmed by Secretary)</p>
            <p>• Rankings update daily based on confirmed activities</p>
          </div>
        </div>
      )}
    </div>
  );
}
