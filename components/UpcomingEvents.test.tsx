import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpcomingEvents } from '@/components/UpcomingEvents';
import { EventsService } from '@/lib/events';

type EventWithDistance = Awaited<ReturnType<typeof EventsService.getUpcomingEvents>>[number] & {
  distance_km: number;
};

jest.mock('@/lib/events');

const mockedEvents = EventsService as jest.Mocked<typeof EventsService>;

const baseEvent = (overrides: Partial<EventWithDistance> = {}): EventWithDistance => ({
  id: 'event-1',
  lodge_id: 'lodge-1',
  type: 'meeting',
  title: 'Stated Meeting',
  description: 'Monthly stated communication',
  start_time: new Date('2024-01-01T19:00:00Z').toISOString(),
  end_time: new Date('2024-01-01T21:00:00Z').toISOString(),
  visibility: 'public',
  status: 'approved',
  created_at: new Date().toISOString(),
  created_by: 'user-1',
  approved_by: null,
  lodge: {
    id: 'lodge-1',
    name: 'San Francisco Lodge',
    number: '3',
    grand_lodge: 'California',
    district: 'District 1',
    address: '1111 California St',
    city: 'San Francisco',
    country: 'USA',
    lat: 37.7749,
    lng: -122.4194,
    contact_email: null,
    contact_phone: null,
    created_by: 'user-1',
    updated_at: new Date().toISOString(),
  },
  rsvp_count: 0,
  user_rsvp: undefined,
  distance_km: 5,
  ...overrides,
});

describe('UpcomingEvents', () => {
  const location = { lat: 37.7749, lng: -122.4194 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedEvents.rsvpToEvent.mockResolvedValue({} as any);
    mockedEvents.checkInToEvent.mockResolvedValue({} as any);
  });

  it('renders upcoming events and handles RSVP updates', async () => {
    mockedEvents.getUpcomingEvents.mockResolvedValue([baseEvent()]);

    render(<UpcomingEvents userLocation={location} />);

    await waitFor(() => {
      expect(screen.getByText('Stated Meeting')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByTitle('Going'));

    expect(mockedEvents.rsvpToEvent).toHaveBeenCalledWith('event-1', 'yes');
    await waitFor(() => {
      expect(screen.getByText('1 attending')).toBeInTheDocument();
    });
  });

  it('shows error message when event loading fails', async () => {
    mockedEvents.getUpcomingEvents.mockRejectedValue(new Error('Unable to load events'));

    render(<UpcomingEvents userLocation={location} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load events')).toBeInTheDocument();
    });
  });
});
