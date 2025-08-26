import { supabase } from './supabase';
import { Verification, VerificationStatus } from '@/types';

export class VerificationService {
  /**
   * Request verification by secretary
   */
  static async requestSecretaryVerification(lodgeId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Check if user already has a pending or approved verification
    const { data: existingVerification } = await supabase
      .from('verifications')
      .select('id, status')
      .eq('subject_user_id', userId)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingVerification) {
      if (existingVerification.status === 'approved') {
        throw new Error('You are already verified');
      }
      throw new Error('You already have a pending verification request');
    }

    // Get a secretary from the lodge to handle the verification
    const { data: lodgeSecretary } = await supabase
      .from('lodge_secretaries')
      .select('user_id')
      .eq('lodge_id', lodgeId)
      .limit(1)
      .single();

    if (!lodgeSecretary) {
      throw new Error('No secretary found for this lodge');
    }

    // Create verification request
    const { data: verification, error } = await supabase
      .from('verifications')
      .insert({
        subject_user_id: userId,
        method: 'secretary',
        lodge_id: lodgeId,
        verifier_user_id: lodgeSecretary.user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's lodge association
    await supabase
      .from('users')
      .update({ lodge_id: lodgeId })
      .eq('id', userId);

    return verification;
  }

  /**
   * Request verification by vouching (requires at least 1 verified voucher)
   */
  static async requestVouchVerification(lodgeId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Check if user already has a pending or approved verification
    const { data: existingVerification } = await supabase
      .from('verifications')
      .select('id, status')
      .eq('subject_user_id', userId)
      .in('status', ['pending', 'approved'])
      .single();

    if (existingVerification) {
      if (existingVerification.status === 'approved') {
        throw new Error('You are already verified');
      }
      throw new Error('You already have a pending verification request');
    }

    // Get a secretary from the lodge to handle the verification
    const { data: lodgeSecretary } = await supabase
      .from('lodge_secretaries')
      .select('user_id')
      .eq('lodge_id', lodgeId)
      .limit(1)
      .single();

    if (!lodgeSecretary) {
      throw new Error('No secretary found for this lodge');
    }

    // Create verification request
    const { data: verification, error } = await supabase
      .from('verifications')
      .insert({
        subject_user_id: userId,
        method: 'vouch',
        lodge_id: lodgeId,
        verifier_user_id: lodgeSecretary.user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's lodge association
    await supabase
      .from('users')
      .update({ lodge_id: lodgeId })
      .eq('id', userId);

    return verification;
  }

  /**
   * Vouch for another user (verified users only)
   */
  static async vouchForUser(verificationId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Check if current user is verified
    const { data: currentUser } = await supabase
      .from('users')
      .select('is_verified')
      .eq('id', userId)
      .single();

    if (!currentUser?.is_verified) {
      throw new Error('Only verified users can vouch for others');
    }

    // Check if verification exists and is pending
    const { data: verification } = await supabase
      .from('verifications')
      .select('id, method, status, subject_user_id')
      .eq('id', verificationId)
      .single();

    if (!verification) {
      throw new Error('Verification request not found');
    }

    if (verification.status !== 'pending') {
      throw new Error('This verification request is no longer pending');
    }

    if (verification.method !== 'vouch') {
      throw new Error('This verification request does not accept vouches');
    }

    if (verification.subject_user_id === userId) {
      throw new Error('You cannot vouch for yourself');
    }

    // Check if user has already vouched
    const { data: existingVouch } = await supabase
      .from('vouches')
      .select('id')
      .eq('verification_id', verificationId)
      .eq('voucher_user_id', userId)
      .single();

    if (existingVouch) {
      throw new Error('You have already vouched for this user');
    }

    // Add vouch
    const { data: vouch, error } = await supabase
      .from('vouches')
      .insert({
        verification_id: verificationId,
        voucher_user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return vouch;
  }

  /**
   * Approve verification (secretary only)
   */
  static async approveVerification(verificationId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Get verification details
    const { data: verification } = await supabase
      .from('verifications')
      .select(`
        id,
        subject_user_id,
        method,
        lodge_id,
        verifier_user_id,
        status,
        vouches:vouches (id)
      `)
      .eq('id', verificationId)
      .single();

    if (!verification) {
      throw new Error('Verification request not found');
    }

    if (verification.status !== 'pending') {
      throw new Error('This verification request is no longer pending');
    }

    // Check if current user is the designated verifier or a secretary of the lodge
    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', verification.lodge_id)
      .eq('user_id', userId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can approve verifications');
    }

    // For vouch method, check if there's at least one vouch
    if (verification.method === 'vouch' && verification.vouches.length === 0) {
      throw new Error('At least one verified vouch is required');
    }

    // Approve verification
    const { error: verificationError } = await supabase
      .from('verifications')
      .update({
        status: 'approved',
        decided_at: new Date().toISOString(),
      })
      .eq('id', verificationId);

    if (verificationError) throw verificationError;

    // Update user verification status
    const { error: userError } = await supabase
      .from('users')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', verification.subject_user_id);

    if (userError) throw userError;

    // Initialize user counters
    await supabase
      .from('counters')
      .upsert({
        user_id: verification.subject_user_id,
        visits: 0,
        charity: 0,
      }, {
        onConflict: 'user_id'
      });

    return verification;
  }

  /**
   * Reject verification (secretary only)
   */
  static async rejectVerification(verificationId: string, reason?: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Get verification details
    const { data: verification } = await supabase
      .from('verifications')
      .select('lodge_id, status')
      .eq('id', verificationId)
      .single();

    if (!verification) {
      throw new Error('Verification request not found');
    }

    if (verification.status !== 'pending') {
      throw new Error('This verification request is no longer pending');
    }

    // Check if current user is a secretary of the lodge
    const { data: isSecretary } = await supabase
      .from('lodge_secretaries')
      .select('id')
      .eq('lodge_id', verification.lodge_id)
      .eq('user_id', userId)
      .single();

    if (!isSecretary) {
      throw new Error('Only lodge secretaries can reject verifications');
    }

    // Reject verification
    const { error } = await supabase
      .from('verifications')
      .update({
        status: 'rejected',
        decided_at: new Date().toISOString(),
      })
      .eq('id', verificationId);

    if (error) throw error;
    return verification;
  }

  /**
   * Get pending verifications for secretary review
   */
  static async getPendingVerifications() {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const userId = session.data.session.user.id;

    // Get lodges where user is secretary
    const { data: secretaryLodges } = await supabase
      .from('lodge_secretaries')
      .select('lodge_id')
      .eq('user_id', userId);

    if (!secretaryLodges || secretaryLodges.length === 0) {
      return [];
    }

    const lodgeIds = secretaryLodges.map(l => l.lodge_id);

    // Get pending verifications for these lodges
    const { data: verifications, error } = await supabase
      .from('verifications')
      .select(`
        id,
        method,
        created_at,
        subject_user:subject_user_id (
          id,
          first_name,
          email
        ),
        lodge:lodge_id (
          id,
          name,
          number
        ),
        vouches:vouches (
          id,
          voucher:voucher_user_id (
            id,
            first_name,
            lodge:lodge_id (name)
          )
        )
      `)
      .eq('status', 'pending')
      .in('lodge_id', lodgeIds)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return verifications || [];
  }

  /**
   * Get user's verification history
   */
  static async getUserVerifications(userId?: string) {
    const session = await supabase.auth.getSession();
    const targetUserId = userId || session.data.session?.user?.id;

    if (!targetUserId) throw new Error('Not authenticated');

    const { data: verifications, error } = await supabase
      .from('verifications')
      .select(`
        id,
        method,
        status,
        created_at,
        decided_at,
        lodge:lodge_id (
          name,
          number
        ),
        verifier:verifier_user_id (
          first_name
        )
      `)
      .eq('subject_user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return verifications || [];
  }

  /**
   * Search lodges for verification request
   */
  static async searchLodges(query: string) {
    let lodgeQuery = supabase
      .from('lodges')
      .select('id, name, number, grand_lodge, district, city, country')
      .or(`name.ilike.%${query}%, city.ilike.%${query}%, grand_lodge.ilike.%${query}%`)
      .limit(20);

    const { data: lodges, error } = await lodgeQuery;

    if (error) throw error;
    return lodges || [];
  }
}
