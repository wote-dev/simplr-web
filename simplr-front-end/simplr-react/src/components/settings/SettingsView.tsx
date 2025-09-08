import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/hooks/useTasks';
import { DatabaseService } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Moon, Sun, Monitor, LogOut, Trash2, Download, Upload, Shield, Database, Palette, Cloud, CloudOff, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function SettingsView() {
  const { user, signOut, isAuthenticated, authType } = useAuth();
  const { theme, setTheme } = useTheme();
  const { tasks } = useTasks();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  // Removed showPrivacyPolicy state as we're now using a separate page
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

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and application data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">Your profile and authentication settings</p>
              </div>
            </div>
            
            <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-14 w-14 border-2 border-border">
                    {user?.avatar && (
                      <AvatarImage 
                        src={user.avatar} 
                        alt={user.name || 'User'}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-lg font-semibold">
                      {(user?.name || 'G').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground">{user?.name || 'Guest User'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.email || 'No email provided'}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSignOut}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appearance Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize the look and feel of your workspace</p>
              </div>
            </div>
            
            <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Theme Preference</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = theme === option.value;
                        return (
                          <Button
                            key={option.value}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTheme(option.value as any)}
                            className={`h-16 flex-col space-y-2 transition-all duration-200 ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground shadow-md border-primary' 
                                : 'hover:bg-accent/50 hover:border-accent'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{option.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Management Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Data Management</h2>
                <p className="text-sm text-muted-foreground">Import, export, and manage your task data</p>
              </div>
            </div>
            
            <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Sync Status */}
                  {isSupabaseEnabled && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Cloud className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Cloud Sync Enabled</h4>
                          <p className="text-xs text-muted-foreground">
                            Your tasks are automatically synced to Supabase
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Connected</span>
                      </div>
                    </div>
                  )}
                  
                  {!isSupabaseEnabled && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CloudOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Local Storage Only</h4>
                        <p className="text-xs text-muted-foreground">
                          Sign in with Google to enable cloud sync
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        {isSupabaseEnabled ? 'Cloud Backup' : 'Export Data'}
                      </h4>
                      <Button 
                        variant="outline" 
                        onClick={isSupabaseEnabled ? handleCreateBackup : handleExportData}
                        disabled={isBackingUp}
                        className="w-full h-12 justify-start hover:bg-accent/50 transition-colors"
                      >
                        {isBackingUp ? (
                          <RefreshCw className="h-4 w-4 mr-3 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-3" />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {isSupabaseEnabled ? 'Create Backup' : 'Export Tasks'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isSupabaseEnabled ? 'Save to cloud' : 'Download as JSON'}
                          </div>
                        </div>
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        {isSupabaseEnabled ? 'Cloud Restore' : 'Import Data'}
                      </h4>
                      <Button 
                        variant="outline" 
                        onClick={isSupabaseEnabled ? handleRestoreFromBackup : handleImportData}
                        disabled={isRestoring}
                        className="w-full h-12 justify-start hover:bg-accent/50 transition-colors"
                      >
                        {isRestoring ? (
                          <RefreshCw className="h-4 w-4 mr-3 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-3" />
                        )}
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {isSupabaseEnabled ? 'Restore Backup' : 'Import Tasks'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isSupabaseEnabled ? 'From cloud backup' : 'Upload JSON file'}
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                    <Button 
                      variant="outline" 
                      onClick={handleClearData}
                      className="w-full justify-start hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Clear All Data</div>
                        <div className="text-xs opacity-70">This action cannot be undone</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* App Information */}
          <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Application Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Simplr Web v1.0 (Alpha)</h3>
                </div>
                
                <Separator />
                
                <p className="text-xs text-muted-foreground leading-relaxed text-center">
                  A modern, enterprise-grade task management solution designed for productivity and simplicity.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <span className="text-sm font-medium">{taskCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-medium">{completedTaskCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sync Status</span>
                  <span className="text-sm font-medium">
                    {isSupabaseEnabled ? (
                      <span className="text-green-600">Cloud</span>
                    ) : (
                      <span className="text-orange-600">Local</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Backup</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {lastBackupDate ? (
                      new Date(lastBackupDate).toLocaleDateString()
                    ) : (
                      'Never'
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Privacy Policy Link at Bottom */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="flex justify-center">
          <Link to="/privacy">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 px-4 py-2 rounded-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Privacy Policy & Terms of Service
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}