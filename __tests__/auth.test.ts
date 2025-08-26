import { AuthService } from '@/lib/auth';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up user and create profile', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await AuthService.signUp('test@example.com', 'password123', 'John');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockUser);
    });

    it('should throw error if signup fails', async () => {
      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: new Error('Signup failed'),
      });

      await expect(
        AuthService.signUp('test@example.com', 'password123', 'John')
      ).rejects.toThrow('Signup failed');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockSession = { user: { id: 'user-123' } };
      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: mockSession,
        error: null,
      });

      const result = await AuthService.signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockSession);
    });

    it('should throw error if signin fails', async () => {
      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid credentials'),
      });

      await expect(
        AuthService.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signInWithMagicLink', () => {
    it('should send magic link successfully', async () => {
      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.signInWithOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await AuthService.signInWithMagicLink('test@example.com');

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user with profile data', async () => {
      const mockUser = {
        id: 'user-123',
        first_name: 'John',
        email: 'test@example.com',
        is_verified: true,
        role: 'brother',
        lodge: { name: 'Test Lodge' },
      };

      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });

      supabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no session', async () => {
      const { supabase } = require('@/lib/supabase');
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
