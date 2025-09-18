import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NearbyBrethrenMap } from '@/components/NearbyBrethrenMap';
import { PresenceService } from '@/lib/presence';

jest.mock('@/lib/presence');

const mockedPresence = PresenceService as jest.Mocked<typeof PresenceService>;

const location = { lat: 37.7749, lng: -122.4194 };

const createBrother = (overrides: Record<string, unknown> = {}) => ({
  id: 'brother-1',
  label: 'Brother from San Francisco Lodge',
  lodge_name: 'San Francisco Lodge',
  approx_circle: {
    center: [-122.4194, 37.7749] as [number, number],
    radius: 500,
  },
  distance_km: 2,
  ...overrides,
});

describe('NearbyBrethrenMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPresence.updatePresence.mockResolvedValue(undefined as any);
  });

  it('renders nearby brethren list after loading', async () => {
    mockedPresence.getNearbyBrethren.mockResolvedValue([createBrother()]);

    render(<NearbyBrethrenMap userLocation={location} />);

    await waitFor(() => {
      expect(screen.getByText('Nearby Brethren (1)')).toBeInTheDocument();
    });

    expect(screen.getByText('Brother from San Francisco Lodge')).toBeInTheDocument();
    expect(mockedPresence.updatePresence).toHaveBeenCalledWith(location);
  });

  it('shows error message when service fails', async () => {
    mockedPresence.getNearbyBrethren.mockRejectedValue(new Error('Only verified users can see nearby brethren'));

    render(<NearbyBrethrenMap userLocation={location} />);

    await waitFor(() => {
      expect(screen.getByText('Only verified users can see nearby brethren')).toBeInTheDocument();
    });
  });

  it('opens intro modal and sends intro request', async () => {
    const user = userEvent.setup();
    mockedPresence.getNearbyBrethren.mockResolvedValue([createBrother()]);
    mockedPresence.sendIntroRequest.mockResolvedValue({} as any);

    render(<NearbyBrethrenMap userLocation={location} />);

    await waitFor(() => {
      expect(screen.getByText('Brother from San Francisco Lodge')).toBeInTheDocument();
    });

    const messageButton = screen.getAllByRole('button').find((btn) => btn.textContent === '');
    expect(messageButton).toBeDefined();
    await user.click(messageButton!);
    expect(screen.getByRole('heading', { name: 'Send Greeting' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Send Greeting' }));
    expect(mockedPresence.sendIntroRequest).toHaveBeenCalledWith('brother-1');
  });
});
