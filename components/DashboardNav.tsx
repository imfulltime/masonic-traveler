'use client';

import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
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
  ShieldAlert,
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
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ─── Top header ─────────────────────────────────── */}
      <header className="bg-navy-gradient fixed top-0 left-0 right-0 z-50 shadow-luxe">
        {/* Gold hairline accent at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gold-gradient opacity-60" />

        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="monogram">MT</span>
              <div>
                <h1 className="text-base font-serif font-bold text-white leading-tight">
                  Masonic Traveler
                </h1>
                {user && (
                  <p className="text-[11px] text-gold-400/80 tracking-luxe">
                    {user.first_name}
                    {user.lodge?.name && ` · ${user.lodge.name}`}
                  </p>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/profile"
                className="p-2 text-white/70 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="p-2 text-white/70 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <div className="text-white/70 hover:text-gold-400">
                <NotificationBell />
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-white/70 hover:text-gold-400 hover:bg-white/5 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer so content isn't hidden behind fixed header */}
      <div className="h-16" />

      {/* ─── Bottom navigation ──────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-ink-100 shadow-[0_-4px_20px_-4px_rgba(26,31,44,0.08)]">
        {/* Gold hairline at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gold-gradient opacity-50" />

        <div className="flex items-stretch py-1.5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 min-w-0 group transition-colors"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold-gradient rounded-full" />
                )}
                <Icon
                  className={`h-5 w-5 shrink-0 transition-colors ${
                    active
                      ? 'text-primary-800'
                      : 'text-ink-400 group-hover:text-ink-700'
                  }`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {navItems.length <= 6 && (
                  <span
                    className={`text-[10px] mt-0.5 leading-tight truncate w-full text-center tracking-luxe transition-colors ${
                      active
                        ? 'font-semibold text-primary-800'
                        : 'text-ink-500 group-hover:text-ink-700'
                    }`}
                  >
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
