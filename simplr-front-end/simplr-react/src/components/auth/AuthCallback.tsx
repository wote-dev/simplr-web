import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthCallbackProps {
  onComplete: () => void;
}

export function AuthCallback({ onComplete }: AuthCallbackProps) {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback by getting the session
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
        }

        // Always call onComplete to return to the main app
        // The AuthContext will handle the session state
        onComplete();
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        onComplete();
      }
    };

    // Check if we're in an auth callback (URL contains auth fragments)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('access_token') || hashParams.get('error')) {
      handleAuthCallback();
    } else {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}