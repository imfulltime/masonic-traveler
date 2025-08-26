import { Database } from './database';

export type Tables = Database['public']['Tables'];
export type User = Tables['users']['Row'];
export type Lodge = Tables['lodges']['Row'];
export type Event = Tables['events']['Row'];
export type EventRSVP = Tables['event_rsvps']['Row'];
export type Verification = Tables['verifications']['Row'];
export type Vouch = Tables['vouches']['Row'];
export type Presence = Tables['presence']['Row'];
export type Conversation = Tables['conversations']['Row'];
export type Message = Tables['messages']['Row'];
export type VisitConfirmation = Tables['visit_confirmations']['Row'];
export type CharityConfirmation = Tables['charity_confirmations']['Row'];
export type Counter = Tables['counters']['Row'];
export type Badge = Tables['badges']['Row'];
export type UserBadge = Tables['user_badges']['Row'];
export type Business = Tables['businesses']['Row'];

export interface UserWithLodge extends User {
  lodge?: Lodge;
}

export interface EventWithLodge extends Event {
  lodge: Lodge;
  rsvp_count?: number;
  user_rsvp?: EventRSVP;
}

export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'first_name' | 'obfuscated_handle'>;
}

export interface ConversationWithParticipants extends Conversation {
  participants: User[];
  last_message?: Message;
}

export interface NearbyBrother {
  id: string;
  label: string;
  lodge_name?: string;
  approx_circle: {
    center: [number, number];
    radius: number;
  };
  distance_km?: number;
}

export interface LeaderboardEntry {
  user_id: string;
  visits: number;
  charity: number;
  score: number;
  rank: number;
  user_display?: string;
  lodge_name?: string;
}

export interface BadgeWithDetails extends Badge {
  is_earned?: boolean;
  progress?: number;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface FuzzedLocation extends LocationCoords {
  fuzz_radius_m: number;
}

export type UserRole = 'brother' | 'secretary' | 'admin';
export type EventType = 'meeting' | 'charity';
export type EventVisibility = 'public' | 'members';
export type EventStatus = 'pending' | 'approved' | 'rejected';
export type RSVPStatus = 'yes' | 'no' | 'maybe';
export type VerificationMethod = 'secretary' | 'vouch';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type BadgeKind = 'visit' | 'charity';
