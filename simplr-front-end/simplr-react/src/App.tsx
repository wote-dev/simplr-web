import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from '@/components/ui/toaster';
import { LoginOverlay } from '@/components/auth/LoginOverlay';
import { AuthCallback } from '@/components/auth/AuthCallback';
import { TaskManager } from '@/components/tasks/TaskManager';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';

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
