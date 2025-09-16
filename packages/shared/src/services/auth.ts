import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    loading: true
  };

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      console.log('🔑 Initializing auth...');

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error);
      } else {
        console.log('✅ Initial session:', session?.user?.email || 'No session');
      }

      if (session?.user) {
        await this.loadUserProfile(session.user);
      }

      this.updateState({
        session,
        loading: false
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          await this.loadUserProfile(session.user);
        } else {
          this.updateState({
            user: null,
            session: null,
            loading: false
          });
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      this.updateState({
        user: null,
        session: null,
        loading: false
      });
    }
  }

  private async loadUserProfile(user: User) {
    try {
      console.log('👤 Loading profile for user:', user.email);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('⚠️ Profile query error (might not exist yet):', error.message);
      }

      this.updateState({
        user: {
          id: user.id,
          email: user.email || null,
          fullName: profile?.full_name || null
        },
        session: (await supabase.auth.getSession()).data.session,
        loading: false
      });

      console.log('✅ User profile loaded:', user.email);
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      // Still set user data even if profile fails
      this.updateState({
        user: {
          id: user.id,
          email: user.email || null,
          fullName: null
        },
        session: (await supabase.auth.getSession()).data.session,
        loading: false
      });
    }
  }

  private updateState(updates: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // Public methods
  getState(): AuthState {
    return this.currentState;
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || null
        });
    }

    return data;
  }

  async signIn(email: string, password: string) {
    console.log('🔐 Attempting sign in for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      throw error;
    }

    console.log('✅ Sign in successful for:', email);
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async updateProfile(updates: { fullName?: string; email?: string }) {
    const user = this.currentState.user;
    if (!user) throw new Error('No authenticated user');

    // Update auth user if email is changing
    if (updates.email && updates.email !== user.email) {
      const { error } = await supabase.auth.updateUser({
        email: updates.email
      });
      if (error) throw error;
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        email: updates.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;

    // Refresh user data
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await this.loadUserProfile(authUser);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();