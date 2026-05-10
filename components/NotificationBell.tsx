'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessageCircle, Shield, CheckCircle, Heart, Calendar } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { NotificationsService, AppNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Pick an icon + colour based on notification type
function notificationIcon(type: string) {
  switch (type) {
    case 'new_message':
      return { Icon: MessageCircle, bg: 'bg-primary-100', fg: 'text-primary-700' };
    case 'verification_approved':
    case 'check_in_confirmed':
      return { Icon: CheckCircle, bg: 'bg-emerald-100', fg: 'text-emerald-700' };
    case 'charity_confirmed':
      return { Icon: Heart, bg: 'bg-pink-100', fg: 'text-pink-700' };
    case 'event_approved':
      return { Icon: Calendar, bg: 'bg-gold-100', fg: 'text-gold-700' };
    default:
      return { Icon: Shield, bg: 'bg-ink-100', fg: 'text-ink-700' };
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    const data = await NotificationsService.getUnread();
    setNotifications(data);
  }, [user]);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchUnread();

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications((prev) => [newNotif, ...prev]);

          // Show a quick toast for the new notification
          setToast(newNotif);
          // Auto-dismiss after 5s
          window.setTimeout(() => {
            setToast((current) => (current?.id === newNotif.id ? null : current));
          }, 5000);
        }
      )
      .subscribe();

    // Fallback poll every 5 minutes in case Realtime disconnects
    const fallbackInterval = setInterval(fetchUnread, 5 * 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [user, fetchUnread]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Click handler — mark as read AND navigate based on type/data
  const handleNotificationClick = async (n: AppNotification) => {
    await NotificationsService.markAsRead(n.id);
    setNotifications((prev) => prev.filter((item) => item.id !== n.id));
    setOpen(false);

    const data = (n.data || {}) as Record<string, any>;
    if (n.type === 'new_message' && data.conversation_id) {
      router.push(`/dashboard/messages/${data.conversation_id}`);
    } else if (n.type === 'event_approved' && data.event_id) {
      router.push(`/dashboard/events/${data.event_id}`);
    } else if (n.type === 'verification_approved') {
      router.push('/dashboard');
    }
  };

  const handleToastClick = async () => {
    if (!toast) return;
    const t = toast;
    setToast(null);
    await handleNotificationClick(t);
  };

  const handleMarkAllAsRead = async () => {
    await NotificationsService.markAllAsRead();
    setNotifications([]);
  };

  const unreadCount = notifications.length;

  return (
    <>
      {/* ─── Toast (slides in top-right when new notification arrives) ─── */}
      {toast && (
        <div
          onClick={handleToastClick}
          className="fixed top-20 right-4 z-[60] w-80 max-w-[calc(100vw-2rem)] bg-white border border-ink-200 rounded-xl shadow-luxe-lg p-3 cursor-pointer animate-slide-up hover:shadow-gold-glow transition-shadow"
          role="alert"
        >
          <div className="flex items-start gap-3">
            {(() => {
              const { Icon, bg, fg } = notificationIcon(toast.type);
              return (
                <div className={`w-9 h-9 rounded-lg ${bg} ${fg} flex items-center justify-center shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
              );
            })()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">{toast.title}</p>
              {toast.body && (
                <p className="text-xs text-ink-600 mt-0.5 line-clamp-2">{toast.body}</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              className="text-ink-400 hover:text-ink-600 text-xs shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Bell + Dropdown ──────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-ink-900 leading-none shadow-gold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-ink-100 rounded-xl shadow-luxe-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-50">
              <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-gold-700 hover:text-gold-800 tracking-luxe"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-ink-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-ink-400">
                  <Bell className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const { Icon, bg, fg } = notificationIcon(n.type);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full text-left px-4 py-3 hover:bg-ivory-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg ${bg} ${fg} flex items-center justify-center shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-ink-900 truncate">{n.title}</p>
                            <span className="text-[10px] text-ink-400 whitespace-nowrap mt-0.5 shrink-0">
                              {relativeTime(n.created_at)}
                            </span>
                          </div>
                          {n.body && (
                            <p className="text-xs text-ink-600 mt-0.5 line-clamp-2">{n.body}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
