'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, AuthUser } from '@/lib/auth';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { first_name?: string; lodge_id?: string }) => Promise<void>;
  isVerified: boolean;
  hasRole: (role: 'brother' | 'secretary' | 'admin') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadUserAttempts, setLoadUserAttempts] = useState(0);
  const MAX_LOAD_ATTEMPTS = 3;

  useEffect(() => {
    // Get initial session
    AuthService.getSession().then((session) => {
      setSession(session);
      if (session?.user) {
        loadUser();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          await loadUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    // Prevent infinite retry loops
    if (loadUserAttempts >= MAX_LOAD_ATTEMPTS) {
      console.warn('Max load user attempts reached, stopping retries');
      setLoading(false);
      return;
    }

    try {
      console.log(`Loading user data... (attempt ${loadUserAttempts + 1}/${MAX_LOAD_ATTEMPTS})`);
      setLoadUserAttempts(prev => prev + 1);
      
      const userData = await AuthService.getCurrentUser();
      console.log('User data loaded:', userData);
      setUser(userData);
      
      // Reset attempts on success
      setLoadUserAttempts(0);
    } catch (error) {
      console.error('Error loading user:', error);
      // Don't retry on infinite recursion or policy errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = error.message as string;
        if (errorMessage.includes('infinite recursion') || errorMessage.includes('policy')) {
          console.warn('Policy error detected, stopping retries. User will need to refresh after DB fix.');
          setLoadUserAttempts(MAX_LOAD_ATTEMPTS); // Stop further attempts
        }
      }
      setUser(null);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
      // Don't setLoading(false) here - let the auth state change handle it
      // This ensures the user state is fully loaded before loading becomes false
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, firstName);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithMagicLink = async (email: string) => {
    await AuthService.signInWithMagicLink(email);
  };

  const signOut = async () => {
    await AuthService.signOut();
  };

  const updateProfile = async (updates: { first_name?: string; lodge_id?: string }) => {
    try {
      await AuthService.updateProfile(updates);
      await loadUser(); // Reload user data
    } catch (error) {
      throw error;
    }
  };

  const isVerified = user?.is_verified || false;

  const hasRole = (role: 'brother' | 'secretary' | 'admin') => {
    if (!user) return false;
    
    const roleHierarchy = {
      'brother': 1,
      'secretary': 2,
      'admin': 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[role];
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    updateProfile,
    isVerified,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
