'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerified?: boolean;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireVerified = false,
  requiredRole,
  fallbackPath = '/auth/login',
}: ProtectedRouteProps) {
  const { user, loading, isVerified, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check authentication
    if (requireAuth && !user) {
      router.push(fallbackPath);
      return;
    }

    // Check verification
    if (requireVerified && !isVerified) {
      router.push('/verification/required');
      return;
    }

    // Check role
    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, loading, isVerified, hasRole, requireAuth, requireVerified, requiredRole, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show children if all checks pass
  if (requireAuth && !user) return null;
  if (requireVerified && !isVerified) return null;
  if (requiredRole && !hasRole(requiredRole)) return null;

  return <>{children}</>;
}
