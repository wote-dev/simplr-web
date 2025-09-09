import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Clock, SortAsc, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SortOption } from '@/hooks/useTasks';

interface SortDropdownProps {
  value: SortOption;
  onValueChange: (value: SortOption) => void;
}

const sortOptions = [
  { 
    id: 'latest' as const, 
    icon: Plus, 
    label: 'Latest Added',
    description: 'Newest tasks first'
  },
  { 
    id: 'oldest' as const, 
    icon: Clock, 
    label: 'First Added',
    description: 'Oldest tasks first'
  },
  { 
    id: 'dueDate' as const, 
    icon: Calendar, 
    label: 'Due Date',
    description: 'Earliest due date first'
  },
  { 
    id: 'alphabetical' as const, 
    icon: SortAsc, 
    label: 'Alphabetical',
    description: 'A to Z by title'
  },
];

export function SortDropdown({ value, onValueChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = sortOptions.find(option => option.id === value) || sortOptions[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium bg-background/80 backdrop-blur-sm border-border/50 hover:bg-gray-100 dark:hover:bg-accent hover:text-gray-700 dark:hover:text-accent-foreground transition-colors duration-150 min-w-[140px] justify-between"
      >
        <div className="flex items-center gap-1.5">
          <SelectedIcon className="h-3 w-3" />
          <span className="hidden sm:inline">{selectedOption.label}</span>
          <span className="sm:hidden">Sort</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ willChange: 'transform' }}
        >
          <ChevronDown className="h-3 w-3" />
        </motion.div>
      </Button>

      {/* Dropdown Menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ 
                duration: 0.12, 
                ease: "easeOut"
              }}
              style={{ willChange: 'transform, opacity' }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-lg bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg overflow-hidden"
            >
              <div className="p-1">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = value === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        onValueChange(option.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors duration-100 ${
                        isSelected 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'hover:bg-muted/60 text-gray-700 dark:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          isSelected ? 'text-primary' : 'text-gray-700 dark:text-foreground'
                        }`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}