import { createClient } from '@supabase/supabase-js';

// Supabase configuration - support both Node.js and browser environments
const getEnvVar = (key: string, fallback?: string) => {
  // Check if we're in Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // Check if we're in Vite browser environment
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return ((import.meta as any).env as any)[key];
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://zclzhvkoqwelhfxahaly.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbHpodmtvcXdlbGhmeGFoYWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTAwMDMsImV4cCI6MjA3MzEyNjAwM30.UYjLv3TjT6e-Wv0JEbWTgCmF50vbBEIBduEMKeSVp5s';

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
      live_park_schedules: {
        Row: {
          id: string;
          park_id: string;
          schedule_date: string; // Date in YYYY-MM-DD format
          regular_open: string | null; // Time in HH:MM format
          regular_close: string | null; // Time in HH:MM format
          early_entry_open: string | null; // Time in HH:MM format
          extended_evening_close: string | null; // Time in HH:MM format
          data_source: string;
          is_estimated: boolean;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          park_id: string;
          schedule_date: string;
          regular_open?: string | null;
          regular_close?: string | null;
          early_entry_open?: string | null;
          extended_evening_close?: string | null;
          data_source?: string;
          is_estimated?: boolean;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          park_id?: string;
          schedule_date?: string;
          regular_open?: string | null;
          regular_close?: string | null;
          early_entry_open?: string | null;
          extended_evening_close?: string | null;
          data_source?: string;
          is_estimated?: boolean;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      live_park_events: {
        Row: {
          id: number;
          park_id: string;
          event_date: string; // Date in YYYY-MM-DD format
          event_name: string;
          event_type: string;
          event_open: string | null; // Time in HH:MM:SS format
          event_close: string | null; // Time in HH:MM:SS format
          description: string | null;
          data_source: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          park_id: string;
          event_date: string;
          event_name: string;
          event_type: string;
          event_open?: string | null;
          event_close?: string | null;
          description?: string | null;
          data_source?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          park_id?: string;
          event_date?: string;
          event_name?: string;
          event_type?: string;
          event_open?: string | null;
          event_close?: string | null;
          description?: string | null;
          data_source?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      park_crowd_predictions: {
        Row: {
          id: string;
          park_id: string;
          prediction_date: string; // Date in YYYY-MM-DD format
          crowd_level: number; // 1-10 scale
          crowd_level_description: string;
          recommendation: string | null;
          data_source: string;
          confidence_score: number | null; // 0.00-1.00 if available
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          park_id: string;
          prediction_date: string;
          crowd_level: number;
          crowd_level_description: string;
          recommendation?: string | null;
          data_source?: string;
          confidence_score?: number | null;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          park_id?: string;
          prediction_date?: string;
          crowd_level?: number;
          crowd_level_description?: string;
          recommendation?: string | null;
          data_source?: string;
          confidence_score?: number | null;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Export typed client
export type SupabaseClient = typeof supabase;