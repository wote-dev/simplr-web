import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import GoogleLogo from '../../assets/google-logo.svg';
import AppleLogo from '../../assets/apple-logo.svg';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LoginOverlayProps {
  className?: string;
}

export function LoginOverlay({ className }: LoginOverlayProps) {
  const { signInWithApple, signInWithGoogle, signInAsGuest, isLoading, error } = useAuth();
  const [loadingType, setLoadingType] = useState<'apple' | 'google' | 'guest' | null>(null);

  const handleAppleSignIn = async () => {
    try {
      setLoadingType('apple');
      await signInWithApple();
    } catch (err) {
      console.error('Apple Sign-In failed:', err);
    } finally {
      setLoadingType(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoadingType('google');
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setLoadingType(null);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoadingType('guest');
      await signInAsGuest();
    } catch (err) {
      console.error('Guest sign-in failed:', err);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )}>
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <img 
              src="/favicon4.png" 
              alt="Simplr" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to a simple icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to Simplr
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Your simple, powerful task manager
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent dark:border-gray-200"
              size="lg"
            >
              {loadingType === 'apple' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <img src={AppleLogo} alt="Apple" className="mr-2 h-5 w-5 flex-shrink-0" />
              )}
              Continue with Apple
            </Button>
            
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 dark:bg-black dark:hover:bg-gray-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              size="lg"
            >
              {loadingType === 'google' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <img src={GoogleLogo} alt="Google" className="mr-2 h-5 w-5 flex-shrink-0" />
              )}
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">
                  Or
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleGuestSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-2"
              size="lg"
            >
              {loadingType === 'guest' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <User className="mr-2 h-5 w-5" />
              )}
              Continue as Guest
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our terms of service and privacy policy.
              Your data is stored locally on your device.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}