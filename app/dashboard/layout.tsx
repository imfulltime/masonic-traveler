'use client';

import { AuthProvider } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardNav } from '@/components/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute requireAuth requireVerified>
        <div className="min-h-screen bg-gray-50">
          <DashboardNav />
          <main className="pb-20">
            {children}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
