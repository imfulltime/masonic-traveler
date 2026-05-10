import { supabase } from './supabase';
import { ConversationWithParticipants, MessageWithSender } from '@/types';

export class MessagingService {
  /**
   * Get all conversations for the current user
   */
  static async getConversations(): Promise<ConversationWithParticipants[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        participants:conversation_participants (
          user:user_id (
            id,
            first_name,
            obfuscated_handle,
            lodge:lodge_id (name)
          )
        )
      `)
      .eq('conversation_participants.user_id', session.data.session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const conversationList = conversations || [];

    if (conversationList.length === 0) return [];

    // Batch-fetch the last message for all conversations in a single query
    const conversationIds = conversationList.map((c) => c.id);

    const { data: allMessages } = await supabase
      .from('messages')
      .select(`
        id,
        body,
        created_at,
        conversation_id,
        sender_id,
        sender:sender_id (
          id,
          first_name,
          obfuscated_handle
        )
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    // Map: keep only the first (most-recent) message per conversation
    const lastMessageByConversation = new Map<string, typeof allMessages extends (infer T)[] | null ? T : never>();
    for (const msg of allMessages || []) {
      if (!lastMessageByConversation.has(msg.conversation_id)) {
        lastMessageByConversation.set(msg.conversation_id, msg);
      }
    }

    const conversationsWithMessages = conversationList.map((conversation) => ({
      ...conversation,
      last_message: lastMessageByConversation.get(conversation.id) || undefined,
    }));

    return conversationsWithMessages as unknown as ConversationWithParticipants[];
  }

  /**
   * Create or retrieve an existing 1-on-1 conversation with another user
   */
  static async createConversation(targetUserId: string): Promise<string> {
    const { data, error } = await supabase.rpc('create_or_get_conversation', {
      target_user_id: targetUserId,
    });

    if (error) throw error;
    return data as string;
  }

  /**
   * Get messages for a specific conversation
   */
  static async getMessages(conversationId: string): Promise<MessageWithSender[]> {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Verify user is part of this conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.data.session.user.id)
      .single();

    if (!participant) throw new Error('Access denied to this conversation');

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        body,
        created_at,
        sender_id,
        sender:sender_id (
          id,
          first_name,
          obfuscated_handle
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return messages as MessageWithSender[];
  }

  /**
   * Send a message to a conversation
   */
  static async sendMessage(conversationId: string, body: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Verify user is part of this conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.data.session.user.id)
      .single();

    if (!participant) throw new Error('Access denied to this conversation');

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: session.data.session.user.id,
        body: body.trim(),
      })
      .select(`
        id,
        body,
        created_at,
        sender_id,
        sender:sender_id (
          id,
          first_name,
          obfuscated_handle
        )
      `)
      .single();

    if (error) throw error;
    return message as MessageWithSender;
  }

  /**
   * Get conversation participants with display information
   */
  static async getConversationParticipants(conversationId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) throw new Error('Not authenticated');

    // Verify user is part of this conversation
    const { data: userParticipant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.data.session.user.id)
      .single();

    if (!userParticipant) throw new Error('Access denied to this conversation');

    const { data: participants, error } = await supabase
      .from('conversation_participants')
      .select(`
        user:user_id (
          id,
          first_name,
          obfuscated_handle,
          lodge:lodge_id (name)
        )
      `)
      .eq('conversation_id', conversationId);

    if (error) throw error;

    return participants?.map(p => p.user) || [];
  }

  /**
   * Subscribe to new messages in a conversation.
   * Uses the raw realtime payload as the primary source of truth and
   * tries to enrich it with sender details — but always fires the
   * callback even if the enrichment query fails (RLS edge cases on
   * the users join previously caused silent drops).
   *
   * Returns the channel so callers can pass it to supabase.removeChannel().
   */
  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: MessageWithSender) => void
  ) {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const raw = payload.new as {
            id: string;
            body: string;
            created_at: string;
            sender_id: string;
            conversation_id: string;
          };

          // Best-effort sender enrichment — fall back to raw payload
          // if it fails (RLS, network, etc.) so the message still shows.
          let sender: MessageWithSender['sender'] = {
            id: raw.sender_id,
            first_name: null,
            obfuscated_handle: null,
          } as MessageWithSender['sender'];

          try {
            const { data } = await supabase
              .from('users')
              .select('id, first_name, obfuscated_handle')
              .eq('id', raw.sender_id)
              .maybeSingle();
            if (data) sender = data as MessageWithSender['sender'];
          } catch {
            /* enrichment failed — use the fallback above */
          }

          onMessage({
            id: raw.id,
            body: raw.body,
            created_at: raw.created_at,
            sender_id: raw.sender_id,
            sender,
          } as MessageWithSender);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to conversation updates (for conversation list)
   * Fires when ANY new message is sent — the page handler should
   * decide whether to refetch (cheap query) or filter client-side.
   */
  static subscribeToConversations(
    userId: string,
    onUpdate: () => void
  ) {
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();
  }

  /**
   * Mark conversation as read (for future read receipts)
   */
  static async markAsRead(conversationId: string) {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) return;

    // This could be implemented with a read_receipts table in the future
    // For now, we'll just track the last seen timestamp
    console.log('Mark as read:', conversationId);
  }

  /**
   * Get display name for conversation partner
   */
  static getConversationDisplayName(
    conversation: ConversationWithParticipants,
    currentUserId: string
  ): string {
    const otherParticipant = conversation.participants.find(
      (p: any) => p.id !== currentUserId
    );

    if (!otherParticipant) return 'Unknown Brother';

    // If we have a first name and lodge, show both
    if (otherParticipant.first_name && (otherParticipant as any).lodge?.name) {
      return `${otherParticipant.first_name} from ${(otherParticipant as any).lodge.name}`;
    }

    // If we have just a lodge, show generic label
    if ((otherParticipant as any).lodge?.name) {
      return `Brother from ${(otherParticipant as any).lodge.name}`;
    }

    // Fall back to obfuscated handle
    return otherParticipant.obfuscated_handle || 'Anonymous Brother';
  }
}
