'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessagingService } from '@/lib/messaging';
import { useAuth } from '@/components/AuthProvider';
import { MessageWithSender } from '@/types';
import { formatTime } from '@/lib/utils';
import { ArrowLeft, Send, Users } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.id as string;
  
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversation();
    
    // Subscribe to new messages
    const subscription = MessagingService.subscribeToMessages(
      conversationId,
      (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const [messagesData, participantsData] = await Promise.all([
        MessagingService.getMessages(conversationId),
        MessagingService.getConversationParticipants(conversationId),
      ]);
      
      setMessages(messagesData);
      setParticipants(participantsData);
    } catch (err: any) {
      setError(err.message || 'Error loading conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      const message = await MessagingService.sendMessage(conversationId, newMessage);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (err: any) {
      alert(err.message || 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = () => {
    const otherParticipant = participants.find(p => p.id !== user?.id);
    
    if (!otherParticipant) return 'Conversation';
    
    if (otherParticipant.first_name && otherParticipant.lodge?.name) {
      return `${otherParticipant.first_name} from ${otherParticipant.lodge.name}`;
    }
    
    if (otherParticipant.lodge?.name) {
      return `Brother from ${otherParticipant.lodge.name}`;
    }
    
    return otherParticipant.obfuscated_handle || 'Anonymous Brother';
  };

  const isOwnMessage = (message: MessageWithSender) => {
    return message.sender_id === user?.id;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading conversation...</p>
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
            onClick={() => router.back()}
            className="mt-2 btn-secondary text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          
          <div>
            <h1 className="font-semibold text-gray-900">{getConversationTitle()}</h1>
            <p className="text-xs text-gray-500">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showAvatar = index === 0 || 
              messages[index - 1].sender_id !== message.sender_id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                  {showAvatar && !isOwn && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {message.sender.first_name?.charAt(0) || 'B'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {message.sender.first_name || message.sender.obfuscated_handle}
                      </span>
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                  </div>
                  
                  <p className={`text-xs text-gray-500 mt-1 ${
                    isOwn ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary px-4"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
