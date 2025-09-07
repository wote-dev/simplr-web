import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import { LoginOverlay } from '@/components/auth/LoginOverlay';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { TaskManager } from '@/components/tasks/TaskManager';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    // Check if we're in an auth callback flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isCallback = hashParams.get('access_token') || hashParams.get('error') || hashParams.get('type') === 'recovery';
    setIsAuthCallback(!!isCallback);
  }, []);

  // Show auth callback handler if we're in callback flow
  if (isAuthCallback) {
    return (
      <AuthCallback 
        onComplete={() => {
          setIsAuthCallback(false);
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        }} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading Simplr...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginOverlay />;
  }

  return <TaskManager />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-background text-foreground">
            <AppContent />
            <Toaster />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
