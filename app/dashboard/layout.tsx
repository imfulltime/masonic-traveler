'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardNav } from '@/components/DashboardNav';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireAuth requireVerified>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="pb-20">
          {children}
        </main>
        <PWAInstallPrompt />
      </div>
    </ProtectedRoute>
  );
}
