import { useState, useEffect, useCallback } from 'react';
import { useTasks, sortTasks, type SortOption } from '@/hooks/useTasks';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserPreferencesService } from '@/lib/userPreferences';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ViewSwitcher } from '@/components/ui/ViewSwitcher';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CategoryGroupedTasks } from '@/components/tasks/CategoryGroupedTasks';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Plus, CheckCircle, Clock, Calendar, Home, Trash2 } from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/magicui/animated-theme-toggler';
import { KeyboardHint } from '@/components/ui/keyboard-hint';
import Dock from '@/components/Dock';
import type { TaskView, Task } from '@/types';
import lightLogo from '@/assets/spaces-simplr-light.png';
import darkLogo from '@/assets/spaces-simplr.png';

export function TaskManager() {
  const { 
    tasks, 
    getTasksForView, 
    isLoading, 
    addTask, 
    updateTask, 
    deleteTask, 
    clearAllCompleted,
    toggleTaskComplete,
    updateChecklistItem 
  } = useTasks();
  const { resolvedTheme } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [currentView, setCurrentView] = useState<TaskView>('today');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const rawViewTasks = getTasksForView(currentView);
  const viewTasks = sortTasks(rawViewTasks, sortBy);

  // Helper function to determine if we should show category view
  // On mobile (sm and below), always use category view
  // On desktop, use user preference
  const shouldShowCategoryView = () => {
    return isMobile || groupByCategory;
  };

  // Handle mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640); // 640px is Tailwind's sm breakpoint
    };

    // Check on mount
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Load user preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const preferences = await UserPreferencesService.loadPreferences(user?.id);
        setGroupByCategory(preferences.viewMode === 'categories');
        setSortBy(preferences.sortBy);
        setPreferencesLoaded(true);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        setPreferencesLoaded(true);
      }
    };

    loadUserPreferences();
  }, [user?.id]);

  // Save view mode preference when it changes
  useEffect(() => {
    if (!preferencesLoaded) return;
    
    const saveViewPreference = async () => {
      try {
        await UserPreferencesService.updatePreference(
          'viewMode',
          groupByCategory ? 'categories' : 'grid',
          user?.id
        );
      } catch (error) {
        console.error('Failed to save view preference:', error);
      }
    };

    saveViewPreference();
  }, [groupByCategory, user?.id, preferencesLoaded]);

  // Save sort preference when it changes
  useEffect(() => {
    if (!preferencesLoaded) return;
    
    const saveSortPreference = async () => {
      try {
        await UserPreferencesService.updatePreference(
          'sortBy',
          sortBy,
          user?.id
        );
      } catch (error) {
        console.error('Failed to save sort preference:', error);
      }
    };

    saveSortPreference();
  }, [sortBy, user?.id, preferencesLoaded]);

  const handleAddTask = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // CMD+K (Mac) or Ctrl+K (Windows/Linux) to open task creation overlay
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleAddTask();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewChange = (view: TaskView) => {
    if (view === currentView) return;
    
    // Small delay to allow exit animation to start
    setTimeout(() => {
      setCurrentView(view);
    }, 50);
  };

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        showToast('Task updated successfully', 'success');
      } else {
        await addTask(taskData);
        showToast('Task created successfully', 'success');
      }
      setIsTaskModalOpen(false);
      setEditingTask(undefined);
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('Failed to save task', 'error');
    }
  };

  const handleDeleteTask = useCallback(async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      await deleteTask(id);
      showToast(`"${task.title}" deleted`, 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    }
  }, [tasks, deleteTask, showToast]);

  const handleToggleTaskComplete = useCallback(async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      await toggleTaskComplete(id);
      
      if (task.completed) {
        showToast(`"${task.title}" marked as incomplete`, 'success');
      } else {
        showToast(`"${task.title}" completed! 🎉`, 'success');
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      showToast('Failed to update task', 'error');
    }
  }, [tasks, toggleTaskComplete, showToast]);

  const handleToggleChecklistItem = useCallback(async (taskId: number, itemId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.checklist) return;
      
      const item = task.checklist.find(item => item.id === itemId);
      if (!item) return;
      
      await updateChecklistItem(taskId, itemId, { done: !item.done });
    } catch (error) {
      console.error('Error updating checklist item:', error);
      showToast('Failed to update checklist item', 'error');
    }
  }, [tasks, updateChecklistItem, showToast]);

  const handleClearAllCompleted = async () => {
    try {
      await clearAllCompleted();
      showToast('All completed tasks cleared', 'success');
      setShowClearAllDialog(false);
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
      showToast('Failed to clear completed tasks', 'error');
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'today': return 'Today';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
      default: return 'Tasks';
    }
  };

  const getViewStats = () => {
    const today = tasks.filter(task => !task.completed && (!task.dueDate || new Date(task.dueDate) <= new Date())).length;
    const total = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;
    return { today, total, completed };
  };

  const stats = getViewStats();

  return (
    <div className="flex flex-col min-h-screen bg-background view-background">
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b border-border/50 shadow-sm">
        <div className="w-full max-w-6xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2">
              {resolvedTheme === 'dark' ? (
                <img 
                  src={darkLogo} 
                  alt="Simplr" 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              ) : (
                <img 
                  src={lightLogo} 
                  alt="Simplr" 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              )}
              <Badge 
                variant="outline" 
                className="text-xs font-medium px-2 py-0.5 bg-transparent text-primary border-primary/30 hover:bg-primary/5"
              >
                Beta
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <KeyboardHint 
              keys={['cmd', 'k']} 
              label="Add Task"
              description="Press Cmd+K to open the task creation modal and quickly add a new task"
              variant="secondary"
              className="hidden sm:flex"
            />
            <AnimatedThemeToggler className="h-8 w-8 sm:h-9 sm:w-9 p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-accent hover:text-gray-700 dark:hover:text-accent-foreground rounded-md transition-colors [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenSettings}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all duration-200"
            >
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                {user?.avatar && (
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.name || 'User'}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs sm:text-sm font-semibold">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-1 flex flex-col pb-20 sm:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ 
              duration: 0.15, 
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            style={{ willChange: 'transform, opacity' }}
            className="flex-1 flex flex-col motion-safe"
            data-motion="true"
          >
            {(isLoading || viewTasks.length > 0) && (
              <motion.div 
                className="relative z-20 mb-6 motion-safe"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ willChange: 'transform, opacity' }}
                data-motion="true"
              >
                <div className="flex flex-col space-y-3 mb-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
                  <div className="flex-1">
                    <motion.h2 
                      className="text-xl sm:text-2xl font-bold motion-safe"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ willChange: 'transform, opacity' }}
                    >
                      {getViewTitle()}
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground text-xs sm:text-sm motion-safe mt-1"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ willChange: 'transform, opacity' }}
                    >
                      {currentView === 'today' && 'Focus on what matters today'}
                      {currentView === 'upcoming' && 'Plan ahead and stay organized'}
                      {currentView === 'completed' && 'See what you\'ve accomplished'}
                    </motion.p>
                  </div>
                  
                  {/* Mobile Stats - Compact Design */}
                  {stats && (
                    <motion.div 
                      className="flex items-center justify-between sm:justify-end bg-muted/30 rounded-lg px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0 motion-safe"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ willChange: 'transform, opacity' }}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">{stats.today}</span>
                          <span className="hidden sm:inline">today</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">{stats.total}</span>
                          <span className="hidden sm:inline">active</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="font-medium">{stats.completed}</span>
                          <span className="hidden sm:inline">done</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Controls Section - Optimized for Mobile */}
                <motion.div 
                  className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 motion-safe"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  {/* Hide ViewSwitcher on mobile, show only on desktop */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="hidden sm:block w-auto motion-safe"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <ViewSwitcher
                      value={groupByCategory ? "categories" : "grid"}
                      onValueChange={(value) => setGroupByCategory(value === 'categories')}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18, duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative z-10 w-full sm:w-auto motion-safe"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <SortDropdown
                      value={sortBy}
                      onValueChange={setSortBy}
                      disabled={viewTasks.length === 0}
                    />
                  </motion.div>
                  
                  {currentView === 'completed' && stats.completed > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClearAllDialog(true)}
                      className="text-xs w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/20 dark:hover:text-red-300 dark:hover:border-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </motion.div>
              </motion.div>
            )}

            <motion.div 
              className="space-y-4 flex-1 motion-safe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ willChange: 'transform, opacity' }}
              data-motion="true"
            >
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex space-x-2 motion-safe"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    {[0, 1, 2].map((index) => (
                      <motion.div
                        key={index}
                        className="w-3 h-3 bg-primary rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: index * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              ) : !isLoading && viewTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                  <h3 className="text-base font-medium text-muted-foreground mb-2">
                    {currentView === 'completed' 
                      ? 'No completed tasks yet' 
                      : currentView === 'today'
                      ? 'No tasks for today'
                      : 'No upcoming tasks'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground/70 mb-6 text-center max-w-xs">
                    {currentView === 'completed'
                      ? 'Complete some tasks to see them here'
                      : 'Create your first task to get started'
                    }
                  </p>
                  {currentView !== 'completed' && (
                    <Button 
                      onClick={handleAddTask}
                      variant="outline" 
                      size="sm"
                      className="text-muted-foreground hover:text-gray-700 dark:hover:text-foreground hover:bg-accent/10 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  )}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {shouldShowCategoryView() ? (
                    <motion.div
                      key="categories"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ 
                        duration: 0.16, 
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.05
                      }}
                    >
                      <CategoryGroupedTasks
                        tasks={viewTasks}
                        onToggleComplete={handleToggleTaskComplete}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onToggleChecklistItem={handleToggleChecklistItem}
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="grid"
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ 
                        duration: 0.16, 
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.05
                      }}
                    >
                      {viewTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 0.08 + (index * 0.02), 
                            duration: 0.18,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                        >
                          <TaskCard
                            task={task}
                            onToggleComplete={handleToggleTaskComplete}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onToggleChecklistItem={handleToggleChecklistItem}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div>
        <Dock
          items={[
            {
              icon: <Home className="h-6 w-6" />,
              label: "Today",
              onClick: () => handleViewChange('today')
            },
            {
              icon: <Calendar className="h-6 w-6" />,
              label: "Upcoming",
              onClick: () => handleViewChange('upcoming')
            },
            {
              icon: <CheckCircle className="h-6 w-6" />,
              label: "Completed",
              onClick: () => handleViewChange('completed')
            },
            {
              icon: <Plus className="h-6 w-6" />,
              label: "Add Task",
              onClick: handleAddTask,
              className: "bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            }
          ]}
        />
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      <AlertDialog open={showClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Completed Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all completed tasks? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearAllDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllCompleted} variant="destructive">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}