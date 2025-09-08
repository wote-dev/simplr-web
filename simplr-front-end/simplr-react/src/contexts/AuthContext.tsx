import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState, AuthType, User, UseAuthReturn } from '@/types';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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

  // Initialize authentication state from Supabase or localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Check for local guest user as fallback
          const localGuestUser = localStorage.getItem('simplr_guest_user');
          const localAuthType = localStorage.getItem('simplr_auth_type');
          
          if (localGuestUser && localAuthType === 'guest') {
            try {
              const guestUser = JSON.parse(localGuestUser) as User;
              setAuthState({
                user: guestUser,
                authType: 'guest',
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return;
            } catch (parseError) {
              console.error('Failed to parse local guest user:', parseError);
              localStorage.removeItem('simplr_guest_user');
              localStorage.removeItem('simplr_auth_type');
            }
          }
          
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
          // Check for local guest user when no Supabase session
          const localGuestUser = localStorage.getItem('simplr_guest_user');
          const localAuthType = localStorage.getItem('simplr_auth_type');
          
          if (localGuestUser && localAuthType === 'guest') {
            try {
              const guestUser = JSON.parse(localGuestUser) as User;
              setAuthState({
                user: guestUser,
                authType: 'guest',
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return;
            } catch (parseError) {
              console.error('Failed to parse local guest user:', parseError);
              localStorage.removeItem('simplr_guest_user');
              localStorage.removeItem('simplr_auth_type');
            }
          }
          
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
      default:
        return 'guest';
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
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
      // First try Supabase anonymous authentication
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        // If Supabase anonymous auth fails, fall back to local guest mode
        console.warn('Supabase anonymous auth not available, using local guest mode:', error.message);
        
        // Create a local guest user
        const guestUser: User = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'Guest User',
          email: undefined,
          avatar: undefined,
        };

        // Store guest user in localStorage for persistence
        localStorage.setItem('simplr_guest_user', JSON.stringify(guestUser));
        localStorage.setItem('simplr_auth_type', 'guest');
        
        // Update auth state directly for local guest mode
        setAuthState({
          user: guestUser,
          authType: 'guest',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        
        return;
      }

      // The auth state will be updated by the onAuthStateChange listener for Supabase anonymous users
    } catch (error) {
      console.error('Guest sign-in failed:', error);
      
      // Even if there's an unexpected error, try local guest mode as final fallback
      try {
        const guestUser: User = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'Guest User',
          email: undefined,
          avatar: undefined,
        };

        localStorage.setItem('simplr_guest_user', JSON.stringify(guestUser));
        localStorage.setItem('simplr_auth_type', 'guest');
        
        setAuthState({
          user: guestUser,
          authType: 'guest',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (fallbackError) {
        console.error('Local guest mode also failed:', fallbackError);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to sign in as guest',
        }));
      }
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check if this is a local guest user
      const localAuthType = localStorage.getItem('simplr_auth_type');
      
      if (localAuthType === 'guest') {
        // For local guest users, just clear localStorage and update state
        localStorage.removeItem('simplr_guest_user');
        localStorage.removeItem('simplr_auth_type');
        
        setAuthState({
          user: null,
          authType: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }
      
      // For Supabase users, sign out normally
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