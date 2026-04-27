import { supabase } from '@/lib/supabase';

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export class NotificationsService {
  /**
   * Fetch unread notifications for the current user, newest first, limit 20
   */
  static async getUnread(): Promise<AppNotification[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.data.session.user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return (data as AppNotification[]) || [];
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all unread notifications as read for the current user
   */
  static async markAllAsRead(): Promise<void> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.data.session.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Insert a notification row for a given user
   */
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data: object = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data: data as unknown as import('@/types/database').Json,
      });

    if (error) {
      console.error('Failed to create notification:', error);
    }
  }
}
