import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Edit, Trash2, Calendar, Clock, MoreVertical, Sparkles } from 'lucide-react';
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
      // Immediate optimistic update with animation
      onToggleComplete(task.id);
      // Reset completing state after animation
      setTimeout(() => {
        setIsCompleting(false);
      }, 300);
    } else {
      setIsUncompleting(true);
      // Immediate optimistic update with animation
      onToggleComplete(task.id);
      // Reset uncompleting state after animation
      setTimeout(() => {
        setIsUncompleting(false);
      }, 300);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`hover:shadow-md hover:border-primary/50 transition-all duration-200 ${
        task.completed ? 'opacity-75' : ''
      } ${
        overdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''
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
                  {isCompleting ? (
                    <motion.div
                      key="completing"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                    </motion.div>
                  ) : task.completed ? (
                    <motion.div
                      key="completed"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </Button>
              
              {/* Success pulse animation */}
              <AnimatePresence>
                {isCompleting && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-green-400/60 pointer-events-none"
                  />
                )}
              </AnimatePresence>
              
              {/* Unmark pulse animation */}
              <AnimatePresence>
                {isUncompleting && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-blue-400/60 pointer-events-none"
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
    checklistEqual(prevProps.task.checklist, nextProps.task.checklist)
  );
});

TaskCard.displayName = 'TaskCard';