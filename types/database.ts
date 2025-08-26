export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          obfuscated_handle: string | null
          lodge_id: string | null
          role: 'brother' | 'secretary' | 'admin'
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          obfuscated_handle?: string | null
          lodge_id?: string | null
          role?: 'brother' | 'secretary' | 'admin'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          obfuscated_handle?: string | null
          lodge_id?: string | null
          role?: 'brother' | 'secretary' | 'admin'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lodges: {
        Row: {
          id: string
          name: string
          number: string
          grand_lodge: string
          district: string
          address: string
          city: string
          country: string
          lat: number
          lng: number
          contact_email: string | null
          contact_phone: string | null
          created_by: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          number: string
          grand_lodge: string
          district: string
          address: string
          city: string
          country: string
          lat: number
          lng: number
          contact_email?: string | null
          contact_phone?: string | null
          created_by: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          number?: string
          grand_lodge?: string
          district?: string
          address?: string
          city?: string
          country?: string
          lat?: number
          lng?: number
          contact_email?: string | null
          contact_phone?: string | null
          created_by?: string
          updated_at?: string
        }
      }
      lodge_secretaries: {
        Row: {
          id: string
          lodge_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          lodge_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          lodge_id?: string
          user_id?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          lodge_id: string
          type: 'meeting' | 'charity'
          title: string
          description: string | null
          start_time: string
          end_time: string
          visibility: 'public' | 'members'
          status: 'pending' | 'approved' | 'rejected'
          created_by: string
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lodge_id: string
          type: 'meeting' | 'charity'
          title: string
          description?: string | null
          start_time: string
          end_time: string
          visibility?: 'public' | 'members'
          status?: 'pending' | 'approved' | 'rejected'
          created_by: string
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lodge_id?: string
          type?: 'meeting' | 'charity'
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          visibility?: 'public' | 'members'
          status?: 'pending' | 'approved' | 'rejected'
          created_by?: string
          approved_by?: string | null
          created_at?: string
        }
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'yes' | 'no' | 'maybe'
          checkin_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status: 'yes' | 'no' | 'maybe'
          checkin_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'yes' | 'no' | 'maybe'
          checkin_time?: string | null
          created_at?: string
        }
      }
      verifications: {
        Row: {
          id: string
          subject_user_id: string
          method: 'secretary' | 'vouch'
          lodge_id: string
          verifier_user_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          decided_at: string | null
        }
        Insert: {
          id?: string
          subject_user_id: string
          method: 'secretary' | 'vouch'
          lodge_id: string
          verifier_user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          decided_at?: string | null
        }
        Update: {
          id?: string
          subject_user_id?: string
          method?: 'secretary' | 'vouch'
          lodge_id?: string
          verifier_user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          decided_at?: string | null
        }
      }
      vouches: {
        Row: {
          id: string
          verification_id: string
          voucher_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          voucher_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          voucher_user_id?: string
          created_at?: string
        }
      }
      presence: {
        Row: {
          id: string
          user_id: string
          approx_lat: number
          approx_lng: number
          radius_km: number
          last_seen: string
        }
        Insert: {
          id?: string
          user_id: string
          approx_lat: number
          approx_lng: number
          radius_km?: number
          last_seen?: string
        }
        Update: {
          id?: string
          user_id?: string
          approx_lat?: number
          approx_lng?: number
          radius_km?: number
          last_seen?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          created_at?: string
        }
      }
      visit_confirmations: {
        Row: {
          id: string
          lodge_id: string
          user_id: string
          event_id: string | null
          confirmed_by: string
          confirmed_at: string
        }
        Insert: {
          id?: string
          lodge_id: string
          user_id: string
          event_id?: string | null
          confirmed_by: string
          confirmed_at?: string
        }
        Update: {
          id?: string
          lodge_id?: string
          user_id?: string
          event_id?: string | null
          confirmed_by?: string
          confirmed_at?: string
        }
      }
      charity_confirmations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          confirmed_by: string
          confirmed_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          confirmed_by: string
          confirmed_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          confirmed_by?: string
          confirmed_at?: string
        }
      }
      counters: {
        Row: {
          id: string
          user_id: string
          visits: number
          charity: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          visits?: number
          charity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          visits?: number
          charity?: number
          updated_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          code: string
          label: string
          kind: 'visit' | 'charity'
          threshold: number
          icon_url: string | null
        }
        Insert: {
          id?: string
          code: string
          label: string
          kind: 'visit' | 'charity'
          threshold: number
          icon_url?: string | null
        }
        Update: {
          id?: string
          code?: string
          label?: string
          kind?: 'visit' | 'charity'
          threshold?: number
          icon_url?: string | null
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          awarded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          awarded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          awarded_at?: string
        }
      }
      leaderboard_global: {
        Row: {
          user_id: string
          visits: number
          charity: number
          score: number
          rank: number
        }
        Insert: {
          user_id: string
          visits: number
          charity: number
          score: number
          rank: number
        }
        Update: {
          user_id?: string
          visits?: number
          charity?: number
          score?: number
          rank?: number
        }
      }
      leaderboard_by_gl: {
        Row: {
          grand_lodge: string
          user_id: string
          visits: number
          charity: number
          score: number
          rank: number
        }
        Insert: {
          grand_lodge: string
          user_id: string
          visits: number
          charity: number
          score: number
          rank: number
        }
        Update: {
          grand_lodge?: string
          user_id?: string
          visits?: number
          charity?: number
          score?: number
          rank?: number
        }
      }
      leaderboard_by_district: {
        Row: {
          district: string
          user_id: string
          visits: number
          charity: number
          score: number
          rank: number
        }
        Insert: {
          district: string
          user_id: string
          visits: number
          charity: number
          score: number
          rank: number
        }
        Update: {
          district?: string
          user_id?: string
          visits?: number
          charity?: number
          score?: number
          rank?: number
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          category: string
          city: string
          country: string
          lodge_proximity_km: number | null
          contact: string | null
          website: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          city: string
          country: string
          lodge_proximity_km?: number | null
          contact?: string | null
          website?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          city?: string
          country?: string
          lodge_proximity_km?: number | null
          contact?: string | null
          website?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
