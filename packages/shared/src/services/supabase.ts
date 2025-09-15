import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zclzhvkoqwelhfxahaly.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbHpodmtvcXdlbGhmeGFoYWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTAwMDMsImV4cCI6MjA3MzEyNjAwM30.UYjLv3TjT6e-Wv0JEbWTgCmF50vbBEIBduEMKeSVp5s';

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
          accommodation: any | null; // JSONB for AccommodationDetails
          traveling_party: any | null; // JSONB for TravelingPartyMember[]
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
          accommodation?: any | null;
          traveling_party?: any | null;
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
          accommodation?: any | null;
          traveling_party?: any | null;
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
      // Live Data Tables
      live_parks: {
        Row: {
          id: string;
          park_id: string; // Our internal park ID
          external_id: string; // ThemeParks.wiki ID
          name: string;
          status: 'operating' | 'closed' | 'limited';
          regular_open: string;
          regular_close: string;
          early_entry_open: string | null;
          extended_evening_close: string | null;
          crowd_level: number | null; // 1-10 scale
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          park_id: string;
          external_id: string;
          name: string;
          status: 'operating' | 'closed' | 'limited';
          regular_open: string;
          regular_close: string;
          early_entry_open?: string | null;
          extended_evening_close?: string | null;
          crowd_level?: number | null;
          last_updated: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          park_id?: string;
          external_id?: string;
          name?: string;
          status?: 'operating' | 'closed' | 'limited';
          regular_open?: string;
          regular_close?: string;
          early_entry_open?: string | null;
          extended_evening_close?: string | null;
          crowd_level?: number | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      live_attractions: {
        Row: {
          id: string;
          park_id: string;
          external_id: string; // ThemeParks.wiki entity ID
          name: string;
          wait_time: number; // minutes, -1 if unknown
          status: 'operating' | 'down' | 'delayed' | 'temporary_closure';
          lightning_lane_available: boolean;
          lightning_lane_return_time: string | null;
          single_rider_available: boolean;
          single_rider_wait_time: number | null;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          park_id: string;
          external_id: string;
          name: string;
          wait_time: number;
          status: 'operating' | 'down' | 'delayed' | 'temporary_closure';
          lightning_lane_available?: boolean;
          lightning_lane_return_time?: string | null;
          single_rider_available?: boolean;
          single_rider_wait_time?: number | null;
          last_updated: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          park_id?: string;
          external_id?: string;
          name?: string;
          wait_time?: number;
          status?: 'operating' | 'down' | 'delayed' | 'temporary_closure';
          lightning_lane_available?: boolean;
          lightning_lane_return_time?: string | null;
          single_rider_available?: boolean;
          single_rider_wait_time?: number | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      live_entertainment: {
        Row: {
          id: string;
          park_id: string;
          external_id: string; // ThemeParks.wiki entity ID
          name: string;
          show_times: string[]; // Array of show times
          status: 'operating' | 'cancelled' | 'delayed';
          next_show_time: string | null;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          park_id: string;
          external_id: string;
          name: string;
          show_times: string[];
          status: 'operating' | 'cancelled' | 'delayed';
          next_show_time?: string | null;
          last_updated: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          park_id?: string;
          external_id?: string;
          name?: string;
          show_times?: string[];
          status?: 'operating' | 'cancelled' | 'delayed';
          next_show_time?: string | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      live_sync_status: {
        Row: {
          id: string;
          service_name: string; // 'themeparks_api', 'queue_times_api'
          last_sync_at: string;
          last_success_at: string | null;
          last_error: string | null;
          total_syncs: number;
          successful_syncs: number;
          failed_syncs: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_name: string;
          last_sync_at: string;
          last_success_at?: string | null;
          last_error?: string | null;
          total_syncs?: number;
          successful_syncs?: number;
          failed_syncs?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_name?: string;
          last_sync_at?: string;
          last_success_at?: string | null;
          last_error?: string | null;
          total_syncs?: number;
          successful_syncs?: number;
          failed_syncs?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Export typed client
export type SupabaseClient = typeof supabase;