import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import type { User } from '@/types';

interface AccountSettingsProps {
  user: User | null;
  taskCount: number;
  completedTaskCount: number;
  onSignOut: () => void;
}

export function AccountSettings({
  user,
  taskCount,
  completedTaskCount,
  onSignOut,
}: AccountSettingsProps) {
  return (
    <div className="space-y-6">
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
              onClick={onSignOut}
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
  );
}