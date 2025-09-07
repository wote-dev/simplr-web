import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState, AuthType, User, UseAuthReturn } from '@/types';

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

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAuthType = localStorage.getItem('authType') as AuthType | null;
        
        if (storedUser && storedAuthType) {
          const user: User = JSON.parse(storedUser);
          
          // Validate that we have the corresponding auth data for the stored auth type
          const hasValidAuthData = 
            (storedAuthType === 'apple' && localStorage.getItem('appleAuthData')) ||
            (storedAuthType === 'google' && localStorage.getItem('googleAuthData')) ||
            (storedAuthType === 'guest');
          
          if (hasValidAuthData) {
            setAuthState({
              user,
              authType: storedAuthType,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Clear invalid auth state
            localStorage.removeItem('user');
            localStorage.removeItem('authType');
            localStorage.removeItem('appleAuthData');
            localStorage.removeItem('googleAuthData');
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear potentially corrupted auth state
        localStorage.removeItem('user');
        localStorage.removeItem('authType');
        localStorage.removeItem('appleAuthData');
        localStorage.removeItem('googleAuthData');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to restore authentication state',
        }));
      }
    };

    initializeAuth();
  }, []);

  const signInWithApple = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check if Apple Sign-In is available
      if (!window.AppleID) {
        throw new Error('Apple Sign-In SDK not loaded');
      }

      // Configure Apple Sign-In
      await window.AppleID.auth.init({
        clientId: 'com.simplr.taskmanager',
        scope: 'name email',
        redirectURI: window.location.origin,
        state: 'signin',
        usePopup: true,
      });

      // Perform sign-in
      const data = await window.AppleID.auth.signIn();
      
      const user: User = {
        id: data.user || 'apple_user',
        name: data.user?.name?.firstName 
          ? `${data.user.name.firstName} ${data.user.name.lastName || ''}`.trim()
          : 'Apple User',
        email: data.user?.email,
      };

      // Store authentication data
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authType', 'apple');
      localStorage.setItem('appleAuthData', JSON.stringify(data));

      setAuthState({
        user,
        authType: 'apple',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
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
      // Check if Google Sign-In is available
      if (!window.google) {
        throw new Error('Google Sign-In SDK not loaded');
      }

      // Initialize Google Sign-In
       await new Promise<void>((resolve, reject) => {
         window.google!.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
          callback: (response: any) => {
            try {
              // Decode the JWT token to get user info
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              
              const user: User = {
                id: payload.sub,
                name: payload.name || 'Google User',
                email: payload.email,
                avatar: payload.picture,
              };

              // Store authentication data
              localStorage.setItem('user', JSON.stringify(user));
              localStorage.setItem('authType', 'google');
              localStorage.setItem('googleAuthData', JSON.stringify(response));

              setAuthState({
                user,
                authType: 'google',
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        // Trigger the sign-in prompt
         window.google!.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to renderButton if prompt is not displayed
            const buttonContainer = document.createElement('div');
            buttonContainer.style.position = 'fixed';
            buttonContainer.style.top = '-9999px';
            document.body.appendChild(buttonContainer);
            
            window.google!.accounts.id.renderButton(buttonContainer, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
            });
            
            // Programmatically click the button
            setTimeout(() => {
              const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
              if (googleButton) {
                googleButton.click();
              }
              document.body.removeChild(buttonContainer);
            }, 100);
          }
        });
      });
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
      const guestUser: User = {
        id: `guest_${Date.now()}`,
        name: 'Guest User',
      };

      // Store guest authentication data
      localStorage.setItem('user', JSON.stringify(guestUser));
      localStorage.setItem('authType', 'guest');

      setAuthState({
        user: guestUser,
        authType: 'guest',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
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
      // Clear stored authentication data
      localStorage.removeItem('user');
      localStorage.removeItem('authType');
      localStorage.removeItem('appleAuthData');
      localStorage.removeItem('googleAuthData');
      
      // If signed in with Apple, attempt to revoke
      if (authState.authType === 'apple' && window.AppleID) {
        try {
          await window.AppleID.auth.signOut();
        } catch (appleError) {
          console.warn('Apple Sign-Out failed:', appleError);
        }
      }
      
      // If signed in with Google, attempt to revoke
       if (authState.authType === 'google' && window.google) {
         try {
           window.google!.accounts.id.disableAutoSelect();
        } catch (googleError) {
          console.warn('Google Sign-Out failed:', googleError);
        }
      }

      setAuthState({
        user: null,
        authType: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
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

// Extend Window interface for Apple Sign-In and Google Sign-In SDKs
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: any) => Promise<void>;
        signIn: () => Promise<any>;
        signOut: () => Promise<void>;
      };
    };
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}