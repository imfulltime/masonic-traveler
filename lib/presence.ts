import { supabase, supabaseAdmin } from './supabase';
import { fuzzCoordinates, calculateDistance } from './utils';
import { LocationCoords, NearbyBrother } from '@/types';

export class PresenceService {
  /**
   * Update user's presence with fuzzed coordinates
   */
  static async updatePresence(coords: LocationCoords, radiusKm: number = 10) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Fuzz coordinates server-side
    const fuzzed = fuzzCoordinates(coords);

    const { error } = await supabase
      .from('presence')
      .upsert({
        user_id: session.data.session.user.id,
        approx_lat: fuzzed.lat,
        approx_lng: fuzzed.lng,
        radius_km: radiusKm,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  /**
   * Get nearby verified brethren (privacy-safe)
   */
  static async getNearbyBrethren(
    userCoords: LocationCoords,
    radiusKm: number = 10
  ): Promise<NearbyBrother[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Check if current user is verified
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', session.data.session.user.id)
      .single();

    if (!currentUser?.is_verified) {
      throw new Error('Only verified users can see nearby brethren');
    }

    // Get all verified users with presence data (except current user)
    const { data: nearbyUsers, error } = await supabase
      .from('presence')
      .select(`
        user_id,
        approx_lat,
        approx_lng,
        radius_km,
        last_seen,
        user:user_id (
          id,
          first_name,
          is_verified,
          lodge:lodge_id (
            name,
            number
          )
        )
      `)
      .neq('user_id', session.data.session.user.id)
      .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Active in last 24h

    if (error) throw error;

    // Filter by distance and verified status
    const nearby: NearbyBrother[] = [];

    for (const presence of nearbyUsers || []) {
      const user = presence.user as any;
      
      // Only show verified users
      if (!user?.is_verified) continue;

      const distance = calculateDistance(
        userCoords,
        { lat: presence.approx_lat, lng: presence.approx_lng }
      );

      // Check if within radius
      if (distance <= radiusKm) {
        nearby.push({
          id: presence.user_id,
          label: user.lodge ? `Brother from ${user.lodge.name}` : 'Brother',
          lodge_name: user.lodge?.name,
          approx_circle: {
            center: [presence.approx_lng, presence.approx_lat],
            radius: 500, // Show fuzz circle of ~500m
          },
          distance_km: Math.round(distance * 10) / 10,
        });
      }
    }

    // Sort by distance
    return nearby.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  }

  /**
   * Check for intro request eligibility between users
   */
  static async canSendIntroRequest(targetUserId: string): Promise<boolean> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) return false;

    // Check if both users are verified
    const { data: users } = await supabase
      .from('users')
      .select('id, is_verified')
      .in('id', [session.data.session.user.id, targetUserId]);

    if (!users || users.length !== 2) return false;
    
    const allVerified = users.every(user => user.is_verified);
    if (!allVerified) return false;

    // Check if they're already connected (have a conversation)
    const { data: existingConvo } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversation:conversation_id (
          participants:conversation_participants (user_id)
        )
      `)
      .eq('user_id', session.data.session.user.id);

    if (existingConvo) {
      for (const convo of existingConvo) {
        const participants = convo.conversation?.participants || [];
        const hasTarget = participants.some((p: any) => p.user_id === targetUserId);
        if (hasTarget) return false; // Already connected
      }
    }

    return true;
  }

  /**
   * Send intro request (creates pending conversation)
   */
  static async sendIntroRequest(targetUserId: string, message: string = 'Hello Brother!') {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const canSend = await this.canSendIntroRequest(targetUserId);
    if (!canSend) throw new Error('Cannot send intro request to this user');

    // Create conversation
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convoError) throw convoError;

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: session.data.session.user.id },
        { conversation_id: conversation.id, user_id: targetUserId },
      ]);

    if (participantsError) throw participantsError;

    // Send initial message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: session.data.session.user.id,
        body: message,
      });

    if (messageError) throw messageError;

    return conversation;
  }

  /**
   * Clean up old presence data (run periodically)
   */
  static async cleanupOldPresence() {
    if (!supabaseAdmin) {
      console.warn('Cannot cleanup old presence - Supabase admin client not configured');
      return;
    }
    
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const { error } = await supabaseAdmin
      .from('presence')
      .delete()
      .lt('last_seen', cutoff.toISOString());

    if (error) throw error;
  }
}
