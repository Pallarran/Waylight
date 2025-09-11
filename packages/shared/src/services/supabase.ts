import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://zclzhvkoqwelhfxahaly.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbHpodmtvcXdlbGhmeGFoYWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTAwMDMsImV4cCI6MjA3MzEyNjAwM30.UYjLv3TjT6e-Wv0JEbWTgCmF50vbBEIBduEMKeSVp5s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          start_date: string;
          end_date: string;
          notes: string | null;
          days: any; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          start_date: string;
          end_date: string;
          notes?: string | null;
          days?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          notes?: string | null;
          days?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          favorite_park_ids: string[];
          preferred_parking_time: number;
          include_child_friendly: boolean;
          include_thrill: boolean;
          include_shows_and_entertainment: boolean;
          accessibility_needs: any; // JSONB
          notification_settings: any; // JSONB
          display_settings: any; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          favorite_park_ids?: string[];
          preferred_parking_time?: number;
          include_child_friendly?: boolean;
          include_thrill?: boolean;
          include_shows_and_entertainment?: boolean;
          accessibility_needs?: any;
          notification_settings?: any;
          display_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          favorite_park_ids?: string[];
          preferred_parking_time?: number;
          include_child_friendly?: boolean;
          include_thrill?: boolean;
          include_shows_and_entertainment?: boolean;
          accessibility_needs?: any;
          notification_settings?: any;
          display_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Export typed client
export type SupabaseClient = typeof supabase;