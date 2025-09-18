import { supabase } from './supabase';
import type { 
  Task, 
  TaskCategory, 
  ChecklistItem, 
  User, 
  Team, 
  TeamMember, 
  TeamInvite, 
  TeamRole, 
  TeamStatus, 
  TeamStats,
  CreateTeamData 
} from '@/types';

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
  reminder_enabled?: boolean;
  reminder_datetime?: string | null;
  reminder_sent?: boolean;
  team_id?: string | null;
  is_team_task?: boolean;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTeam {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  join_code: string;
  status: TeamStatus;
  max_members: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  invited_by?: string;
}

export interface DatabaseTeamInvite {
  id: string;
  team_id: string;
  invited_by: string;
  email?: string;
  join_code: string;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_at: string;
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
    reminderEnabled: dbTask.reminder_enabled ?? false,
    reminderDateTime: dbTask.reminder_datetime ?? null,
    reminderSent: dbTask.reminder_sent ?? false,
    team_id: dbTask.team_id ?? undefined,
    is_team_task: dbTask.is_team_task ?? false,
    assigned_to: dbTask.assigned_to ?? undefined,
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
    due_date: task.dueDate && task.dueDate.trim() !== '' ? task.dueDate : null,
    reminder_enabled: task.reminderEnabled ?? false,
    reminder_datetime: task.reminderDateTime && task.reminderDateTime.trim() !== '' ? task.reminderDateTime : null,
    reminder_sent: task.reminderSent ?? false,
    team_id: task.team_id ?? null,
    is_team_task: task.is_team_task ?? false,
    assigned_to: task.assigned_to ?? null,
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
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`);
      }

      if (!data) {
        throw new Error('No data returned from database insert');
      }

      const mappedTask = mapDatabaseTaskToTask(data);
      console.log('Mapped task result:', mappedTask);
      return mappedTask;
    } catch (error) {
      console.error('Error creating task:', error);
      // Re-throw the original error with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to create task: ${String(error)}`);
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
          ...(updates.dueDate !== undefined && { due_date: updates.dueDate && updates.dueDate.trim() !== '' ? updates.dueDate : null }),
          ...(updates.reminderEnabled !== undefined && { reminder_enabled: updates.reminderEnabled }),
          ...(updates.reminderDateTime !== undefined && { reminder_datetime: updates.reminderDateTime && updates.reminderDateTime.trim() !== '' ? updates.reminderDateTime : null }),
          ...(updates.reminderSent !== undefined && { reminder_sent: updates.reminderSent }),
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Team Management Operations
  static async createTeam(data: CreateTeamData, userId: string): Promise<Team> {
    try {
      console.log('Creating team with data:', { data, userId });
      
      // Validate input data
      if (!data.name || data.name.trim().length < 2) {
        throw new Error('Team name must be at least 2 characters long');
      }
      
      if (data.name.length > 100) {
        throw new Error('Team name must be less than 100 characters');
      }
      
      if (data.description && data.description.length > 500) {
        throw new Error('Team description must be less than 500 characters');
      }
      
      if (data.max_members && (data.max_members < 1 || data.max_members > 1000)) {
        throw new Error('Max members must be between 1 and 1000');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Generate a unique join code
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if user is a guest user (guest users don't exist in auth.users table)
      const isGuestUser = userId.startsWith('guest_');
      console.log('Is guest user:', isGuestUser);
      
      const teamData = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        join_code: joinCode,
        max_members: data.max_members || 10,
        created_by: isGuestUser ? null : userId,  // Set to null for guest users
        status: 'active' as TeamStatus,
      };
      
      console.log('Inserting team data:', teamData);
      
      const { data: team, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating team:', error);
        throw error;
      }

      console.log('Team created successfully:', team);
      
      // Add creator as owner (skip for guest users since they can't be in team_members table)
      if (!isGuestUser) {
        console.log('Adding creator as team owner:', { team_id: team.id, user_id: userId });
        
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: userId,
            role: 'owner' as TeamRole,
          });
          
        if (memberError) {
          console.error('Error adding team member:', memberError);
          // Try to clean up the team if member creation fails
          await supabase.from('teams').delete().eq('id', team.id);
          throw new Error(`Failed to add team member: ${memberError.message}`);
        }
        
        console.log('Team member added successfully');
      } else {
        console.log('Skipping team member creation for guest user');
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        avatar_url: team.avatar_url,
        join_code: team.join_code,
        status: team.status,
        max_members: team.max_members,
        created_by: team.created_by,
        created_at: team.created_at,
        updated_at: team.updated_at,
        member_count: 1,
        user_role: 'owner',
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  static async getTeamPreview(joinCode: string): Promise<Pick<Team, 'id' | 'name' | 'description' | 'member_count' | 'max_members' | 'created_at'> | null> {
    try {
      // Find team by join code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, description, max_members, created_at')
        .eq('join_code', joinCode)
        .eq('status', 'active')
        .single();

      if (teamError || !team) {
        return null;
      }

      // Get member count
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        member_count: memberCount || 0,
        max_members: team.max_members,
        created_at: team.created_at,
      };
    } catch (error) {
      console.error('Error getting team preview:', error);
      return null;
    }
  }

  static async joinTeam(joinCode: string, userId: string): Promise<Team> {
    try {
      // Find team by join code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('join_code', joinCode)
        .eq('status', 'active')
        .single();

      if (teamError || !team) {
        throw new Error('Invalid join code or team not found');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Check team capacity
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', team.id);

      if (memberCount && memberCount >= team.max_members) {
        throw new Error('Team is at maximum capacity');
      }

      // Add user to team
      await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'member' as TeamRole,
        });

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        avatar_url: team.avatar_url,
        join_code: team.join_code,
        status: team.status,
        max_members: team.max_members,
        created_by: team.created_by,
        created_at: team.created_at,
        updated_at: team.updated_at,
        member_count: (memberCount || 0) + 1,
        user_role: 'member',
      };
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  }

  static async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          role,
          teams!inner (
            id,
            name,
            description,
            avatar_url,
            join_code,
            status,
            max_members,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const teams: Team[] = [];
      for (const item of data || []) {
        const team = item.teams as any as DatabaseTeam;
        
        // Get member count
        const { count: memberCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);

        teams.push({
          id: team.id,
          name: team.name,
          description: team.description,
          avatar_url: team.avatar_url,
          join_code: team.join_code,
          status: team.status,
          max_members: team.max_members,
          created_by: team.created_by,
          created_at: team.created_at,
          updated_at: team.updated_at,
          member_count: memberCount || 0,
          user_role: item.role,
        });
      }

      return teams;
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw new Error('Failed to fetch teams');
    }
  }

  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          joined_at,
          invited_by,
          user_profiles!inner (
            id,
            name,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        invited_by: member.invited_by,
        user: {
          id: (member.user_profiles as any).id,
          name: (member.user_profiles as any).name,
          avatar: (member.user_profiles as any).avatar_url,
        },
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
  }

  static async leaveTeam(teamId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (member?.role === 'owner') {
        // Check if there are other members
        const { count: memberCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', teamId);

        if (memberCount && memberCount > 1) {
          throw new Error('Cannot leave team as owner. Transfer ownership or delete the team.');
        }
        
        // If owner is the only member, delete the team
        await this.deleteTeam(teamId, userId);
        return;
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving team:', error);
      throw error;
    }
  }

  static async updateTeam(teamId: string, updates: Partial<Team>, userId: string): Promise<void> {
    try {
      // Verify user has permission to update team
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new Error('Insufficient permissions to update team');
      }

      const { error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          description: updates.description,
          max_members: updates.max_members,
        })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  static async deleteTeam(teamId: string, userId: string): Promise<void> {
    try {
      // Verify user is owner
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!member || member.role !== 'owner') {
        throw new Error('Only team owners can delete teams');
      }

      // Delete team (cascade will handle members and invites)
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  static async updateMemberRole(teamId: string, targetUserId: string, newRole: TeamRole, userId: string): Promise<void> {
    try {
      // Verify user has permission
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new Error('Insufficient permissions to update member roles');
      }

      // Owners can't change their own role
      if (userId === targetUserId && member.role === 'owner') {
        throw new Error('Cannot change your own role as owner');
      }

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', targetUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  static async removeMember(teamId: string, targetUserId: string, userId: string): Promise<void> {
    try {
      // Verify user has permission
      const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!member || !['owner', 'admin'].includes(member.role)) {
        throw new Error('Insufficient permissions to remove members');
      }

      // Can't remove yourself as owner
      if (userId === targetUserId && member.role === 'owner') {
        throw new Error('Cannot remove yourself as owner');
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', targetUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  static async getTeamStats(teamId: string): Promise<TeamStats> {
    try {
      // Get member count
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      // Get task counts
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('completed', true);

      // Get pending invites
      const { count: pendingInvites } = await supabase
        .from('team_invites')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString());

      return {
        total_members: memberCount || 0,
        total_tasks: totalTasks || 0,
        completed_tasks: completedTasks || 0,
        pending_invites: pendingInvites || 0,
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      throw new Error('Failed to fetch team statistics');
    }
  }

  static async getTeamTasks(teamId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(mapDatabaseTaskToTask);
    } catch (error) {
      console.error('Error fetching team tasks:', error);
      throw new Error('Failed to fetch team tasks');
    }
  }

  static async createTeamTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, teamId: string, userId: string): Promise<Task> {
    try {
      const dbTask = {
        ...mapTaskToDatabaseTask(task, userId),
        team_id: teamId,
        is_team_task: true,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([dbTask])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating team task:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from team task creation');
      }

      return mapDatabaseTaskToTask(data);
    } catch (error) {
      console.error('Error creating team task:', error);
      throw new Error('Failed to create team task');
    }
  }
}