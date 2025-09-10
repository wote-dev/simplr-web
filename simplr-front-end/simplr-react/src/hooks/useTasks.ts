import { useState, useEffect, useCallback, useOptimistic, useTransition, useRef } from 'react';
import type { Task, TaskCategory, TaskView, UseTasksReturn, ChecklistItem } from '@/types';
import { useStorage, storageKeys } from './useStorage';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { scheduleReminder } from '@/lib/notifications';

// Helper function to safely map database row to Task
function mapDatabaseRowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as number,
    title: row.title as string,
    description: (row.description as string) || '',
    category: row.category as TaskCategory,
    completed: row.completed as boolean,
    checklist: (row.checklist as ChecklistItem[]) || null,
    dueDate: (row.due_date as string) || null,
    reminderEnabled: (row.reminder_enabled as boolean) ?? false,
    reminderDateTime: (row.reminder_datetime as string) || null,
    reminderSent: (row.reminder_sent as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Helper function to handle reminder scheduling
function handleReminderScheduling(task: Task) {
  if (task.reminderEnabled && task.reminderDateTime && !task.reminderSent) {
    const reminderTime = new Date(task.reminderDateTime);
    if (reminderTime > new Date()) {
      const timeoutId = scheduleReminder(task);
      if (timeoutId) {
        // Store the timeout ID for later cancellation if needed
        // This could be enhanced with a reminder management system
      }
    }
  }
  // Note: Canceling reminders would require tracking timeout IDs
  // This could be enhanced with a proper reminder management system
}

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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
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
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Reconnection function with exponential backoff
  const attemptReconnection = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      setConnectionStatus('error');
      setError('Unable to establish real-time connection');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30s
    console.log(`🔄 Scheduling reconnection attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      setConnectionStatus('connecting');
      
      // Clean up existing subscription
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      // Trigger re-subscription by updating a dependency
      // This will cause the useEffect to run again
    }, delay);
  }, []);

  // Clear reconnection timeout on cleanup
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  // Set up real-time subscriptions for authenticated users
  useEffect(() => {
    if (!useSupabase || !user?.id) {
      // Clean up any existing subscription for guest users
      if (channelRef.current) {
        console.log('Cleaning up real-time subscription for guest user');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setConnectionStatus('disconnected');
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      return;
    }

    // Clean up existing subscription before creating a new one
    if (channelRef.current) {
      console.log('Cleaning up existing real-time subscription');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    // Set connecting status
    setConnectionStatus('connecting');

    // Create a unique channel name for this user session
    const channelName = `user-tasks-${user.id}-${Date.now()}`;
    console.log('Setting up real-time subscription:', channelName);

    // Set up real-time subscription for tasks
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time task change received:', payload.eventType, payload);
          
          try {
            switch (payload.eventType) {
              case 'INSERT': {
                const newTask = payload.new as Record<string, unknown>;
                const mappedTask = mapDatabaseRowToTask(newTask);
                
                startTransition(() => {
                  setTasks(prev => {
                    // Check if task already exists to avoid duplicates
                    const exists = prev.some(t => t.id === mappedTask.id);
                    if (!exists) {
                      console.log('Adding new task from real-time:', mappedTask.id, mappedTask.title);
                      return [mappedTask, ...prev]; // Add to beginning for better UX
                    }
                    console.log('Task already exists, skipping duplicate:', mappedTask.id);
                    return prev;
                  });
                });
                break;
              }
              
              case 'UPDATE': {
                const updatedTask = payload.new as Record<string, unknown>;
                const mappedTask = mapDatabaseRowToTask(updatedTask);
                
                startTransition(() => {
                  setTasks(prev => {
                    const index = prev.findIndex(t => t.id === mappedTask.id);
                    if (index !== -1) {
                      console.log('Updating task from real-time:', mappedTask.id, mappedTask.title);
                      const newTasks = [...prev];
                      newTasks[index] = mappedTask;
                      return newTasks;
                    }
                    console.log('Task not found for update, adding it:', mappedTask.id);
                    return [mappedTask, ...prev];
                  });
                });
                break;
              }
              
              case 'DELETE': {
                const deletedTask = payload.old as Record<string, unknown>;
                const taskId = deletedTask.id as number;
                
                startTransition(() => {
                  setTasks(prev => {
                    const filtered = prev.filter(t => t.id !== taskId);
                    console.log('Deleting task from real-time:', taskId, 'Remaining tasks:', filtered.length);
                    return filtered;
                  });
                });
                break;
              }
            }
          } catch (error) {
            console.error('Error handling real-time task change:', error, payload);
            // Log the error but don't break the subscription for individual payload errors
            // This could be due to malformed data from a single event
            setError(`Failed to process real-time update: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Clear the error after a short delay to not permanently show it
            setTimeout(() => {
              setError(null);
            }, 5000);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status changed:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time task changes');
          setConnectionStatus('connected');
          setError(null);
          // Reset reconnection attempts on successful connection
          reconnectAttemptsRef.current = 0;
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
          setConnectionStatus('error');
          setError('Real-time sync temporarily unavailable');
          attemptReconnection();
        } else if (status === 'CLOSED') {
          console.log('🔌 Real-time subscription closed');
          setConnectionStatus('disconnected');
          if (useSupabase && user?.id) {
            // Only attempt reconnection if we should be connected
            attemptReconnection();
          }
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Real-time subscription timed out');
          setConnectionStatus('error');
          setError('Connection timeout - retrying...');
          attemptReconnection();
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up real-time subscription on unmount');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setConnectionStatus('disconnected');
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
    };
  }, [useSupabase, user?.id, startTransition, attemptReconnection]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      setError(null);
      console.log('Adding task:', { taskData, useSupabase, userId: user?.id });
      
      if (useSupabase && user?.id) {
        console.log('Creating task in Supabase...');
        // Create task in Supabase
        const newTask = await DatabaseService.createTask(taskData, user.id);
        console.log('Task created in Supabase:', newTask);
        
        // Schedule reminder if enabled
        handleReminderScheduling(newTask);
        
        // Update tasks state immediately - the real-time subscription will handle duplicates
        startTransition(() => {
          setTasks(prev => {
            console.log('Previous tasks before adding:', prev.length);
            // Check if task already exists to avoid duplicates
            const exists = prev.some(t => t.id === newTask.id);
            if (!exists) {
              console.log('Adding new task to state:', newTask);
              const updatedTasks = [newTask, ...prev]; // Add to beginning for better UX
              console.log('Tasks after adding new task:', updatedTasks.length, updatedTasks);
              return updatedTasks;
            }
            console.log('Task already exists in state, skipping:', newTask.id);
            return prev;
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

        // Schedule reminder if enabled
        handleReminderScheduling(newTask);

        // Update tasks state immediately
        startTransition(() => {
          setTasks(prev => {
            console.log('Previous tasks before adding (local):', prev.length);
            console.log('Adding new task to local state:', newTask);
            const updatedTasks = [newTask, ...prev]; // Add to beginning for better UX
            console.log('Tasks after adding new task (local):', updatedTasks.length, updatedTasks);
            return updatedTasks;
          });
        });
      }
    } catch (err) {
      console.error('Failed to add task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to save task. Please check your connection.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        setError('Authentication error: Please sign in again.');
      } else {
        setError(`Failed to add task: ${errorMessage}`);
      }
      
      // Clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
      throw err;
    }
  }, [useSupabase, user?.id, startTransition]);

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
        
        // Handle reminder scheduling for updated task
        handleReminderScheduling(updatedTask);
        
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

        // Handle reminder scheduling for updated task
        handleReminderScheduling(updatedTask);

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to update task. Please check your connection.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        setError('Authentication error: Please sign in again.');
      } else if (errorMessage.includes('not found')) {
        setError('Task not found. It may have been deleted.');
      } else {
        setError(`Failed to update task: ${errorMessage}`);
      }
      
      // Clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to delete task. Please check your connection.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        setError('Authentication error: Please sign in again.');
      } else if (errorMessage.includes('not found')) {
        setError('Task not found. It may have already been deleted.');
      } else {
        setError(`Failed to delete task: ${errorMessage}`);
      }
      
      // Clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to clear completed tasks. Please check your connection.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        setError('Authentication error: Please sign in again.');
      } else {
        setError(`Failed to clear completed tasks: ${errorMessage}`);
      }
      
      // Clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to update task. Please check your connection.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        setError('Authentication error: Please sign in again.');
      } else if (errorMessage.includes('not found')) {
        setError('Task not found. It may have been deleted.');
      } else {
        setError(`Failed to update task: ${errorMessage}`);
      }
      
      // Revert optimistic update on error
      const originalTask = tasks.find(t => t.id === id);
      if (originalTask) {
        addOptimisticTask(originalTask);
      }
      
      // Clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
      throw error;
    }
  }, [optimisticTasks, addOptimisticTask, startTransition, useSupabase, user?.id, tasks]);

  const getTasksForView = useCallback((view: TaskView): Task[] => {
    const now = new Date(currentTime);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('getTasksForView called:', { view, totalTasks: optimisticTasks.length, optimisticTasks });

    switch (view) {
      case 'today':
        const todayTasks = optimisticTasks.filter(task => {
          // Don't show completed tasks in today view
          if (task.completed) return false;
          
          // Include tasks without due dates (they should appear in today)
          if (!task.dueDate) return true;
          
          const dueDate = new Date(task.dueDate);
          // Include today's tasks and overdue tasks
          return dueDate <= today;
        });
        console.log('Today tasks filtered:', todayTasks);
        return todayTasks;
      
      case 'upcoming':
        const upcomingTasks = optimisticTasks.filter(task => {
          // Don't show completed tasks in upcoming view
          if (task.completed) return false;
          
          // Only include tasks with future due dates (tasks without due dates now go to 'today')
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          return dueDate >= tomorrow;
        });
        console.log('Upcoming tasks filtered:', upcomingTasks);
        return upcomingTasks;
      
      case 'completed':
        const completedTasks = optimisticTasks.filter(task => task.completed);
        console.log('Completed tasks filtered:', completedTasks);
        return completedTasks;
      
      default:
        const defaultTasks = optimisticTasks.filter(task => !task.completed);
        console.log('Default tasks filtered:', defaultTasks);
        return defaultTasks;
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to update checklist item. Please check your connection.');
      } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        setError('Authentication error: Please sign in again.');
      } else if (errorMessage.includes('not found')) {
        setError('Task or checklist item not found.');
      } else {
        setError(`Failed to update checklist item: ${errorMessage}`);
      }
      
      // Clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
      
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
    connectionStatus,
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

export type SortOption = 'latest' | 'oldest' | 'dueDate' | 'alphabetical';

export function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  const tasksCopy = [...tasks];
  
  switch (sortBy) {
    case 'latest':
      return tasksCopy.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
    
    case 'oldest':
      return tasksCopy.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });
    
    case 'dueDate':
      return tasksCopy.sort((a, b) => {
        // Tasks without due dates go to the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime(); // Earliest due date first
      });
    
    case 'alphabetical':
      return tasksCopy.sort((a, b) => {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      });
    
    default:
      return tasksCopy;
  }
}