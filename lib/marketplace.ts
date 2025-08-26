import { supabase } from './supabase';
import { Business } from '@/types';

export class MarketplaceService {
  /**
   * Get all businesses with optional filtering
   */
  static async getBusinesses(filters?: {
    category?: string;
    city?: string;
    country?: string;
    search?: string;
  }): Promise<Business[]> {
    let query = supabase
      .from('businesses')
      .select('*')
      .order('name', { ascending: true });

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters?.country) {
      query = query.eq('country', filters.country);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,category.ilike.%${filters.search}%`);
    }

    const { data: businesses, error } = await query;

    if (error) throw error;
    return businesses || [];
  }

  /**
   * Get business by ID
   */
  static async getBusinessById(id: string): Promise<Business | null> {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return business;
  }

  /**
   * Get available categories
   */
  static async getCategories(): Promise<string[]> {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('category')
      .order('category');

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(businesses?.map(b => b.category) || [])];
    return categories.sort();
  }

  /**
   * Get available cities
   */
  static async getCities(): Promise<string[]> {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('city')
      .order('city');

    if (error) throw error;

    // Get unique cities
    const cities = [...new Set(businesses?.map(b => b.city) || [])];
    return cities.sort();
  }

  /**
   * Submit a new business (admin approval required)
   */
  static async submitBusiness(businessData: {
    name: string;
    category: string;
    city: string;
    country: string;
    lodge_proximity_km?: number;
    contact?: string;
    website?: string;
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
      throw new Error('Only verified users can submit businesses');
    }

    // For now, auto-approve submissions (in production, this would require admin approval)
    const { data: business, error } = await supabase
      .from('businesses')
      .insert(businessData)
      .select()
      .single();

    if (error) throw error;
    return business;
  }

  /**
   * Update business (admin only)
   */
  static async updateBusiness(
    id: string,
    updates: Partial<Omit<Business, 'id' | 'created_at'>>
  ) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.data.session.user.id)
      .single();

    if (user?.role !== 'admin') {
      throw new Error('Only admins can update businesses');
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return business;
  }

  /**
   * Delete business (admin only)
   */
  static async deleteBusiness(id: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.data.session.user.id)
      .single();

    if (user?.role !== 'admin') {
      throw new Error('Only admins can delete businesses');
    }

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get business statistics for admin dashboard
   */
  static async getBusinessStats() {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.data.session.user.id)
      .single();

    if (user?.role !== 'admin') {
      throw new Error('Only admins can view business statistics');
    }

    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('category, city, country');

    if (error) throw error;

    const stats = {
      total: businesses?.length || 0,
      by_category: {} as Record<string, number>,
      by_city: {} as Record<string, number>,
      by_country: {} as Record<string, number>,
    };

    businesses?.forEach(business => {
      // Count by category
      stats.by_category[business.category] = (stats.by_category[business.category] || 0) + 1;
      
      // Count by city
      stats.by_city[business.city] = (stats.by_city[business.city] || 0) + 1;
      
      // Count by country
      stats.by_country[business.country] = (stats.by_country[business.country] || 0) + 1;
    });

    return stats;
  }
}
