import { supabase } from './supabase';

export interface PlatformStats {
  totalUsers: number;
  verifiedUsers: number;
  totalLodges: number;
  totalEvents: number;
  pendingVerifications: number;
}

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: 'brother' | 'secretary' | 'admin';
  is_verified: boolean;
  created_at: string;
  lodge: { id: string; name: string; number: string } | null;
}

export interface AdminLodge {
  id: string;
  name: string;
  number: string;
  grand_lodge: string;
  district: string;
  city: string;
  country: string;
  member_count?: number;
}

export interface AdminPendingVerification {
  id: string;
  status: string;
  method: string;
  created_at: string;
  subject_user: { first_name: string | null; email: string } | null;
  lodge: { name: string; number: string } | null;
}

export class AdminService {
  /**
   * Verify the current user is an admin. Throws if not.
   */
  private static async requireAdmin(): Promise<string> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.data.session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return session.data.session.user.id;
  }

  /**
   * Get platform-wide statistics
   */
  static async getPlatformStats(): Promise<PlatformStats> {
    await this.requireAdmin();
    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: totalLodges },
      { count: totalEvents },
      { count: pendingVerifications },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('lodges').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      totalUsers: totalUsers || 0,
      verifiedUsers: verifiedUsers || 0,
      totalLodges: totalLodges || 0,
      totalEvents: totalEvents || 0,
      pendingVerifications: pendingVerifications || 0,
    };
  }

  /**
   * Get all users with optional search filter
   */
  static async getAllUsers(search?: string): Promise<AdminUser[]> {
    let query = supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        role,
        is_verified,
        created_at,
        lodge:lodge_id (
          id,
          name,
          number
        )
      `)
      .order('created_at', { ascending: false });

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as unknown as AdminUser[];
  }

  /**
   * Update a user's role
   */
  static async updateUserRole(
    userId: string,
    role: 'brother' | 'secretary' | 'admin'
  ): Promise<void> {
    await this.requireAdmin();

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Set a user's verified status.
   * When verifying, also upsert a counters row for the user.
   */
  static async setUserVerified(userId: string, isVerified: boolean): Promise<void> {
    await this.requireAdmin();

    const { error } = await supabase
      .from('users')
      .update({ is_verified: isVerified })
      .eq('id', userId);

    if (error) throw error;

    if (isVerified) {
      const { error: counterError } = await supabase
        .from('counters')
        .upsert(
          { user_id: userId, visits: 0, charity: 0 },
          { onConflict: 'user_id', ignoreDuplicates: true }
        );

      if (counterError) throw counterError;
    }
  }

  /**
   * Promote a user to secretary and register them in lodge_secretaries
   */
  static async promoteToSecretary(userId: string, lodgeId: string): Promise<void> {
    await this.requireAdmin();

    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'secretary' })
      .eq('id', userId);

    if (roleError) throw roleError;

    const { error: secretaryError } = await supabase
      .from('lodge_secretaries')
      .insert({ user_id: userId, lodge_id: lodgeId });

    if (secretaryError) throw secretaryError;
  }

  /**
   * Get all lodges
   */
  static async getAllLodges(): Promise<AdminLodge[]> {
    const { data, error } = await supabase
      .from('lodges')
      .select('id, name, number, grand_lodge, district, city, country')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as AdminLodge[];
  }

  /**
   * Create a new lodge
   */
  static async createLodge(data: {
    name: string;
    number: string;
    grand_lodge: string;
    district?: string;
    address?: string;
    city: string;
    country: string;
    lat?: number;
    lng?: number;
    contact_email?: string;
    contact_phone?: string;
  }): Promise<void> {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;

    const { error } = await supabase.from('lodges').insert({
      name: data.name,
      number: data.number,
      grand_lodge: data.grand_lodge,
      district: data.district ?? '',
      address: data.address ?? '',
      city: data.city,
      country: data.country,
      lat: data.lat ?? 0,
      lng: data.lng ?? 0,
      contact_email: data.contact_email ?? null,
      contact_phone: data.contact_phone ?? null,
      ...(userId ? { created_by: userId } : {}),
    } as any);

    if (error) throw error;
  }

  /**
   * Update an existing lodge
   */
  static async updateLodge(
    id: string,
    data: Partial<{
      name: string;
      number: string;
      grand_lodge: string;
      district: string;
      address: string;
      city: string;
      country: string;
      lat: number;
      lng: number;
      contact_email: string;
      contact_phone: string;
    }>
  ): Promise<void> {
    const { error } = await supabase
      .from('lodges')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a lodge by ID
   */
  static async deleteLodge(id: string): Promise<void> {
    const { error } = await supabase.from('lodges').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Get all pending verifications across all lodges
   */
  static async getPendingVerifications(): Promise<AdminPendingVerification[]> {
    const { data, error } = await supabase
      .from('verifications')
      .select(`
        id,
        status,
        method,
        created_at,
        subject_user:subject_user_id (
          first_name,
          email
        ),
        lodge:lodge_id (
          name,
          number
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as AdminPendingVerification[];
  }
}
