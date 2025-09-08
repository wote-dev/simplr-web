import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/hooks/useTasks';
import { DatabaseService } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Moon, Sun, Monitor, LogOut, Trash2, Download, Upload, Shield, Database, Palette, Cloud, CloudOff, RefreshCw, FileText, ExternalLink, Settings, Info } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type SettingsSection = 'account' | 'appearance' | 'data' | 'about';

export function SettingsView() {
  const { user, signOut, isAuthenticated, authType } = useAuth();
  const { theme, setTheme } = useTheme();
  const { tasks } = useTasks();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  
  const isSupabaseEnabled = isAuthenticated && authType !== 'guest';
  const taskCount = tasks.length;
  const completedTaskCount = tasks.filter(task => task.completed).length;

  const navigationItems = [
    {
      id: 'account' as SettingsSection,
      label: 'Account',
      icon: User,
      description: 'Profile and authentication'
    },
    {
      id: 'appearance' as SettingsSection,
      label: 'Appearance',
      icon: Palette,
      description: 'Theme and display settings'
    },
    {
      id: 'data' as SettingsSection,
      label: 'Data Management',
      icon: Database,
      description: 'Import, export, and sync'
    },
    {
      id: 'about' as SettingsSection,
      label: 'About',
      icon: Info,
      description: 'App info and privacy'
    }
  ];

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
    <div className="flex h-full max-h-[calc(95vh-80px)] bg-gradient-to-br from-background via-background to-accent/5">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-border/10 bg-background/50 backdrop-blur-sm p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "group w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-300 ease-out transform hover:scale-[1.02]",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md transition-all duration-200",
                  isActive ? "bg-primary/20" : "group-hover:bg-primary/20"
                )}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  <div className="text-xs opacity-70 group-hover:opacity-100 transition-opacity duration-300">{item.description}</div>
                </div>
                {isActive && (
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="animate-in fade-in-50 duration-500 h-[600px]">
            {activeSection === 'account' && (
              <div className="animate-in slide-in-from-right-4 duration-300 h-[600px] overflow-y-auto space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">Account</h2>
                <p className="text-sm text-muted-foreground">Manage your profile and authentication settings</p>
              </div>
            <Card className="border-0 shadow-sm bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-border/20">
                    {user?.avatar && (
                      <AvatarImage 
                        src={user.avatar} 
                        alt={user.name || 'User'}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-semibold">
                      {(user?.name || 'G').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground">{user?.name || 'Guest User'}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {user?.email || 'No email provided'}
                    </p>
                    <div className="flex items-center">
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
            
            <Card className="border-0 shadow-sm bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Account Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-accent/10 dark:bg-accent/20 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{taskCount}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-4 bg-accent/10 dark:bg-accent/20 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{completedTaskCount}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeSection === 'appearance' && (
              <div className="animate-in slide-in-from-right-4 duration-300 h-[600px] overflow-y-auto space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize the look and feel of your workspace</p>
            </div>
            
            <Card className="border-0 shadow-sm bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Theme</h4>
                    <p className="text-xs text-muted-foreground mb-4">Choose how Simplr looks to you. Select a single theme, or sync with your system and automatically switch between day and night themes.</p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div 
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                          theme === 'light' ? 'border-primary bg-primary/5' : 'border-border/50'
                        }`}
                        onClick={() => setTheme('light')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Sun className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Light</span>
                          {theme === 'light' && (
                            <div className="absolute top-2 right-2">
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div 
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                          theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border/50'
                        }`}
                        onClick={() => setTheme('dark')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Moon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Dark</span>
                          {theme === 'dark' && (
                            <div className="absolute top-2 right-2">
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div 
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                          theme === 'system' ? 'border-primary bg-primary/5' : 'border-border/50'
                        }`}
                        onClick={() => setTheme('system')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Monitor className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">System</span>
                          {theme === 'system' && (
                            <div className="absolute top-2 right-2">
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeSection === 'data' && (
              <div className="animate-in slide-in-from-right-4 duration-300 h-[600px] overflow-y-auto space-y-6">
             <div className="mb-6">
               <h2 className="text-xl font-semibold text-foreground mb-2">Data Management</h2>
               <p className="text-sm text-muted-foreground">Import, export, and manage your task data</p>
             </div>
            
            <Card className="border-0 shadow-sm bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-8">
                  {/* Sync Status */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Database className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-medium">Sync Status</h4>
                    </div>
                    
                    {isSupabaseEnabled ? (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200/30 dark:border-green-800/30">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <Cloud className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-green-800 dark:text-green-200">Cloud Sync Enabled</h5>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Your tasks are automatically synced to Supabase
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200/30 dark:border-orange-800/30">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                            <CloudOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-orange-800 dark:text-orange-200">Local Storage Only</h5>
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                              Sign in with Google to enable cloud sync
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Local</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Backup & Restore */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-medium">Backup & Restore</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Keep your data safe with regular backups. Restore from a previous backup if needed.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="group relative overflow-hidden rounded-lg border border-border/50 hover:bg-accent/20 dark:hover:bg-accent/50 transition-all duration-200">
                        <Button 
                          variant="ghost" 
                          onClick={isSupabaseEnabled ? handleCreateBackup : handleExportData}
                          disabled={isBackingUp}
                          className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-transparent"
                        >
                          <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            {isBackingUp ? (
                              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                            ) : (
                              <Download className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-sm mb-1">
                              {isSupabaseEnabled ? 'Create Backup' : 'Export Tasks'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isSupabaseEnabled ? 'Save to cloud storage' : 'Download as JSON file'}
                            </p>
                          </div>
                          {isBackingUp && (
                            <div className="text-xs text-muted-foreground">
                              Creating backup...
                            </div>
                          )}
                        </Button>
                      </div>
                      
                      <div className="group relative overflow-hidden rounded-lg border border-border/50 hover:bg-accent/20 dark:hover:bg-accent/50 transition-all duration-200">
                        <Button 
                          variant="ghost" 
                          onClick={isSupabaseEnabled ? handleRestoreFromBackup : handleImportData}
                          disabled={isRestoring}
                          className="w-full h-auto p-6 flex flex-col items-center space-y-3 hover:bg-transparent"
                        >
                          <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            {isRestoring ? (
                              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                            ) : (
                              <Upload className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-sm mb-1">
                              {isSupabaseEnabled ? 'Restore Backup' : 'Import Tasks'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isSupabaseEnabled ? 'From cloud backup' : 'Upload JSON file'}
                            </p>
                          </div>
                          {isRestoring && (
                            <div className="text-xs text-muted-foreground">
                              Restoring data...
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Irreversible and destructive actions. Please proceed with caution.</p>
                    
                    <div className="p-4 bg-gradient-to-r from-red-50/50 to-rose-50/50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-200/30 dark:border-red-800/30">
                      <Button 
                        variant="outline" 
                        onClick={handleClearData}
                        className="w-full justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <div className="text-center">
                          <div className="text-sm font-medium">Clear All Data</div>
                        </div>
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        This action cannot be undone. All your tasks will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeSection === 'about' && (
              <div className="animate-in slide-in-from-right-4 duration-300 h-[600px] overflow-y-auto space-y-6">
             <div className="mb-6">
               <h2 className="text-xl font-semibold text-foreground mb-2">About</h2>
               <p className="text-sm text-muted-foreground">Application information and resources</p>
             </div>
            
            <Card className="border-0 shadow-sm bg-card/50">
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

            <Card className="border-0 shadow-sm bg-card/50">
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
                        <span className="text-green-600 dark:text-green-400">Cloud</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">Local</span>
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
          )}
        </div>
      </div>
    </div>
  );
}