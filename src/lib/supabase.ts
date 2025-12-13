import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key must be set in environment variables');
}

// Create a dummy client if env vars are missing (for development)
const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that won't work but won't crash
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
    },
    db: {
      schema: 'public',
    },
  });
};

export const supabase = createSupabaseClient();

// Database types (will be generated from Supabase schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      teams: {
        Row: {
          id: string;
          name: string;
          captain_id: string;
          logo_url: string | null;
          age_group: string;
          team_level: number;
          rating: number;
          wins: number;
          losses: number;
          draws: number;
          total_goals: number;
          total_mvps: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['teams']['Insert']>;
      };
      players: {
        Row: {
          id: string;
          profile_id: string;
          position: string | null;
          skill_level: number;
          age: number | null;
          height: number | null;
          weight: number | null;
          experience: string | null;
          city: string;
          availability_days: string[];
          preferred_time: string | null;
          bio: string | null;
          photo_url: string | null;
          matches_played: number;
          goals: number;
          assists: number;
          mvps: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          role: string; // 'captain' | 'member'
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          team_a_id: string;
          team_b_id: string;
          status: string; // 'pending' | 'confirmed' | 'completed' | 'cancelled'
          scheduled_date: string | null;
          scheduled_time: string | null;
          location: string | null;
          team_a_score: number | null;
          team_b_score: number | null;
          mvp_player_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      match_requests: {
        Row: {
          id: string;
          requester_team_id: string;
          requested_team_id: string;
          status: string; // 'pending' | 'accepted' | 'rejected' | 'cancelled'
          proposed_date: string | null;
          proposed_time: string | null;
          proposed_location: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['match_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['match_requests']['Insert']>;
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          organizer_id: string;
          organizer_type: string; // 'team' | 'individual'
          status: string; // 'pending_approval' | 'open' | 'filling' | 'in_progress' | 'completed' | 'cancelled'
          fee: number;
          prize: string;
          start_date: string;
          max_teams: number;
          current_teams: number;
          format: string; // '5v5', '7v7', etc.
          description: string | null;
          admin_approved: boolean;
          admin_approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tournaments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>;
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>;
      };
      tournament_registrations: {
        Row: {
          id: string;
          tournament_id: string;
          team_id: string | null;
          player_id: string | null;
          status: string; // 'pending' | 'approved' | 'rejected'
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tournament_registrations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tournament_registrations']['Insert']>;
      };
      player_invitations: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          invitation_type: string; // 'team' | 'match'
          match_id: string | null;
          match_fee: number | null;
          status: string; // 'pending' | 'accepted' | 'rejected'
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['player_invitations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['player_invitations']['Insert']>;
      };
      goal_scorers: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          team_id: string;
          goals: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['goal_scorers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['goal_scorers']['Insert']>;
      };
    };
  };
};

