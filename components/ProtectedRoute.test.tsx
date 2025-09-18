import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

type AuthMock = ReturnType<typeof useAuth>;

jest.mock('@/components/AuthProvider');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockedUseAuth = useAuth as unknown as jest.Mock<AuthMock>;
const mockedUseRouter = useRouter as unknown as jest.Mock;

const createAuthValue = (overrides: Partial<AuthMock> = {}): AuthMock => ({
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithMagicLink: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  isVerified: false,
  hasRole: jest.fn().mockReturnValue(false),
  ...overrides,
});

describe('ProtectedRoute', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ push: pushMock });
  });

  it('redirects unauthenticated users to the login page by default', async () => {
    mockedUseAuth.mockReturnValue(createAuthValue());

    render(
      <ProtectedRoute>
        <div>Secure</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('renders children when the user is verified', () => {
    mockedUseAuth.mockReturnValue(
      createAuthValue({
        user: { id: 'user-1' } as any,
        isVerified: true,
        hasRole: jest.fn().mockReturnValue(true),
      })
    );

    render(
      <ProtectedRoute requireVerified>
        <div>Dashboard Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('redirects to verification page when user lacks verification', async () => {
    mockedUseAuth.mockReturnValue(
      createAuthValue({
        user: { id: 'user-1' } as any,
        isVerified: false,
      })
    );

    render(
      <ProtectedRoute requireVerified>
        <div>Should not render</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/verification/required');
    });
  });

  it('redirects to unauthorized page when required role is missing', async () => {
    mockedUseAuth.mockReturnValue(
      createAuthValue({
        user: { id: 'user-1', role: 'brother' } as any,
        isVerified: true,
        hasRole: jest.fn().mockImplementation((role: string) => role === 'brother'),
      })
    );

    render(
      <ProtectedRoute requiredRole="secretary">
        <div>Secretary tools</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/unauthorized');
    });
  });
});
