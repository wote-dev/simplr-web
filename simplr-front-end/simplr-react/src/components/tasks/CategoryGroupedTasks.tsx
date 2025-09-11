import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { taskCategories, getTasksByCategory } from '@/hooks/useTasks';
import type { Task, TaskCategory } from '@/types';

interface CategoryGroupedTasksProps {
  tasks: Task[];
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onToggleChecklistItem?: (taskId: number, itemId: number) => void;
}

export function CategoryGroupedTasks({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleChecklistItem
}: CategoryGroupedTasksProps) {
  const tasksByCategory = getTasksByCategory(tasks);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };
  
  // Filter out empty categories and sort by priority
  const categoriesWithTasks = Object.entries(tasksByCategory)
    .filter(([_, categoryTasks]) => categoryTasks.length > 0)
    .sort(([a], [b]) => {
      const priorityA = taskCategories[a as TaskCategory].priority;
      const priorityB = taskCategories[b as TaskCategory].priority;
      return priorityA - priorityB;
    });

  if (categoriesWithTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {categoriesWithTasks.map(([category, categoryTasks], categoryIndex) => {
        const categoryConfig = taskCategories[category as TaskCategory];
        const isExpanded = expandedCategories[category] ?? true; // Default to expanded
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: categoryIndex * 0.1, 
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="rounded-lg bg-card/50 border"
          >
            {/* Category Header */}
            <motion.button 
              className="w-full flex items-center gap-3 px-4 py-3 text-left motion-safe"
              onClick={() => toggleCategory(category)}
              whileHover={{ backgroundColor: 'rgba(var(--accent), 0.03)' }}
              whileTap={{ scale: 0.998 }}
              transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ willChange: 'transform' }}
            >
              <div className={`w-3 h-3 rounded-full bg-${categoryConfig.color}-500 flex-shrink-0`} />
              <h3 className="text-lg font-semibold text-foreground">
                {categoryConfig.displayName}
              </h3>
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-sm text-muted-foreground font-medium">
                {categoryTasks.length} {categoryTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ willChange: 'transform' }}
                className="motion-safe"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </motion.button>
            
            {/* Category Tasks (Collapsible) */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transition: {
                      height: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
                      opacity: { duration: 0.2, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }
                    }
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0,
                    transition: {
                      height: { duration: 0.2, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] },
                      opacity: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
                    }
                  }}
                  style={{ willChange: 'height, opacity' }}
                  className="motion-safe"
                >
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 pt-0 motion-safe"
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                    exit={{ y: -5 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ willChange: 'transform' }}
                  >
                    {categoryTasks.map((task, taskIndex) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ 
                          delay: taskIndex * 0.03, 
                          duration: 0.18,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        style={{ willChange: 'transform, opacity' }}
                        className="motion-safe"
                      >
                        <TaskCard
                          task={task}
                          onToggleComplete={onToggleComplete}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onToggleChecklistItem={onToggleChecklistItem}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}