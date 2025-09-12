import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/hooks/useTasks';
import { DatabaseService } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Monitor, Trash2, Download, Upload, Cloud, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AccountSettings } from './AccountSettings';
import type { Theme } from '@/types';

type SettingsSection = 'account' | 'appearance' | 'data' | 'about';

interface SettingsBodyProps {
  activeSection: SettingsSection;
}

export function SettingsBody({ activeSection }: SettingsBodyProps) {
  const { user, signOut, isAuthenticated, authType } = useAuth();
  const { theme, setTheme } = useTheme();
  const { tasks } = useTasks();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  const isSupabaseEnabled = isAuthenticated && authType !== 'guest';
  const taskCount = tasks.length;
  const completedTaskCount = tasks.filter(task => task.completed).length;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleCreateBackup = async () => {
    if (!user?.id) return;
    
    try {
      setIsBackingUp(true);
      
      if (isSupabaseEnabled) {
         // Create backup in Supabase
         const backup = await DatabaseService.createBackup(user.id);
         setLastBackupDate(backup.timestamp);
         console.log('Backup created:', backup);
       } else {
        // Fallback to local export
        handleExportData();
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const handleExportData = () => {
    const dataStr = JSON.stringify({
      tasks,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `simplr-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleRestoreFromBackup = async () => {
    if (!user?.id || !isSupabaseEnabled) {
      handleImportData();
      return;
    }
    
    try {
      setIsRestoring(true);
      
      // For now, we'll restore from the most recent backup
       // In a full implementation, you might want to show a list of available backups
       const backup = await DatabaseService.createBackup(user.id); // Get current state as backup format
       const restoreData = {
         tasks: backup.tasks,
         ...(backup.profile && { profile: backup.profile })
       };
       await DatabaseService.restoreFromBackup(restoreData, user.id);
      
      // Refresh the page to load restored data
      window.location.reload();
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      alert('Failed to restore from backup. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };
  
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.tasks && Array.isArray(data.tasks)) {
              if (isSupabaseEnabled && user?.id) {
                // Restore to Supabase
                await DatabaseService.restoreFromBackup({ tasks: data.tasks }, user.id);
              } else {
                // Restore to localStorage
                localStorage.setItem('simplr_tasks', JSON.stringify(data.tasks));
              }
              window.location.reload(); // Refresh to load new data
            }
          } catch (error) {
            console.error('Failed to import data:', error);
            alert('Failed to import data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all your tasks? This action cannot be undone.')) {
      localStorage.removeItem('simplr_tasks');
      window.location.reload();
    }
  };

  const themeOptions: { value: Theme; label: string; icon: any }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <motion.div
      key={activeSection}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="p-4 sm:p-8"
    >
      {activeSection === 'account' && (
        <AccountSettings
          user={user}
          taskCount={taskCount}
          completedTaskCount={completedTaskCount}
          onSignOut={handleSignOut}
        />
      )}
      
      {activeSection === 'appearance' && (
        <div className="space-y-6">
          <div className="hidden md:block mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize the look and feel of the app</p>
          </div>
          <Card className="border-0 shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border-2 transition-all duration-200",
                      theme === option.value
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-primary/50 bg-accent/20"
                    )}
                  >
                    <option.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'data' && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Data Management</h2>
            <p className="text-sm text-muted-foreground">Manage your application data</p>
          </div>
          <Card className="border-0 shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle>Data Backup & Restore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isSupabaseEnabled
                  ? "Your data is synced with the cloud."
                  : "You are currently in guest mode. Backups are handled locally."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCreateBackup} disabled={isBackingUp} variant="outline">
                  <Cloud className="w-4 h-4 mr-2" />
                  {isBackingUp ? 'Backing up...' : `Backup ${isSupabaseEnabled ? 'to Cloud' : 'Locally'}`}
                </Button>
                <Button onClick={handleRestoreFromBackup} disabled={isRestoring} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isRestoring ? 'Restoring...' : `Restore ${isSupabaseEnabled ? 'from Cloud' : 'from File'}`}
                </Button>
              </div>
              {lastBackupDate && (
                <p className="text-xs text-muted-foreground">Last backup: {lastBackupDate}</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle>Local Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your data to a JSON file or import data from a backup.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExportData} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button onClick={handleImportData} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/50 shadow-sm bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-destructive/80">
                This action will permanently delete all your local data.
              </p>
              <Button onClick={handleClearData} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Local Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'about' && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">About Spaces by Simplr</h2>
            <p className="text-sm text-muted-foreground">Information about the application</p>
          </div>
          <Card className="border-0 shadow-sm bg-card/50">
            <CardContent className="p-6 text-center">
              <img src="/favicon4.png" alt="Simplr Logo" className="w-24 h-24 mx-auto mb-4 rounded-full" />
              <h3 className="text-lg font-semibold">Spaces</h3>
              <p className="text-sm text-muted-foreground">Beta Release 1.0</p>
              <p className="mt-4 text-sm">
                A simple and elegant task management app designed to help you focus on what matters.
              </p>
              <Separator className="my-6" />
              <div className="flex justify-center gap-4">
                <Link to="/privacy" className="text-sm text-primary hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}