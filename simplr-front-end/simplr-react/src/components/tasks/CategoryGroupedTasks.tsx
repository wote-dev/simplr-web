import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="space-y-6">
      {categoriesWithTasks.map(([category, categoryTasks], categoryIndex) => {
        const categoryConfig = taskCategories[category as TaskCategory];
        
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
            className="space-y-3"
          >
            {/* Category Header */}
            <div className="flex items-center gap-3 px-1">
              <div className={`w-3 h-3 rounded-full bg-${categoryConfig.color}-500 flex-shrink-0`} />
              <h3 className="text-lg font-semibold text-foreground">
                {categoryConfig.displayName}
              </h3>
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground font-medium">
                {categoryTasks.length} {categoryTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            
            {/* Category Tasks */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: categoryIndex * 0.1 + 0.2, duration: 0.3 }}
            >
              {categoryTasks.map((task, taskIndex) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: categoryIndex * 0.1 + 0.3 + (taskIndex * 0.05), 
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                  }}
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
        );
      })}
    </div>
  );
}