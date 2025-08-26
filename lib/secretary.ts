import { supabase } from './supabase';
import { GamificationService } from './gamification';

export class SecretaryService {
  /**
   * Confirm a visit for a user
   */
  static async confirmVisit(
    userId: string,
    lodgeId: string,
    eventId?: string
  ) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Verify secretary permission for this lodge
    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', lodgeId)
      .eq('user_id', secretaryId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can confirm visits');
    }

    // Create visit confirmation
    const { data: confirmation, error } = await supabase
      .from('visit_confirmations')
      .insert({
        lodge_id: lodgeId,
        user_id: userId,
        event_id: eventId,
        confirmed_by: secretaryId,
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's visit counter
    await GamificationService.updateCounters(userId, 'visit', 1);

    return confirmation;
  }

  /**
   * Confirm charity participation for a user
   */
  static async confirmCharity(
    userId: string,
    eventId: string
  ) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get event and verify secretary permission
    const { data: event } = await supabase
      .from('events')
      .select('lodge_id')
      .eq('id', eventId)
      .single();

    if (!event) throw new Error('Event not found');

    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', event.lodge_id)
      .eq('user_id', secretaryId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can confirm charity participation');
    }

    // Create charity confirmation
    const { data: confirmation, error } = await supabase
      .from('charity_confirmations')
      .insert({
        event_id: eventId,
        user_id: userId,
        confirmed_by: secretaryId,
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's charity counter
    await GamificationService.updateCounters(userId, 'charity', 1);

    return confirmation;
  }

  /**
   * Get users who checked in to an event and need confirmation
   */
  static async getEventCheckIns(eventId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get event and verify secretary permission
    const { data: event } = await supabase
      .from('events')
      .select('lodge_id, title, type')
      .eq('id', eventId)
      .single();

    if (!event) throw new Error('Event not found');

    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', event.lodge_id)
      .eq('user_id', secretaryId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can view event check-ins');
    }

    // Get users who checked in
    const { data: checkIns, error } = await supabase
      .from('event_rsvps')
      .select(`
        user_id,
        checkin_time,
        user:user_id (
          id,
          first_name,
          email,
          lodge:lodge_id (name)
        )
      `)
      .eq('event_id', eventId)
      .not('checkin_time', 'is', null)
      .order('checkin_time', { ascending: true });

    if (error) throw error;

    // Check which users already have confirmations
    const userIds = checkIns?.map(ci => ci.user_id) || [];
    
    let existingConfirmations: any[] = [];
    if (userIds.length > 0) {
      if (event.type === 'charity') {
        const { data: charityConfirmations } = await supabase
          .from('charity_confirmations')
          .select('user_id')
          .eq('event_id', eventId)
          .in('user_id', userIds);
        
        existingConfirmations = charityConfirmations || [];
      } else {
        const { data: visitConfirmations } = await supabase
          .from('visit_confirmations')
          .select('user_id')
          .eq('event_id', eventId)
          .in('user_id', userIds);
        
        existingConfirmations = visitConfirmations || [];
      }
    }

    const confirmedUserIds = new Set(existingConfirmations.map(c => c.user_id));

    return {
      event,
      checkIns: (checkIns || []).map(checkIn => ({
        ...checkIn,
        is_confirmed: confirmedUserIds.has(checkIn.user_id),
      })),
    };
  }

  /**
   * Get lodge events that need secretary approval
   */
  static async getPendingEvents() {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get lodges where user is secretary
    const { data: secretaryLodges } = await supabase
      .from('lodge_secretaries')
      .select('lodge_id')
      .eq('user_id', secretaryId);

    if (!secretaryLodges || secretaryLodges.length === 0) {
      return [];
    }

    const lodgeIds = secretaryLodges.map(l => l.lodge_id);

    // Get pending events for these lodges
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        type,
        start_time,
        end_time,
        visibility,
        created_at,
        lodge:lodge_id (
          id,
          name,
          number
        ),
        creator:created_by (
          id,
          first_name,
          email
        )
      `)
      .eq('status', 'pending')
      .in('lodge_id', lodgeIds)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return events || [];
  }

  /**
   * Approve an event
   */
  static async approveEvent(eventId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get event and verify secretary permission
    const { data: event } = await supabase
      .from('events')
      .select('lodge_id, status')
      .eq('id', eventId)
      .single();

    if (!event) throw new Error('Event not found');
    if (event.status !== 'pending') throw new Error('Event is not pending approval');

    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', event.lodge_id)
      .eq('user_id', secretaryId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can approve events');
    }

    // Approve event
    const { error } = await supabase
      .from('events')
      .update({
        status: 'approved',
        approved_by: secretaryId,
      })
      .eq('id', eventId);

    if (error) throw error;
    return event;
  }

  /**
   * Reject an event
   */
  static async rejectEvent(eventId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get event and verify secretary permission
    const { data: event } = await supabase
      .from('events')
      .select('lodge_id, status')
      .eq('id', eventId)
      .single();

    if (!event) throw new Error('Event not found');
    if (event.status !== 'pending') throw new Error('Event is not pending approval');

    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', event.lodge_id)
      .eq('user_id', secretaryId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can reject events');
    }

    // Reject event
    const { error } = await supabase
      .from('events')
      .update({
        status: 'rejected',
        approved_by: secretaryId,
      })
      .eq('id', eventId);

    if (error) throw error;
    return event;
  }

  /**
   * Get secretary dashboard summary
   */
  static async getDashboardSummary() {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get lodges where user is secretary
    const { data: secretaryLodges } = await supabase
      .from('lodge_secretaries')
      .select(`
        lodge:lodge_id (
          id,
          name,
          number
        )
      `)
      .eq('user_id', secretaryId);

    if (!secretaryLodges || secretaryLodges.length === 0) {
      return {
        lodges: [],
        pending_verifications: 0,
        pending_events: 0,
        recent_confirmations: 0,
      };
    }

    const lodgeIds = secretaryLodges.map(l => l.lodge.id);

    // Get counts
    const [
      { count: pendingVerifications },
      { count: pendingEvents },
      { count: recentConfirmations }
    ] = await Promise.all([
      supabase
        .from('verifications')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .in('lodge_id', lodgeIds),
      
      supabase
        .from('events')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
        .in('lodge_id', lodgeIds),
      
      supabase
        .from('visit_confirmations')
        .select('id', { count: 'exact' })
        .eq('confirmed_by', secretaryId)
        .gte('confirmed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      lodges: secretaryLodges.map(sl => sl.lodge),
      pending_verifications: pendingVerifications || 0,
      pending_events: pendingEvents || 0,
      recent_confirmations: recentConfirmations || 0,
    };
  }

  /**
   * Get recent activities for secretary review
   */
  static async getRecentActivities() {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const secretaryId = session.data.session.user.id;

    // Get lodges where user is secretary
    const { data: secretaryLodges } = await supabase
      .from('lodge_secretaries')
      .select('lodge_id')
      .eq('user_id', secretaryId);

    if (!secretaryLodges || secretaryLodges.length === 0) {
      return [];
    }

    const lodgeIds = secretaryLodges.map(l => l.lodge_id);

    // Get recent check-ins that need confirmation
    const { data: recentCheckIns } = await supabase
      .from('event_rsvps')
      .select(`
        event_id,
        user_id,
        checkin_time,
        event:event_id (
          id,
          title,
          type,
          lodge_id
        ),
        user:user_id (
          id,
          first_name,
          email
        )
      `)
      .not('checkin_time', 'is', null)
      .gte('checkin_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('checkin_time', { ascending: false });

    // Filter for secretary's lodges and unconfirmed check-ins
    const activities = [];
    
    for (const checkIn of recentCheckIns || []) {
      if (!lodgeIds.includes(checkIn.event?.lodge_id)) continue;

      // Check if already confirmed
      let isConfirmed = false;
      
      if (checkIn.event?.type === 'charity') {
        const { data: confirmation } = await supabase
          .from('charity_confirmations')
          .select('id')
          .eq('event_id', checkIn.event_id)
          .eq('user_id', checkIn.user_id)
          .single();
        
        isConfirmed = !!confirmation;
      } else {
        const { data: confirmation } = await supabase
          .from('visit_confirmations')
          .select('id')
          .eq('event_id', checkIn.event_id)
          .eq('user_id', checkIn.user_id)
          .single();
        
        isConfirmed = !!confirmation;
      }

      if (!isConfirmed) {
        activities.push({
          type: 'checkin',
          ...checkIn,
        });
      }
    }

    return activities.slice(0, 20); // Limit to 20 recent activities
  }
}
