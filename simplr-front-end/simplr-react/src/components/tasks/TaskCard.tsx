import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Edit, Trash2, Calendar, Clock, MoreVertical, Bell } from 'lucide-react';
import type { Task } from '@/types';
import { taskCategories, getTaskProgress, isTaskOverdue } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onToggleChecklistItem?: (taskId: number, itemId: number) => void;
}

const TaskCardComponent = ({ task, onToggleComplete, onEdit, onDelete, onToggleChecklistItem }: TaskCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUncompleting, setIsUncompleting] = useState(false);
  const [isDisappearing, setIsDisappearing] = useState(false);
  
  const categoryConfig = taskCategories[task.category];
  const progress = getTaskProgress(task);
  const overdue = isTaskOverdue(task);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleToggleComplete = async () => {
    if (!task.completed) {
      setIsCompleting(true);
      
      // Start disappearing animation after completion animation
      setTimeout(() => {
        setIsDisappearing(true);
      }, 400); // Reduced from 600ms
      
      // Call the toggle function after a brief delay to show the completion animation
      setTimeout(() => {
        onToggleComplete(task.id);
      }, 200); // Reduced from 300ms
      
      // Reset completing state after animation
      setTimeout(() => {
        setIsCompleting(false);
      }, 200); // Reduced from 300ms
    } else {
      setIsUncompleting(true);
      // Immediate optimistic update with animation
      onToggleComplete(task.id);
      // Reset uncompleting state after animation
      setTimeout(() => {
        setIsUncompleting(false);
      }, 200); // Reduced from 300ms
    }
  };

  const handleToggleChecklistItem = (itemId: number) => {
    if (onToggleChecklistItem) {
      onToggleChecklistItem(task.id, itemId);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ 
        opacity: isDisappearing ? 0 : 1, 
        y: isDisappearing ? -20 : 0,
        scale: isDisappearing ? 0.95 : 1
      }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ 
        duration: isDisappearing ? 0.3 : 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Card className={`hover:shadow-md hover:border-primary/50 transition-all duration-200 ${
        task.completed ? 'opacity-75' : ''
      } ${
        overdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''
      } ${
        isDisappearing ? 'pointer-events-none' : ''
      }`}>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Completion Checkbox */}
            <motion.div className="relative flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleComplete}
                disabled={isCompleting || isUncompleting}
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  task.completed 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground hover:border-primary'
                }`}
              >
                <AnimatePresence mode="wait">
                  {(isCompleting || task.completed) ? (
                    <motion.div
                      key="completed"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Button>
              
              {/* Simple success pulse animation */}
              <AnimatePresence>
                {isCompleting && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0 rounded-full bg-green-400/30 pointer-events-none"
                  />
                )}
              </AnimatePresence>
              
              {/* Simple unmark pulse animation */}
              <AnimatePresence>
                {isUncompleting && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute inset-0 rounded-full bg-blue-400/40 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Task Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="space-y-2">
                <CardTitle className={`text-base font-semibold leading-snug break-words ${
                  task.completed ? 'line-through text-muted-foreground' : ''
                }`}>
                  {task.title}
                </CardTitle>
                
                {task.description && (
                  <p className={`text-sm leading-relaxed break-words line-clamp-3 ${
                    task.completed ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}>
                    {task.description}
                  </p>
                )}
              </div>
                
              {/* Task Meta - Horizontal Layout */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Category */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full bg-${categoryConfig.color}-500`} />
                    <span className="text-sm text-muted-foreground font-medium">
                      {categoryConfig.displayName}
                    </span>
                  </div>
                  
                  {/* Due Date */}
                  <div className="flex items-center gap-3">
                    {task.dueDate && (
                      <div className={`flex items-center gap-1.5 ${
                        overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                      }`}>
                        {overdue ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}
                    
                    {task.reminderEnabled && (
                      <div className="flex items-center gap-1.5 text-primary">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Reminder
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress */}
                {task.checklist && task.checklist.length > 0 && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="relative flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              className="h-6 w-6 flex items-center justify-center shrink-0"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-8 z-10 bg-background border rounded-md shadow-lg py-1 min-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onEdit(task);
                    setShowActions(false);
                  }}
                  className="w-full justify-start px-3 py-1 h-auto"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                
                {task.checklist && task.checklist.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowChecklist(!showChecklist);
                      setShowActions(false);
                    }}
                    className="w-full justify-start px-3 py-1 h-auto"
                  >
                    <Check className="h-3 w-3 mr-2" />
                    {showChecklist ? 'Hide' : 'Show'} Checklist
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDelete(task.id);
                    setShowActions(false);
                  }}
                  className="w-full justify-start px-3 py-1 h-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Checklist */}
      {task.checklist && task.checklist.length > 0 && (showChecklist || task.checklist.some(item => !item.done)) && (
        <CardContent className="p-4 pt-0">
          <div className="space-y-2.5">
            {task.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleChecklistItem(item.id)}
                  className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                    item.done 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {item.done && <Check className="h-2.5 w-2.5" />}
                </Button>
                <span className={`text-sm flex-1 leading-relaxed ${
                  item.done ? 'line-through text-muted-foreground' : ''
                }`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      
      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
      </Card>
    </motion.div>
  );
};

const checklistEqual = (prev: Task['checklist'], next: Task['checklist']) => {
  if (prev === next) return true;
  if (!prev || !next) return prev === next;
  if (prev.length !== next.length) return false;
  
  return prev.every((item, index) => {
    const nextItem = next[index];
    return item.id === nextItem.id && 
           item.text === nextItem.text && 
           item.done === nextItem.done;
  });
};

export const TaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  // Only re-render if the task itself has changed
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.category === nextProps.task.category &&
    prevProps.task.reminderEnabled === nextProps.task.reminderEnabled &&
    prevProps.task.reminderDateTime === nextProps.task.reminderDateTime &&
    prevProps.task.reminderSent === nextProps.task.reminderSent &&
    checklistEqual(prevProps.task.checklist, nextProps.task.checklist)
  );
});

TaskCard.displayName = 'TaskCard';