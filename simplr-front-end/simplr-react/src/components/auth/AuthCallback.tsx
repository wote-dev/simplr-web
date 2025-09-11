import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex space-x-2"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}