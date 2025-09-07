import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState, AuthType, User, UseAuthReturn } from '@/types';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    authType: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize authentication state from Supabase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
          return;
        }

        if (session?.user) {
          const user = mapSupabaseUserToUser(session.user);
          const authType = getAuthTypeFromProvider(session.user.app_metadata?.provider);
          
          setAuthState({
            user,
            authType,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to restore authentication state',
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = mapSupabaseUserToUser(session.user);
          const authType = getAuthTypeFromProvider(session.user.app_metadata?.provider);
          
          setAuthState({
            user,
            authType,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            authType: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to map Supabase user to our User type
  const mapSupabaseUserToUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || 
             supabaseUser.user_metadata?.name || 
             supabaseUser.email?.split('@')[0] || 
             'User',
      email: supabaseUser.email,
      avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
    };
  };

  // Helper function to determine auth type from provider
  const getAuthTypeFromProvider = (provider?: string): AuthType => {
    switch (provider) {
      case 'google':
        return 'google';
      case 'apple':
        return 'apple';
      default:
        return 'guest';
    }
  };

  const signInWithApple = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // The auth state will be updated by the onAuthStateChange listener
      // when the user returns from the OAuth flow
    } catch (error) {
      console.error('Apple Sign-In failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Apple Sign-In failed',
      }));
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // The auth state will be updated by the onAuthStateChange listener
      // when the user returns from the OAuth flow
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google Sign-In failed',
      }));
    }
  };

  const signInAsGuest = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // For guest mode, we'll use anonymous sign-in with Supabase
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        throw error;
      }

      // The auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error('Guest sign-in failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to sign in as guest',
      }));
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // The auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error('Sign-out failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to sign out',
      }));
    }
  };

  const value: UseAuthReturn = {
    ...authState,
    signInWithApple,
    signInWithGoogle,
    signInAsGuest,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}