import { supabase, supabaseAdmin } from './supabase';
import { calculateScore } from './utils';
import { BadgeWithDetails, LeaderboardEntry, Counter } from '@/types';

export class GamificationService {
  /**
   * Get user's current counters
   */
  static async getUserCounters(userId?: string): Promise<Counter | null> {
    const session = await supabase.auth.getSession();
    const targetUserId = userId || session.data.session?.user?.id;
    
    if (!targetUserId) return null;

    const { data: counter, error } = await supabase
      .from('counters')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      // Create counter if it doesn't exist
      if (error.code === 'PGRST116') {
        const { data: newCounter } = await supabase
          .from('counters')
          .insert({
            user_id: targetUserId,
            visits: 0,
            charity: 0,
          })
          .select()
          .single();
        
        return newCounter;
      }
      throw error;
    }

    return counter;
  }

  /**
   * Get all available badges with user progress
   */
  static async getBadgesWithProgress(): Promise<BadgeWithDetails[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Get all badges
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .order('threshold', { ascending: true });

    if (badgesError) throw badgesError;

    // Get user's earned badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id, awarded_at')
      .eq('user_id', userId);

    if (userBadgesError) throw userBadgesError;

    // Get user's current counters
    const counter = await this.getUserCounters(userId);

    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

    return (badges || []).map(badge => {
      const isEarned = earnedBadgeIds.has(badge.id);
      let progress = 0;

      if (!isEarned && counter) {
        const currentCount = badge.kind === 'visit' ? counter.visits : counter.charity;
        progress = Math.min(currentCount / badge.threshold, 1);
      }

      return {
        ...badge,
        is_earned: isEarned,
        progress: isEarned ? 1 : progress,
      };
    });
  }

  /**
   * Get user's earned badges
   */
  static async getUserBadges(userId?: string) {
    const session = await supabase.auth.getSession();
    const targetUserId = userId || session.data.session?.user?.id;
    
    if (!targetUserId) return [];

    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select(`
        awarded_at,
        badge:badge_id (
          id,
          code,
          label,
          kind,
          threshold,
          icon_url
        )
      `)
      .eq('user_id', targetUserId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;

    return userBadges || [];
  }

  /**
   * Check and award badges to a user
   */
  static async checkAndAwardBadges(userId: string) {
    const counter = await this.getUserCounters(userId);
    if (!counter) return;

    // Get all badges the user hasn't earned yet
    const { data: availableBadges } = await supabase
      .from('badges')
      .select(`
        id,
        code,
        kind,
        threshold
      `)
      .not('id', 'in', `(
        SELECT badge_id FROM user_badges WHERE user_id = '${userId}'
      )`);

    if (!availableBadges) return;

    const newBadges = [];

    for (const badge of availableBadges) {
      const currentCount = badge.kind === 'visit' ? counter.visits : counter.charity;
      
      if (currentCount >= badge.threshold) {
        newBadges.push({
          user_id: userId,
          badge_id: badge.id,
        });
      }
    }

    if (newBadges.length > 0) {
      const { error } = await supabase
        .from('user_badges')
        .insert(newBadges);
      
      if (error) throw error;
    }

    return newBadges;
  }

  /**
   * Update user counters and refresh leaderboards
   */
  static async updateCounters(
    userId: string,
    type: 'visit' | 'charity',
    increment: number = 1
  ) {
    // Update counters
    const { data: updatedCounter, error: updateError } = await supabaseAdmin
      .from('counters')
      .upsert({
        user_id: userId,
        [type === 'visit' ? 'visits' : 'charity']: increment,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (updateError) throw updateError;

    // Check for new badges
    await this.checkAndAwardBadges(userId);

    // Refresh leaderboards
    await this.refreshLeaderboards();

    return updatedCounter;
  }

  /**
   * Get global leaderboard
   */
  static async getGlobalLeaderboard(period: 'all' | 'month' = 'all'): Promise<LeaderboardEntry[]> {
    const { data: leaderboard, error } = await supabase
      .from('leaderboard_global')
      .select(`
        user_id,
        visits,
        charity,
        score,
        rank,
        user:user_id (
          first_name,
          obfuscated_handle,
          lodge:lodge_id (name)
        )
      `)
      .order('rank', { ascending: true })
      .limit(50);

    if (error) throw error;

    return (leaderboard || []).map(entry => ({
      ...entry,
      user_display: this.getUserDisplayName(entry.user),
      lodge_name: entry.user?.lodge?.name,
    }));
  }

  /**
   * Get Grand Lodge leaderboard
   */
  static async getGrandLodgeLeaderboard(
    grandLodge: string,
    period: 'all' | 'month' = 'all'
  ): Promise<LeaderboardEntry[]> {
    const { data: leaderboard, error } = await supabase
      .from('leaderboard_by_gl')
      .select(`
        user_id,
        visits,
        charity,
        score,
        rank,
        user:user_id (
          first_name,
          obfuscated_handle,
          lodge:lodge_id (name)
        )
      `)
      .eq('grand_lodge', grandLodge)
      .order('rank', { ascending: true })
      .limit(50);

    if (error) throw error;

    return (leaderboard || []).map(entry => ({
      ...entry,
      user_display: this.getUserDisplayName(entry.user),
      lodge_name: entry.user?.lodge?.name,
    }));
  }

  /**
   * Get District leaderboard
   */
  static async getDistrictLeaderboard(
    district: string,
    period: 'all' | 'month' = 'all'
  ): Promise<LeaderboardEntry[]> {
    const { data: leaderboard, error } = await supabase
      .from('leaderboard_by_district')
      .select(`
        user_id,
        visits,
        charity,
        score,
        rank,
        user:user_id (
          first_name,
          obfuscated_handle,
          lodge:lodge_id (name)
        )
      `)
      .eq('district', district)
      .order('rank', { ascending: true })
      .limit(50);

    if (error) throw error;

    return (leaderboard || []).map(entry => ({
      ...entry,
      user_display: this.getUserDisplayName(entry.user),
      lodge_name: entry.user?.lodge?.name,
    }));
  }

  /**
   * Get user's rank in different leaderboards
   */
  static async getUserRanks(userId: string) {
    const { data: user } = await supabase
      .from('users')
      .select(`
        lodge:lodge_id (
          grand_lodge,
          district
        )
      `)
      .eq('id', userId)
      .single();

    const ranks: any = {};

    // Global rank
    const { data: globalRank } = await supabase
      .from('leaderboard_global')
      .select('rank, score')
      .eq('user_id', userId)
      .single();

    if (globalRank) {
      ranks.global = globalRank;
    }

    // Grand Lodge rank
    if (user?.lodge?.grand_lodge) {
      const { data: glRank } = await supabase
        .from('leaderboard_by_gl')
        .select('rank, score')
        .eq('user_id', userId)
        .eq('grand_lodge', user.lodge.grand_lodge)
        .single();

      if (glRank) {
        ranks.grand_lodge = glRank;
      }
    }

    // District rank
    if (user?.lodge?.district) {
      const { data: districtRank } = await supabase
        .from('leaderboard_by_district')
        .select('rank, score')
        .eq('user_id', userId)
        .eq('district', user.lodge.district)
        .single();

      if (districtRank) {
        ranks.district = districtRank;
      }
    }

    return ranks;
  }

  /**
   * Refresh all leaderboards (should be called periodically)
   */
  static async refreshLeaderboards() {
    try {
      // Refresh global leaderboard
      await supabaseAdmin.rpc('refresh_global_leaderboard');
      
      // Refresh GL leaderboards
      await supabaseAdmin.rpc('refresh_gl_leaderboards');
      
      // Refresh district leaderboards
      await supabaseAdmin.rpc('refresh_district_leaderboards');
    } catch (error) {
      console.error('Error refreshing leaderboards:', error);
      // Fall back to manual refresh if RPC functions don't exist
      await this.manualRefreshLeaderboards();
    }
  }

  /**
   * Manual leaderboard refresh (fallback)
   */
  private static async manualRefreshLeaderboards() {
    // Clear existing leaderboards
    await supabaseAdmin.from('leaderboard_global').delete().neq('user_id', '');
    await supabaseAdmin.from('leaderboard_by_gl').delete().neq('user_id', '');
    await supabaseAdmin.from('leaderboard_by_district').delete().neq('user_id', '');

    // Rebuild global leaderboard
    const { data: globalData } = await supabaseAdmin
      .from('counters')
      .select(`
        user_id,
        visits,
        charity,
        user:user_id (
          lodge:lodge_id (
            grand_lodge,
            district
          )
        )
      `);

    if (globalData) {
      const globalEntries = globalData
        .map(entry => ({
          user_id: entry.user_id,
          visits: entry.visits,
          charity: entry.charity,
          score: calculateScore(entry.visits, entry.charity),
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      if (globalEntries.length > 0) {
        await supabaseAdmin.from('leaderboard_global').insert(globalEntries);
      }

      // Group by Grand Lodge and District for those leaderboards
      const glGroups = new Map();
      const districtGroups = new Map();

      globalData.forEach(entry => {
        if (entry.user?.lodge?.grand_lodge) {
          const gl = entry.user.lodge.grand_lodge;
          if (!glGroups.has(gl)) glGroups.set(gl, []);
          glGroups.get(gl).push(entry);
        }

        if (entry.user?.lodge?.district) {
          const district = entry.user.lodge.district;
          if (!districtGroups.has(district)) districtGroups.set(district, []);
          districtGroups.get(district).push(entry);
        }
      });

      // Insert GL leaderboards
      for (const [grandLodge, entries] of glGroups) {
        const glEntries = entries
          .map((entry: any) => ({
            grand_lodge: grandLodge,
            user_id: entry.user_id,
            visits: entry.visits,
            charity: entry.charity,
            score: calculateScore(entry.visits, entry.charity),
          }))
          .sort((a: any, b: any) => b.score - a.score)
          .map((entry: any, index: number) => ({
            ...entry,
            rank: index + 1,
          }));

        if (glEntries.length > 0) {
          await supabaseAdmin.from('leaderboard_by_gl').insert(glEntries);
        }
      }

      // Insert district leaderboards
      for (const [district, entries] of districtGroups) {
        const districtEntries = entries
          .map((entry: any) => ({
            district,
            user_id: entry.user_id,
            visits: entry.visits,
            charity: entry.charity,
            score: calculateScore(entry.visits, entry.charity),
          }))
          .sort((a: any, b: any) => b.score - a.score)
          .map((entry: any, index: number) => ({
            ...entry,
            rank: index + 1,
          }));

        if (districtEntries.length > 0) {
          await supabaseAdmin.from('leaderboard_by_district').insert(districtEntries);
        }
      }
    }
  }

  /**
   * Get privacy-safe user display name
   */
  private static getUserDisplayName(user: any): string {
    if (!user) return 'Anonymous Brother';
    
    // For leaderboards, show first name + lodge if available
    if (user.first_name && user.lodge?.name) {
      return `${user.first_name} from ${user.lodge.name}`;
    }
    
    if (user.lodge?.name) {
      return `Brother from ${user.lodge.name}`;
    }
    
    return user.obfuscated_handle || 'Anonymous Brother';
  }
}
