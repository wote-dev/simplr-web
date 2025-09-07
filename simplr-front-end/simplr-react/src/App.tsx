import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import { LoginOverlay } from '@/components/auth/LoginOverlay';
import { TaskManager } from '@/components/tasks/TaskManager';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

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
