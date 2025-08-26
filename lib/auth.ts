import { supabase } from './supabase';
import { User, UserRole } from '@/types';

export interface AuthUser extends User {
  role: UserRole;
}

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string, firstName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          first_name: firstName,
          role: 'brother',
          is_verified: false,
        });

      if (profileError) throw profileError;
    }

    return data;
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with magic link
   */
  static async signInWithMagicLink(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current session
   */
  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  }

  /**
   * Get current user with profile data
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession();
    if (!session?.user) return null;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        lodge:lodge_id (
          id,
          name,
          number,
          grand_lodge,
          district
        )
      `)
      .eq('id', session.user.id)
      .single();

    if (error) throw error;
    return user as AuthUser;
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: {
    first_name?: string;
    lodge_id?: string;
  }) {
    const session = await this.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if user has a specific role
   */
  static async hasRole(requiredRole: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      'brother': 1,
      'secretary': 2,
      'admin': 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user is verified
   */
  static async isVerified(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.is_verified || false;
  }

  /**
   * Check if user is secretary of a lodge
   */
  static async isSecretaryOfLodge(lodgeId: string): Promise<boolean> {
    const session = await this.getSession();
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', lodgeId)
      .eq('user_id', session.user.id)
      .single();

    return !error && !!data;
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }
}
