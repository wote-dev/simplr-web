import { useState, useEffect, useCallback, useOptimistic, useTransition } from 'react';
import type { Task, TaskCategory, TaskView, UseTasksReturn, ChecklistItem } from '@/types';
import { useStorage, storageKeys } from './useStorage';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/lib/database';

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: "Welcome to Simplr! 🎉",
    description: "This is your first task. Tap to mark it as complete!",
    category: "PERSONAL",
    completed: false,
    checklist: null,
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Explore the app features",
    description: "Get familiar with categories, due dates, and checklists",
    category: "LEARNING",
    completed: false,
    checklist: [
      { id: 1, text: "Try different categories", done: false },
      { id: 2, text: "Set a due date", done: false },
      { id: 3, text: "Create a checklist", done: false },
    ],
    dueDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state: Task[], optimisticTask: Task) => {
      // Handle optimistic updates for task operations
      const existingIndex = state.findIndex(t => t.id === optimisticTask.id);
      if (existingIndex >= 0) {
        // Update existing task
        const newState = [...state];
        newState[existingIndex] = optimisticTask;
        return newState;
      } else {
        // Add new task
        return [...state, optimisticTask];
      }
    }
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { saveData, loadData } = useStorage();
  const { user, isAuthenticated, authType } = useAuth();
  
  // Determine if we should use Supabase (authenticated non-guest users)
  const useSupabase = isAuthenticated && authType !== 'guest' && user?.id;
  
  // Debug authentication state
  console.log('Auth state:', { isAuthenticated, authType, userId: user?.id, useSupabase });

  // Update current time periodically to handle completed task filtering
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100); // Update every 100ms for smooth transitions
    
    return () => clearInterval(interval);
  }, []);

  // Load tasks from storage on mount and when auth state changes
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setError(null);
        setIsSyncing(true);
        
        if (useSupabase && user?.id) {
          // Load from Supabase for authenticated users
          try {
            const supabaseTasks = await DatabaseService.getUserTasks(user.id);
            
            if (supabaseTasks.length > 0) {
              setTasks(supabaseTasks);
              // Also save to localStorage as backup
              await saveData(storageKeys.TASKS, supabaseTasks);
            } else {
              // Check if we have local tasks to sync
              const localTasks = loadData<Task[]>(storageKeys.TASKS);
              if (localTasks && localTasks.length > 0) {
                // Sync local tasks to Supabase
                const syncedTasks = await DatabaseService.syncLocalTasksToDatabase(localTasks, user.id);
                setTasks(syncedTasks);
                await saveData(storageKeys.TASKS, syncedTasks);
              } else {
                // Initialize with default tasks
                const initialTasks = await Promise.all(
                  INITIAL_TASKS.map(async (task) => {
                    const { id, createdAt, updatedAt, ...taskData } = task;
                    return await DatabaseService.createTask(taskData, user.id);
                  })
                );
                setTasks(initialTasks);
                await saveData(storageKeys.TASKS, initialTasks);
              }
            }
          } catch (supabaseError) {
            console.warn('Supabase unavailable, falling back to localStorage:', supabaseError);
            // Fall back to localStorage if Supabase fails
            const localTasks = loadData<Task[]>(storageKeys.TASKS);
            if (localTasks && localTasks.length > 0) {
              setTasks(localTasks);
            } else {
              setTasks(INITIAL_TASKS);
              await saveData(storageKeys.TASKS, INITIAL_TASKS);
            }
          }
        } else {
          // Use localStorage for guest users or when not authenticated
          const storedTasks = loadData<Task[]>(storageKeys.TASKS);
          
          if (storedTasks && Array.isArray(storedTasks) && storedTasks.length > 0) {
            setTasks(storedTasks);
          } else {
            // Initialize with default tasks for new users
            setTasks(INITIAL_TASKS);
            await saveData(storageKeys.TASKS, INITIAL_TASKS);
          }
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setError('Failed to load tasks');
        setTasks(INITIAL_TASKS);
      } finally {
        setIsSyncing(false);
      }
    };

    loadTasks();
  }, [loadData, saveData, useSupabase, user?.id]);

  // Save tasks to storage whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      saveData(storageKeys.TASKS, tasks).catch(err => {
        console.error('Failed to save tasks:', err);
        setError('Failed to save tasks');
      });
    }
  }, [tasks, saveData]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      setError(null);
      console.log('Adding task:', { taskData, useSupabase, userId: user?.id });
      
      if (useSupabase && user?.id) {
        console.log('Creating task in Supabase...');
        // Create task in Supabase
        const newTask = await DatabaseService.createTask(taskData, user.id);
        console.log('Task created in Supabase:', newTask);
        
        // Optimistic update
        addOptimisticTask(newTask);
        
        startTransition(() => {
          setTasks(prev => {
            console.log('Updating tasks state with new task:', newTask);
            return [...prev, newTask];
          });
        });
      } else {
        console.log('Creating task locally...');
        // Create task locally
        const newTask: Task = {
          ...taskData,
          id: Date.now(), // Simple ID generation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log('Task created locally:', newTask);

        // Optimistic update
        addOptimisticTask(newTask);

        startTransition(() => {
          setTasks(prev => {
            console.log('Updating tasks state with new task:', newTask);
            return [...prev, newTask];
          });
        });
      }
    } catch (err) {
      console.error('Failed to add task:', err);
      setError('Failed to add task');
      throw err;
    }
  }, [addOptimisticTask, useSupabase, user?.id]);

  const updateTask = useCallback(async (id: number, updates: Partial<Task>): Promise<void> => {
    try {
      setError(null);
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      if (useSupabase && user?.id) {
        // Update task in Supabase
        const updatedTask = await DatabaseService.updateTask(id, updates, user.id);
        
        // Optimistic update
        addOptimisticTask(updatedTask);

        startTransition(() => {
          setTasks(prev => {
            const newTasks = [...prev];
            const index = newTasks.findIndex(t => t.id === id);
            if (index !== -1) {
              newTasks[index] = updatedTask;
            }
            return newTasks;
          });
        });
      } else {
        // Update task locally
        const updatedTask: Task = {
          ...tasks[taskIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        addOptimisticTask(updatedTask);

        startTransition(() => {
          setTasks(prev => {
            const newTasks = [...prev];
            newTasks[taskIndex] = updatedTask;
            return newTasks;
          });
        });
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task');
      throw err;
    }
  }, [tasks, addOptimisticTask, useSupabase, user?.id]);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      
      if (useSupabase && user?.id) {
        // Delete task from Supabase
        await DatabaseService.deleteTask(id, user.id);
      }
      
      // Update local state
      startTransition(() => {
        setTasks(prev => prev.filter(task => task.id !== id));
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task');
      throw err;
    }
  }, [useSupabase, user?.id]);

  const clearAllCompleted = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      if (useSupabase && user?.id) {
        // Delete completed tasks from Supabase
        await DatabaseService.deleteCompletedTasks(user.id);
      }
      
      // Update local state
      startTransition(() => {
        setTasks(prev => prev.filter(task => !task.completed));
      });
    } catch (err) {
      console.error('Failed to clear completed tasks:', err);
      setError('Failed to clear completed tasks');
      throw err;
    }
  }, [useSupabase, user?.id]);

  const toggleTaskComplete = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      const task = optimisticTasks.find(t => t.id === id);
      if (!task) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...task,
        completed: !task.completed,
        updatedAt: new Date().toISOString(),
      };

      // Immediate optimistic update
      addOptimisticTask(updatedTask);

      if (useSupabase && user?.id) {
        // Update task completion status in Supabase
        const dbUpdatedTask = await DatabaseService.updateTask(id, { completed: updatedTask.completed }, user.id);
        
        // Update with the response from database to ensure consistency
        addOptimisticTask(dbUpdatedTask);
        
        startTransition(() => {
          setTasks(prev => {
            const newTasks = prev.map(t => 
              t.id === id ? dbUpdatedTask : t
            );
            return newTasks;
          });
        });
      } else {
        // Update local state only for guest users
        startTransition(() => {
          setTasks(prev => {
            const newTasks = prev.map(t => 
              t.id === id ? updatedTask : t
            );
            return newTasks;
          });
        });
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      setError('Failed to update task');
      // Revert optimistic update on error
      const originalTask = tasks.find(t => t.id === id);
      if (originalTask) {
        addOptimisticTask(originalTask);
      }
      throw error;
    }
  }, [optimisticTasks, addOptimisticTask, startTransition, useSupabase, user?.id, tasks]);

  const getTasksForView = useCallback((view: TaskView): Task[] => {
    const now = new Date(currentTime);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (view) {
      case 'today':
        return optimisticTasks.filter(task => {
          // Don't show completed tasks in today view
          if (task.completed) return false;
          
          // Include tasks without due dates (they should appear in today)
          if (!task.dueDate) return true;
          
          const dueDate = new Date(task.dueDate);
          // Include today's tasks and overdue tasks
          return dueDate <= today;
        });
      
      case 'upcoming':
        return optimisticTasks.filter(task => {
          // Don't show completed tasks in upcoming view
          if (task.completed) return false;
          
          // Only include tasks with future due dates (tasks without due dates now go to 'today')
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          return dueDate >= tomorrow;
        });
      
      case 'completed':
        return optimisticTasks.filter(task => task.completed);
      
      default:
        return optimisticTasks.filter(task => !task.completed);
    }
  }, [optimisticTasks, currentTime]);

  const updateChecklistItem = useCallback(async (taskId: number, itemId: number, updates: Partial<ChecklistItem>) => {
    try {
      setError(null);
      const task = optimisticTasks.find(t => t.id === taskId);
      if (!task || !task.checklist) return;

      const updatedChecklist = task.checklist.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );

      const updatedTask = {
        ...task,
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString()
      };

      // Apply optimistic update immediately
      addOptimisticTask(updatedTask);

      if (useSupabase && user?.id) {
        // Update task checklist in Supabase
        const dbUpdatedTask = await DatabaseService.updateTask(taskId, { checklist: updatedChecklist }, user.id);
        
        // Update with the response from database to ensure consistency
        addOptimisticTask(dbUpdatedTask);
        
        startTransition(() => {
          setTasks(prev => {
            const newTasks = prev.map(t => 
              t.id === taskId ? dbUpdatedTask : t
            );
            return newTasks;
          });
        });
      } else {
        // Update local state only for guest users
        startTransition(async () => {
          try {
            const currentTasks = loadData<Task[]>(storageKeys.TASKS) || tasks;
            const updatedTasks = currentTasks.map(t => 
              t.id === taskId ? updatedTask : t
            );
            await saveData(storageKeys.TASKS, updatedTasks);
            setTasks(updatedTasks);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update checklist item');
            // Revert optimistic update on error by reloading tasks
            const storedTasks = loadData<Task[]>(storageKeys.TASKS);
            if (storedTasks) {
              setTasks(storedTasks);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      setError('Failed to update checklist item');
      // Revert optimistic update on error
      const originalTask = tasks.find(t => t.id === taskId);
      if (originalTask) {
        addOptimisticTask(originalTask);
      }
      throw error;
    }
  }, [optimisticTasks, saveData, startTransition, addOptimisticTask, loadData, useSupabase, user?.id, tasks]);

  return {
    tasks: optimisticTasks,
    addTask,
    updateTask,
    deleteTask,
    clearAllCompleted,
    toggleTaskComplete,
    updateChecklistItem,
    getTasksForView,
    isLoading: false, // Remove loading state that was causing UI flicker
    isSyncing,
    error,
  };
}

// Utility functions for task management
export const taskCategories: Record<TaskCategory, { color: string; displayName: string; priority: number }> = {
  URGENT: { color: 'red', displayName: 'Urgent', priority: 1 },
  IMPORTANT: { color: 'orange', displayName: 'Important', priority: 2 },
  WORK: { color: 'blue', displayName: 'Work', priority: 3 },
  PERSONAL: { color: 'green', displayName: 'Personal', priority: 4 },
  HEALTH: { color: 'red', displayName: 'Health', priority: 5 },
  LEARNING: { color: 'pink', displayName: 'Learning', priority: 6 },
  SHOPPING: { color: 'cyan', displayName: 'Shopping', priority: 7 },
  TRAVEL: { color: 'purple', displayName: 'Travel', priority: 8 },
};

export function getTaskProgress(task: Task): { completed: number; total: number; percentage: number } {
  if (!task.checklist || task.checklist.length === 0) {
    return {
      completed: task.completed ? 1 : 0,
      total: 1,
      percentage: task.completed ? 100 : 0,
    };
  }

  const completed = task.checklist.filter(item => item.done).length;
  const total = task.checklist.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false;
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  return dueDate < now;
}

export function getTasksByCategory(tasks: Task[]): Record<TaskCategory, Task[]> {
  const categorized = {} as Record<TaskCategory, Task[]>;
  
  // Initialize all categories
  Object.keys(taskCategories).forEach(category => {
    categorized[category as TaskCategory] = [];
  });
  
  // Group tasks by category
  tasks.forEach(task => {
    categorized[task.category].push(task);
  });
  
  return categorized;
}