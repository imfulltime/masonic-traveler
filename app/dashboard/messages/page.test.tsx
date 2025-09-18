import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessagesPage from '@/app/dashboard/messages/page';
import { useAuth } from '@/components/AuthProvider';
import { MessagingService } from '@/lib/messaging';

jest.mock('@/components/AuthProvider');
jest.mock('@/lib/messaging', () => ({
  MessagingService: {
    getConversations: jest.fn(),
    subscribeToConversations: jest.fn(),
    getConversationDisplayName: jest.fn(),
  },
}));

const mockedUseAuth = useAuth as unknown as jest.Mock<ReturnType<typeof useAuth>>;
const mockedMessaging = MessagingService as jest.Mocked<typeof MessagingService>;

const baseAuth = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => ({
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signInWithMagicLink: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  isVerified: false,
  hasRole: jest.fn().mockReturnValue(false),
  ...overrides,
});

const buildConversation = (id: string, lastMessage: string) => ({
  id,
  created_at: new Date().toISOString(),
  participants: [
    {
      id: 'user-1',
      first_name: 'Thomas',
      obfuscated_handle: 'TSF007',
      lodge: { name: 'San Francisco Lodge' },
    },
    {
      id: 'user-2',
      first_name: 'Robert',
      obfuscated_handle: 'RSF001',
      lodge: { name: 'Garden Lodge' },
    },
  ],
  last_message: {
    id: `message-${id}`,
    body: lastMessage,
    created_at: new Date().toISOString(),
    sender_id: 'user-2',
  },
});

describe('MessagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMessaging.subscribeToConversations.mockReturnValue({ unsubscribe: jest.fn() });
  });

  it('requires verification before showing conversations', () => {
    mockedUseAuth.mockReturnValue(
      baseAuth({
        user: { id: 'user-1' } as any,
        isVerified: false,
      })
    );

    render(<MessagesPage />);

    expect(screen.getByText('Verification Required')).toBeInTheDocument();
    expect(mockedMessaging.getConversations).not.toHaveBeenCalled();
  });

  it('renders conversations and filters by search query', async () => {
    mockedUseAuth.mockReturnValue(
      baseAuth({
        user: { id: 'user-1' } as any,
        isVerified: true,
      })
    );

    mockedMessaging.getConversations
      .mockResolvedValue([
        buildConversation('1', 'Hope to see you there'),
        buildConversation('2', 'Travel safely'),
      ]);

    mockedMessaging.getConversationDisplayName
      .mockImplementation((conversation) =>
        conversation.id === '1' ? 'Brother Alpha' : 'Brother Beta'
      );

    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByText('Brother Alpha')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Search conversations...'), 'beta');

    await waitFor(() => {
      expect(screen.queryByText('Brother Alpha')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Brother Beta')).toBeInTheDocument();
    expect(mockedMessaging.subscribeToConversations).toHaveBeenCalledWith('user-1', expect.any(Function));
  });

  it('renders error state when loading fails', async () => {
    mockedUseAuth.mockReturnValue(
      baseAuth({
        user: { id: 'user-1' } as any,
        isVerified: true,
      })
    );

    mockedMessaging.getConversations.mockRejectedValue(new Error('Failed to load conversations'));

    render(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });
});
