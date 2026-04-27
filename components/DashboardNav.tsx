'use client';

import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Square,
  Map,
  Calendar,
  MessageCircle,
  User,
  Trophy,
  Store,
  Settings,
  LogOut,
  Shield,
  Users,
  ShieldAlert
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function DashboardNav() {
  const { user, signOut, isVerified, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const allNavItems = [
    { href: '/dashboard', icon: Map, label: 'Nearby', exact: true },
    { href: '/dashboard/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/dashboard/marketplace', icon: Store, label: 'Marketplace' },
    { href: '/dashboard/vouches', icon: Users, label: 'Vouches', requireVerified: true },
    { href: '/dashboard/secretary', icon: Shield, label: 'Secretary', requireRole: 'secretary' as const },
    { href: '/dashboard/admin', icon: ShieldAlert, label: 'Admin', requireRole: 'admin' as const },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.requireVerified && !isVerified) return false;
    if (item.requireRole && !hasRole(item.requireRole)) return false;
    return true;
  });

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Square className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Masonic Traveler</h1>
                {user && (
                  <p className="text-xs text-gray-500">
                    {user.first_name} • {user.lodge?.name || 'No Lodge'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard/profile"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <NotificationBell />
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with top padding */}
      <div className="pt-16">
        {/* Content goes here */}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-stretch py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-colors min-w-0 ${
                  active
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {navItems.length <= 6 && (
                  <span className={`text-[10px] mt-0.5 leading-tight truncate w-full text-center ${active ? 'font-medium' : ''}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
