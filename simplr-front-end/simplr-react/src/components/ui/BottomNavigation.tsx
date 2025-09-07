import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Plus, CheckSquare } from 'lucide-react';
import type { TaskView } from '@/types';

interface BottomNavigationProps {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  onAddTask: () => void;
}

export function BottomNavigation({ currentView, onViewChange, onAddTask }: BottomNavigationProps) {
  const navItems = [
    {
      id: 'upcoming' as const,
      icon: Home,
      label: 'Home',
      view: 'upcoming' as TaskView,
    },
    {
      id: 'today' as const,
      icon: CheckSquare,
      label: 'Today',
      view: 'today' as TaskView,
    },
    {
      id: 'add' as const,
      icon: Plus,
      label: 'Add',
      view: null,
    },
    {
      id: 'completed' as const,
      icon: CheckSquare,
      label: 'Done',
      view: 'completed' as TaskView,
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

            if (isAddButton) {
              return (
                <Button
                  key={item.id}
                  onClick={onAddTask}
                  size="lg"
                  className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                >
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </Button>
              );
            }

            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onViewChange(item.view!)}
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 ${
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