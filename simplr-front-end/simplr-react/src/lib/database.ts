import { supabase } from './supabase';
import type { Task, TaskCategory, ChecklistItem, User } from '@/types';

// Database types that match Supabase schema
export interface DatabaseTask {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  completed: boolean;
  checklist?: ChecklistItem[] | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Convert database task to app task format
function mapDatabaseTaskToTask(dbTask: DatabaseTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    category: dbTask.category,
    completed: dbTask.completed,
    checklist: dbTask.checklist ?? null,
    dueDate: dbTask.due_date ?? null,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}

// Convert app task to database task format
function mapTaskToDatabaseTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<DatabaseTask, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    title: task.title,
    description: task.description,
    category: task.category,
    completed: task.completed,
    checklist: task.checklist,
    due_date: task.dueDate,
  };
}

export class DatabaseService {
  // User Profile Operations
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          return null;
        }
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        email: undefined, // Email comes from auth.users
        avatar: data.avatar_url,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  static async createUserProfile(user: User): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: user.name,
          avatar_url: user.avatar,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<Pick<User, 'name' | 'avatar'>>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.avatar && { avatar_url: updates.avatar }),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Task Operations
  static async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(mapDatabaseTaskToTask);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  static async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Task> {
    try {
      console.log('DatabaseService.createTask called with:', { task, userId });
      const dbTask = mapTaskToDatabaseTask(task, userId);
      console.log('Mapped database task:', dbTask);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(dbTask)
        .select()
        .single();

      console.log('Supabase insert result:', { data, error });
      if (error) throw error;

      const mappedTask = mapDatabaseTaskToTask(data);
      console.log('Mapped task result:', mappedTask);
      return mappedTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  static async updateTask(taskId: number, updates: Partial<Task>, userId: string): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.category && { category: updates.category }),
          ...(updates.completed !== undefined && { completed: updates.completed }),
          ...(updates.checklist !== undefined && { checklist: updates.checklist }),
          ...(updates.dueDate !== undefined && { due_date: updates.dueDate }),
        })
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return mapDatabaseTaskToTask(data);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  static async deleteTask(taskId: number, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  static async deleteCompletedTasks(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting completed tasks:', error);
      throw new Error('Failed to delete completed tasks');
    }
  }

  // Sync Operations
  static async syncLocalTasksToDatabase(localTasks: Task[], userId: string): Promise<Task[]> {
    try {
      // Get existing tasks from database
      const existingTasks = await this.getUserTasks(userId);
      const existingTaskIds = new Set(existingTasks.map(t => t.id));
      
      // Separate local tasks into new and existing
      const newTasks = localTasks.filter(task => !existingTaskIds.has(task.id));
      const updatedTasks = localTasks.filter(task => existingTaskIds.has(task.id));
      
      // Create new tasks
      const createdTasks: Task[] = [];
      for (const task of newTasks) {
        const { id, createdAt, updatedAt, ...taskData } = task;
        const createdTask = await this.createTask(taskData, userId);
        createdTasks.push(createdTask);
      }
      
      // Update existing tasks
      const syncedTasks: Task[] = [];
      for (const task of updatedTasks) {
        const existingTask = existingTasks.find(t => t.id === task.id);
        if (existingTask && new Date(task.updatedAt || 0) > new Date(existingTask.updatedAt || 0)) {
          const updatedTask = await this.updateTask(task.id, task, userId);
          syncedTasks.push(updatedTask);
        } else {
          syncedTasks.push(existingTask!);
        }
      }
      
      return [...createdTasks, ...syncedTasks, ...existingTasks.filter(t => !localTasks.some(lt => lt.id === t.id))];
    } catch (error) {
      console.error('Error syncing tasks:', error);
      throw new Error('Failed to sync tasks');
    }
  }

  // Backup Operations
  static async createBackup(userId: string): Promise<{ tasks: Task[]; profile: User | null; timestamp: string }> {
    try {
      const [tasks, profile] = await Promise.all([
        this.getUserTasks(userId),
        this.getUserProfile(userId)
      ]);

      return {
        tasks,
        profile,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  static async restoreFromBackup(backup: { tasks: Task[]; profile?: User }, userId: string): Promise<void> {
    try {
      // Clear existing tasks
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Restore tasks
      for (const task of backup.tasks) {
        const { id, createdAt, updatedAt, ...taskData } = task;
        await this.createTask(taskData, userId);
      }

      // Update profile if provided
      if (backup.profile) {
        await this.updateUserProfile(userId, {
          name: backup.profile.name,
          avatar: backup.profile.avatar,
        });
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  // Real-time subscriptions
  static subscribeToUserTasks(userId: string, callback: (tasks: Task[]) => void) {
    const subscription = supabase
      .channel('user-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Refetch tasks when changes occur
          try {
            const tasks = await this.getUserTasks(userId);
            callback(tasks);
          } catch (error) {
            console.error('Error in task subscription:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}