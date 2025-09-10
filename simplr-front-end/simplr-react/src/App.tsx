import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import { LoginOverlay } from '@/components/auth/LoginOverlay';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { TaskManager } from '@/components/tasks/TaskManager';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthCallback, setIsAuthCallback] = useState(false);

  useEffect(() => {
    // Check if we're in an auth callback flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isCallback = hashParams.get('access_token') || hashParams.get('error') || hashParams.get('type') === 'recovery';
    setIsAuthCallback(!!isCallback);

    // Handle SPA routing redirect from 404.html
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && redirectPath !== window.location.pathname) {
      sessionStorage.removeItem('redirectPath');
      // Use window.location to navigate to preserve the full URL
      window.location.href = redirectPath;
    }
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

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/" element={
        !isAuthenticated ? <LoginOverlay /> : <TaskManager />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
