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
  Shield
} from 'lucide-react';

export function DashboardNav() {
  const { user, signOut, hasRole } = useAuth();
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

  const navItems = [
    { href: '/dashboard', icon: Map, label: 'Nearby', exact: true },
    { href: '/dashboard/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { href: '/dashboard/marketplace', icon: Store, label: 'Marketplace' },
  ];

  if (hasRole('secretary')) {
    navItems.push({ href: '/dashboard/secretary', icon: Shield, label: 'Secretary' });
  }

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
        <div className="grid grid-cols-5 gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  active
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary-600' : ''}`} />
                <span className={`text-xs mt-1 ${active ? 'text-primary-600 font-medium' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
