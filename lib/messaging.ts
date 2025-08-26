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

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conversation) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            id,
            body,
            created_at,
            sender:sender_id (
              id,
              first_name,
              obfuscated_handle
            )
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conversation,
          last_message: lastMessage || undefined,
        };
      })
    );

    return conversationsWithMessages;
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
   * Subscribe to new messages in a conversation
   */
  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: MessageWithSender) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: message } = await supabase
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
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onMessage(message as MessageWithSender);
          }
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to conversation updates (for conversation list)
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
          event: '*',
          schema: 'public',
          table: 'messages',
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
    if (otherParticipant.first_name && otherParticipant.lodge?.name) {
      return `${otherParticipant.first_name} from ${otherParticipant.lodge.name}`;
    }

    // If we have just a lodge, show generic label
    if (otherParticipant.lodge?.name) {
      return `Brother from ${otherParticipant.lodge.name}`;
    }

    // Fall back to obfuscated handle
    return otherParticipant.obfuscated_handle || 'Anonymous Brother';
  }
}
