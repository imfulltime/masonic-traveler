import { supabase } from './supabase';
import { GamificationService } from './gamification';
import { NotificationsService } from './notifications';

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

    // Notify the visiting user
    await NotificationsService.createNotification(
      userId,
      'check_in_confirmed',
      'Visit Confirmed',
      'Your lodge visit has been confirmed by the secretary.'
    );

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

    // Notify the user
    await NotificationsService.createNotification(
      userId,
      'charity_confirmed',
      'Charity Participation Confirmed',
      'Your charity event participation has been confirmed by the secretary.'
    );

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
      .select('lodge_id, status, created_by')
      .eq('id', eventId)
      .maybeSingle();

    if (!event) throw new Error('Event not found');
    if (event.status !== 'pending') throw new Error('Event is not pending approval');

    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', event.lodge_id)
      .eq('user_id', secretaryId)
      .maybeSingle();

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

    // Notify the event creator
    if (event.created_by) {
      await NotificationsService.createNotification(
        event.created_by,
        'event_approved',
        'Event Approved',
        'Your event has been approved and is now visible to brethren.'
      );
    }

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
   * Get recent confirmed activities (visit and charity confirmations) for the
   * secretary's lodge(s), ordered by confirmation date descending.
   *
   * Returns a unified list with:
   *   type        – 'visit' | 'charity'
   *   user_name   – first name of the confirmed user
   *   event_name  – title of the related event
   *   date        – ISO string of confirmed_at
   */
  static async getRecentActivities(): Promise<
    {
      id: string;
      type: 'visit' | 'charity';
      user_name: string;
      event_name: string;
      date: string;
    }[]
  > {
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

    // Fetch recent visit confirmations for events in the secretary's lodge(s)
    const { data: visitConfirmations, error: visitError } = await supabase
      .from('visit_confirmations')
      .select(`
        id,
        confirmed_at,
        user:user_id (
          first_name
        ),
        event:event_id (
          title,
          lodge_id
        )
      `)
      .in('lodge_id', lodgeIds)
      .order('confirmed_at', { ascending: false })
      .limit(20);

    if (visitError) throw visitError;

    // Fetch recent charity confirmations for events in the secretary's lodge(s)
    const { data: charityConfirmations, error: charityError } = await supabase
      .from('charity_confirmations')
      .select(`
        id,
        confirmed_at,
        user:user_id (
          first_name
        ),
        event:event_id (
          title,
          lodge_id
        )
      `)
      .order('confirmed_at', { ascending: false })
      .limit(20);

    if (charityError) throw charityError;

    // Map visit confirmations to unified shape, filtering by lodge
    const visitActivities = (visitConfirmations || [])
      .filter(vc => !vc.event || lodgeIds.includes((vc.event as any).lodge_id))
      .map(vc => ({
        id: vc.id,
        type: 'visit' as const,
        user_name: (vc.user as any)?.first_name || 'Unknown',
        event_name: (vc.event as any)?.title || 'Unknown Event',
        date: vc.confirmed_at ?? '',
      }));

    // Map charity confirmations to unified shape, filtering by lodge
    const charityActivities = (charityConfirmations || [])
      .filter(cc => !cc.event || lodgeIds.includes((cc.event as any).lodge_id))
      .map(cc => ({
        id: cc.id,
        type: 'charity' as const,
        user_name: (cc.user as any)?.first_name || 'Unknown',
        event_name: (cc.event as any)?.title || 'Unknown Event',
        date: cc.confirmed_at ?? '',
      }));

    // Merge, sort by date descending, return top 20
    const all = [...visitActivities, ...charityActivities].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return all.slice(0, 20);
  }

  /**
   * Get ALL events for the secretary's lodges (all statuses)
   */
  static async getAllEventsForLodges(): Promise<any[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const { data: secretaryLodges } = await supabase
      .from('lodge_secretaries')
      .select('lodge_id')
      .eq('user_id', session.data.session.user.id);

    if (!secretaryLodges?.length) return [];
    const lodgeIds = secretaryLodges.map((l: any) => l.lodge_id);

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, title, description, type, start_time, end_time, visibility, status, created_at,
        lodge:lodge_id (id, name, number, grand_lodge),
        creator:created_by (id, first_name, email)
      `)
      .in('lodge_id', lodgeIds)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return events || [];
  }

  /**
   * Secretary creates an event — auto-approved, no pending step
   */
  static async createEvent(eventData: {
    lodge_id: string;
    type: 'meeting' | 'charity';
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    visibility?: 'public' | 'members';
  }) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: session.data.session.user.id,
        approved_by: session.data.session.user.id,
        status: 'approved',
      });

    if (error) throw error;
  }

  /**
   * Update an event's details
   */
  static async updateEvent(eventId: string, eventData: {
    type?: 'meeting' | 'charity';
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    visibility?: 'public' | 'members';
  }) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Verify secretary permission
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
      .eq('user_id', session.data.session.user.id)
      .maybeSingle();

    if (!isSecretary) throw new Error('Only lodge secretaries can update this event');

    const { error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId);

    if (error) throw error;
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Verify secretary permission
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
      .eq('user_id', session.data.session.user.id)
      .maybeSingle();

    if (!isSecretary) throw new Error('Only lodge secretaries can delete this event');

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }

  static async getPendingCheckIns() {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');
    const secretaryId = session.data.session.user.id;

    const { data: secretaryLodges } = await supabase
      .from('lodge_secretaries')
      .select('lodge_id')
      .eq('user_id', secretaryId);

    if (!secretaryLodges?.length) return [];

    const lodgeIds = secretaryLodges.map((l: any) => l.lodge_id);

    // Get approved events for these lodges (last 30 days to future)
    const { data: events } = await supabase
      .from('events')
      .select('id, title, type, lodge_id')
      .in('lodge_id', lodgeIds)
      .eq('status', 'approved')
      .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!events?.length) return [];

    const eventIds = events.map((e: any) => e.id);
    const eventMap = new Map(events.map((e: any) => [e.id, e]));

    // Get RSVPs with check-in times
    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select(`
        user_id, event_id, checkin_time,
        user:user_id (id, first_name, email, lodge:lodge_id (name))
      `)
      .in('event_id', eventIds)
      .not('checkin_time', 'is', null)
      .order('checkin_time', { ascending: false });

    if (error) throw error;

    // Get already-confirmed
    const [{ data: visitConfs }, { data: charityConfs }] = await Promise.all([
      supabase.from('visit_confirmations').select('user_id, event_id').in('event_id', eventIds),
      supabase.from('charity_confirmations').select('user_id, event_id').in('event_id', eventIds),
    ]);

    const confirmedSet = new Set([
      ...(visitConfs || []).map((c: any) => `${c.user_id}:${c.event_id}`),
      ...(charityConfs || []).map((c: any) => `${c.user_id}:${c.event_id}`),
    ]);

    return (rsvps || [])
      .filter((r: any) => !confirmedSet.has(`${r.user_id}:${r.event_id}`))
      .map((r: any) => ({
        user_id: r.user_id,
        event_id: r.event_id,
        checkin_time: r.checkin_time,
        user: r.user,
        event: eventMap.get(r.event_id),
      }));
  }

  /**
   * Get full RSVP attendee list for an event, grouped by status
   */
  static async getEventAttendees(eventId: string): Promise<{
    going: any[];
    maybe: any[];
    notGoing: any[];
    checkedIn: any[];
    total: number;
  }> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Verify secretary permission for this event's lodge
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
      .eq('user_id', session.data.session.user.id)
      .maybeSingle();

    if (!isSecretary) throw new Error('Only lodge secretaries can view attendee lists');

    const { data: rsvps, error } = await supabase
      .from('event_rsvps')
      .select(`
        user_id, status, checkin_time,
        user:user_id (id, first_name, email, lodge:lodge_id (name))
      `)
      .eq('event_id', eventId)
      .order('checkin_time', { ascending: false, nullsFirst: false });

    if (error) throw error;

    const all = rsvps || [];
    return {
      going: all.filter((r: any) => r.status === 'yes'),
      maybe: all.filter((r: any) => r.status === 'maybe'),
      notGoing: all.filter((r: any) => r.status === 'no'),
      checkedIn: all.filter((r: any) => r.checkin_time !== null),
      total: all.length,
    };
  }
}
