import { useState, useEffect, useCallback, useOptimistic, useTransition } from 'react';
import type { Task, TaskCategory, TaskView, UseTasksReturn, ChecklistItem } from '@/types';
import { useStorage, storageKeys } from './useStorage';

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
  
  const { saveData, loadData } = useStorage();

  // Update current time periodically to handle completed task filtering
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100); // Update every 100ms for smooth transitions
    
    return () => clearInterval(interval);
  }, []);

  // Load tasks from storage on mount
  useEffect(() => {
    const loadTasks = () => {
      try {
        setError(null);
        const storedTasks = loadData<Task[]>(storageKeys.TASKS);
        
        if (storedTasks && Array.isArray(storedTasks) && storedTasks.length > 0) {
          setTasks(storedTasks);
        } else {
          // Initialize with default tasks for new users
          setTasks(INITIAL_TASKS);
          saveData(storageKeys.TASKS, INITIAL_TASKS);
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setError('Failed to load tasks');
        setTasks(INITIAL_TASKS);
      }
    };

    loadTasks();
  }, [loadData, saveData]);

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
    const newTask: Task = {
      ...taskData,
      id: Date.now(), // Simple ID generation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    addOptimisticTask(newTask);

    startTransition(() => {
      setTasks(prev => [...prev, newTask]);
    });
  }, [addOptimisticTask]);

  const updateTask = useCallback(async (id: number, updates: Partial<Task>): Promise<void> => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

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
  }, [tasks, addOptimisticTask]);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    startTransition(() => {
      setTasks(prev => prev.filter(t => t.id !== id));
    });
  }, []);

  const clearAllCompleted = useCallback(async (): Promise<void> => {
    startTransition(() => {
      setTasks(prev => prev.filter(t => !t.completed));
    });
  }, []);

  const toggleTaskComplete = useCallback(async (id: number): Promise<void> => {
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

    // Then update the actual state
    startTransition(async () => {
      try {
        setTasks(prev => {
          const newTasks = prev.map(t => 
            t.id === id ? updatedTask : t
          );
          return newTasks;
        });
      } catch (error) {
        // Revert optimistic update on error
        addOptimisticTask(task);
        throw error;
      }
    });
  }, [optimisticTasks, addOptimisticTask, startTransition]);

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

  const updateChecklistItem = useCallback((taskId: number, itemId: number, updates: Partial<ChecklistItem>) => {
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

    // Then persist to storage
    startTransition(async () => {
      try {
        const currentTasks = loadData<Task[]>(storageKeys.TASKS) || tasks;
        const updatedTasks = currentTasks.map(t => 
          t.id === taskId ? updatedTask : t
        );
        await saveData(storageKeys.TASKS, updatedTasks);
        // Only update base state after successful save to sync with storage
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
  }, [optimisticTasks, saveData, startTransition, addOptimisticTask, loadData]);

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