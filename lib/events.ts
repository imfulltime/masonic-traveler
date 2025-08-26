import { supabase } from './supabase';
import { calculateDistance, isWithinNext7Days } from './utils';
import { LocationCoords, EventWithLodge, RSVPStatus } from '@/types';

export class EventsService {
  /**
   * Get events happening in the next 7 days near user location
   */
  static async getUpcomingEvents(
    userCoords: LocationCoords,
    radiusKm: number = 50
  ): Promise<EventWithLodge[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Get user verification status
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', session.data.session.user.id)
      .single();

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Build query based on verification status
    let query = supabase
      .from('events')
      .select(`
        *,
        lodge:lodge_id (
          id,
          name,
          number,
          grand_lodge,
          district,
          address,
          city,
          lat,
          lng
        ),
        rsvps:event_rsvps (
          status,
          user_id
        )
      `)
      .eq('status', 'approved')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', sevenDaysFromNow.toISOString());

    // Non-verified users can only see public events
    if (!currentUser?.is_verified) {
      query = query.eq('visibility', 'public');
    }

    const { data: events, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;

    // Filter by distance and process data
    const nearbyEvents: EventWithLodge[] = [];

    for (const event of events || []) {
      const lodge = event.lodge;
      if (!lodge) continue;

      const distance = calculateDistance(
        userCoords,
        { lat: lodge.lat, lng: lodge.lng }
      );

      if (distance <= radiusKm) {
        const rsvps = event.rsvps || [];
        const userRsvp = rsvps.find((r: any) => r.user_id === session.data.session.user.id);

        nearbyEvents.push({
          ...event,
          lodge,
          rsvp_count: rsvps.filter((r: any) => r.status === 'yes').length,
          user_rsvp: userRsvp || undefined,
          distance_km: Math.round(distance * 10) / 10,
        } as EventWithLodge & { distance_km: number });
      }
    }

    return nearbyEvents.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }

  /**
   * RSVP to an event
   */
  static async rsvpToEvent(eventId: string, status: RSVPStatus) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert({
        event_id: eventId,
        user_id: session.data.session.user.id,
        status,
      }, {
        onConflict: 'event_id,user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check in to an event (I'm Here button)
   */
  static async checkInToEvent(eventId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Update RSVP with check-in time
    const { data, error } = await supabase
      .from('event_rsvps')
      .update({
        checkin_time: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', session.data.session.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get event details with RSVP information
   */
  static async getEventDetails(eventId: string) {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        lodge:lodge_id (
          id,
          name,
          number,
          grand_lodge,
          district,
          address,
          city,
          contact_email,
          contact_phone
        ),
        rsvps:event_rsvps (
          id,
          status,
          checkin_time,
          created_at,
          user:user_id (
            first_name,
            lodge:lodge_id (name)
          )
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return event;
  }

  /**
   * Create a new event (requires verification)
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

    // Check if user is verified
    const { data: user } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', session.data.session.user.id)
      .single();

    if (!user?.is_verified) {
      throw new Error('Only verified users can create events');
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: session.data.session.user.id,
        status: 'pending', // Requires secretary approval
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Search lodges for event creation
   */
  static async searchLodges(query: string, userCoords?: LocationCoords) {
    let lodgeQuery = supabase
      .from('lodges')
      .select('*')
      .or(`name.ilike.%${query}%, city.ilike.%${query}%, grand_lodge.ilike.%${query}%`)
      .limit(20);

    const { data: lodges, error } = await lodgeQuery;

    if (error) throw error;

    // Add distance if user coordinates provided
    if (userCoords && lodges) {
      return lodges.map(lodge => ({
        ...lodge,
        distance_km: calculateDistance(
          userCoords,
          { lat: lodge.lat, lng: lodge.lng }
        ),
      })).sort((a, b) => a.distance_km - b.distance_km);
    }

    return lodges || [];
  }
}
