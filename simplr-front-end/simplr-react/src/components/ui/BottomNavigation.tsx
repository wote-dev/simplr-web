import { Button } from '@/components/ui/button';
import { Home, Plus, Settings, Calendar, CheckCircle } from 'lucide-react';
import type { TaskView } from '@/types';

interface BottomNavigationProps {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  onAddTask: () => void;
  onOpenSettings: () => void;
}

export function BottomNavigation({ currentView, onViewChange, onAddTask, onOpenSettings }: BottomNavigationProps) {
  const navItems = [
    {
      id: 'today' as const,
      icon: Home,
      label: 'Today',
      view: 'today' as TaskView,
    },
    {
      id: 'upcoming' as const,
      icon: Calendar,
      label: 'Upcoming',
      view: 'upcoming' as TaskView,
    },
    {
      id: 'add' as const,
      icon: Plus,
      label: 'Add',
      view: null,
    },
    {
      id: 'completed' as const,
      icon: CheckCircle,
      label: 'Completed',
      view: 'completed' as TaskView,
    },
    {
      id: 'settings' as const,
      icon: Settings,
      label: 'Settings',
      view: null,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.view === currentView;
            const isAddButton = item.id === 'add';
            const isSettingsButton = item.id === 'settings';

            if (isAddButton) {
              return (
                <Button
                  key={item.id}
                  onClick={onAddTask}
                  size="lg"
                  className="h-12 w-12 rounded-full bg-primary shadow-lg"
                >
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </Button>
              );
            }

            if (isSettingsButton) {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={onOpenSettings}
                  className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 text-muted-foreground hover:bg-transparent`}
                >
                  <Icon className={`h-5 w-5 text-muted-foreground`} />
                  <span className={`text-xs text-muted-foreground`}>
                    {item.label}
                  </span>
                </Button>
              );
            }

            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onViewChange(item.view!)}
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 hover:bg-transparent ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}