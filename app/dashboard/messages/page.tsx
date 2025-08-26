'use client';

import { useState, useEffect } from 'react';
import { MessagingService } from '@/lib/messaging';
import { useAuth } from '@/components/AuthProvider';
import { ConversationWithParticipants } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { MessageCircle, Search, Users } from 'lucide-react';

export default function MessagesPage() {
  const { user, isVerified } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isVerified) {
      loadConversations();
      
      // Subscribe to conversation updates
      const subscription = MessagingService.subscribeToConversations(
        user?.id || '',
        loadConversations
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isVerified, user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await MessagingService.getConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err.message || 'Error loading conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const displayName = MessagingService.getConversationDisplayName(
      conversation,
      user?.id || ''
    );
    
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.last_message?.body.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(dateString);
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return formatDate(dateString);
    }
  };

  if (!isVerified) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <MessageCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Verification Required
          </h2>
          <p className="text-yellow-700">
            You need to be verified to send and receive messages with other brethren.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadConversations}
            className="mt-2 btn-secondary text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Chat with your fraternal connections</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {conversations.length === 0 ? 'No conversations yet' : 'No matching conversations'}
          </h3>
          <p>
            {conversations.length === 0
              ? 'Send a greeting to nearby brethren to start a conversation'
              : 'Try a different search term'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const displayName = MessagingService.getConversationDisplayName(
              conversation,
              user?.id || ''
            );

            return (
              <div
                key={conversation.id}
                className="card hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  // Navigate to conversation detail
                  window.location.href = `/dashboard/messages/${conversation.id}`;
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {displayName}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {conversation.last_message ? (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                        {conversation.last_message.body}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No messages yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      {conversations.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to start a conversation</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Go to the "Nearby" tab to see brethren in your area</li>
            <li>2. Tap the message button next to a brother's name</li>
            <li>3. Send a greeting to introduce yourself</li>
            <li>4. Once accepted, you can chat freely</li>
          </ol>
        </div>
      )}
    </div>
  );
}
