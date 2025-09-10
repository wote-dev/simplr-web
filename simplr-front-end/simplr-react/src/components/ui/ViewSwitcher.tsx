import { motion } from 'framer-motion';
import { Grid3X3, Layers3 } from 'lucide-react';

type View = 'grid' | 'categories';

interface ViewSwitcherProps {
  value: View;
  onValueChange: (value: View) => void;
}

const options = [
  { id: 'grid', icon: Grid3X3, label: 'Grid' },
  { id: 'categories', icon: Layers3, label: 'Categories' },
] as const;

export function ViewSwitcher({ value, onValueChange }: ViewSwitcherProps) {
  return (
    <div className="relative flex items-center rounded-full bg-muted/60 p-1 shadow-inner backdrop-blur-sm border border-border/50">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onValueChange(option.id)}
          className={`relative flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:px-5 sm:py-1.5 sm:text-sm ${
            value === option.id ? 'text-foreground' : 'text-muted-foreground hover:text-gray-700 dark:hover:text-foreground'
          }`}
        >
          {value === option.id && (
            <motion.div
              layoutId="view-switcher-active"
              className="absolute inset-0 rounded-full bg-background shadow-sm motion-safe"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ willChange: 'transform' }}
            />
          )}
          <div className="relative z-10 flex items-center">
            <option.icon className="h-3 w-3 mr-1.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}