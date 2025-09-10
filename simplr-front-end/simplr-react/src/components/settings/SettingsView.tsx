import { useState } from 'react';
import { User, Palette, Database, Info, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SettingsBody } from './SettingsBody';
import type { Theme } from '@/types';

type SettingsSection = 'account' | 'appearance' | 'data' | 'about';

const navigationItems = [
  {
    id: 'account' as SettingsSection,
    label: 'Account',
    icon: User,
  },
  {
    id: 'appearance' as SettingsSection,
    label: 'Appearance',
    icon: Palette,
  },
  {
    id: 'data' as SettingsSection,
    label: 'Data Management',
    icon: Database,
  },
  {
    id: 'about' as SettingsSection,
    label: 'About',
    icon: Info,
  }
];

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const activeSectionLabel = navigationItems.find(item => item.id === activeSection)?.label;

  return (
    <div className="flex flex-col md:flex-row bg-gradient-to-br from-background via-background to-accent/5">
      {/* Mobile Navigation */}
      <div className="md:hidden p-2 flex items-center justify-between border-b border-border/10">
        <span className="font-medium text-base pl-2">{activeSectionLabel}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {navigationItems.map((item) => (
              <DropdownMenuItem key={item.id} onClick={() => setActiveSection(item.id)}>
                <item.icon className="w-4 h-4 mr-2" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-border/10 bg-background/50 backdrop-blur-sm p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "group w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ease-in-out",
                  isActive
                    ? "bg-gray-200 dark:bg-primary text-gray-900 dark:text-primary-foreground"
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent hover:text-gray-700 dark:hover:text-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5 text-current flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-105" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <SettingsBody activeSection={activeSection} />
      </div>
    </div>
  );
}