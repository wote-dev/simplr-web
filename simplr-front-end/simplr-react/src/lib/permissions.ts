import type { TeamRole, TeamMember, Team, Task } from '@/types';

/**
 * Permission utilities for role-based access control
 */

export interface PermissionContext {
  currentUserRole?: TeamRole;
  currentUserId?: string;
  team?: Team;
  teamMembers?: TeamMember[];
}

/**
 * Team-level permissions
 */
export const TeamPermissions = {
  // Team management
  canUpdateTeam: (context: PermissionContext): boolean => {
    return context.currentUserRole === 'owner' || context.currentUserRole === 'admin';
  },

  canDeleteTeam: (context: PermissionContext): boolean => {
    return context.currentUserRole === 'owner';
  },

  canManageSettings: (context: PermissionContext): boolean => {
    return context.currentUserRole === 'owner' || context.currentUserRole === 'admin';
  },

  // Member management
  canInviteMembers: (context: PermissionContext): boolean => {
    return context.currentUserRole === 'owner' || context.currentUserRole === 'admin';
  },

  canRemoveMembers: (context: PermissionContext): boolean => {
    return context.currentUserRole === 'owner' || context.currentUserRole === 'admin';
  },

  canUpdateMemberRoles: (context: PermissionContext): boolean => {
    return context.currentUserRole === 'owner' || context.currentUserRole === 'admin';
  },

  canRemoveSpecificMember: (context: PermissionContext, targetUserId: string): boolean => {
    if (!TeamPermissions.canRemoveMembers(context)) return false;
    
    // Can't remove yourself as owner
    if (context.currentUserId === targetUserId && context.currentUserRole === 'owner') {
      return false;
    }

    // Admins can't remove owners
    if (context.currentUserRole === 'admin') {
      const targetMember = context.teamMembers?.find(m => m.user_id === targetUserId);
      if (targetMember?.role === 'owner') return false;
    }

    return true;
  },

  canUpdateSpecificMemberRole: (context: PermissionContext, targetUserId: string, newRole: TeamRole): boolean => {
    if (!TeamPermissions.canUpdateMemberRoles(context)) return false;
    
    // Can't change your own role as owner
    if (context.currentUserId === targetUserId && context.currentUserRole === 'owner') {
      return false;
    }

    // Admins can't promote to owner or modify owners
    if (context.currentUserRole === 'admin') {
      const targetMember = context.teamMembers?.find(m => m.user_id === targetUserId);
      if (targetMember?.role === 'owner' || newRole === 'owner') return false;
    }

    return true;
  },

  // Team access
  canViewTeam: (context: PermissionContext): boolean => {
    return !!context.currentUserRole; // Any team member can view
  },

  canLeaveTeam: (context: PermissionContext): boolean => {
    // Owners can't leave unless they transfer ownership first
    return context.currentUserRole !== 'owner';
  },
};

/**
 * Task-level permissions
 */
export const TaskPermissions = {
  // Task creation
  canCreateTasks: (context: PermissionContext): boolean => {
    return !!context.currentUserRole; // Any team member can create tasks
  },

  // Task viewing
  canViewTask: (context: PermissionContext, task: Task): boolean => {
    if (!task.is_team_task) {
      // Personal task - assume current user can view their own tasks
      return true;
    }
    
    // Team task - any team member can view
    return !!context.currentUserRole;
  },

  // Task editing
  canEditTask: (context: PermissionContext, task: Task): boolean => {
    if (!task.is_team_task) {
      // Personal task - assume current user can edit their own tasks
      return true;
    }
    
    // Team task - assigned user or admins/owners can edit
    return task.assigned_to === context.currentUserId || 
           context.currentUserRole === 'owner' || 
           context.currentUserRole === 'admin';
  },

  // Task deletion
  canDeleteTask: (context: PermissionContext, task: Task): boolean => {
    if (!task.is_team_task) {
      // Personal task - assume current user can delete their own tasks
      return true;
    }
    
    // Team task - assigned user or admins/owners can delete
    return task.assigned_to === context.currentUserId || 
           context.currentUserRole === 'owner' || 
           context.currentUserRole === 'admin';
  },

  // Task assignment
  canAssignTask: (context: PermissionContext, task: Task): boolean => {
    if (!task.is_team_task) return false; // Can't assign personal tasks
    
    // Only admins/owners can assign tasks
    return context.currentUserRole === 'owner' || 
           context.currentUserRole === 'admin';
  },

  // Task completion (anyone can mark their assigned tasks as complete)
  canCompleteTask: (context: PermissionContext, task: Task): boolean => {
    if (!task.is_team_task) {
      // Personal task - assume current user can complete their own tasks
      return true;
    }
    
    // Team task - assigned user or admins/owners
    return task.assigned_to === context.currentUserId ||
           context.currentUserRole === 'owner' || 
           context.currentUserRole === 'admin';
  },
};

/**
 * UI-level permissions for showing/hiding elements
 */
export const UIPermissions = {
  showTeamSettings: (context: PermissionContext): boolean => {
    return TeamPermissions.canManageSettings(context);
  },

  showMemberManagement: (context: PermissionContext): boolean => {
    return TeamPermissions.canRemoveMembers(context) || TeamPermissions.canUpdateMemberRoles(context);
  },

  showInviteButton: (context: PermissionContext): boolean => {
    return TeamPermissions.canInviteMembers(context);
  },

  showDeleteTeamButton: (context: PermissionContext): boolean => {
    return TeamPermissions.canDeleteTeam(context);
  },

  showTaskActions: (context: PermissionContext, task: Task): boolean => {
    return TaskPermissions.canEditTask(context, task) || TaskPermissions.canDeleteTask(context, task);
  },

  showAssignmentControls: (context: PermissionContext, task: Task): boolean => {
    return TaskPermissions.canAssignTask(context, task);
  },
};

/**
 * Helper function to get permission context from team data
 */
export function getPermissionContext(
  currentUserId: string | undefined,
  currentTeam: Team | null,
  teamMembers: TeamMember[]
): PermissionContext {
  if (!currentUserId || !currentTeam) {
    return { currentUserId };
  }

  const currentMember = teamMembers.find(member => member.user_id === currentUserId);
  
  return {
    currentUserId,
    currentUserRole: currentMember?.role,
    team: currentTeam,
    teamMembers,
  };
}

/**
 * Role hierarchy for comparison
 */
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  'member': 1,
  'admin': 2,
  'owner': 3,
};

/**
 * Check if a role has higher or equal permissions than another
 */
export function hasRoleOrHigher(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get user-friendly role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  'owner': 'Full access to all team features and settings',
  'admin': 'Can manage members, tasks, and team settings',
  'member': 'Can create and manage tasks, view team information',
};

/**
 * Get role badge variants for UI
 */
export function getRoleBadgeVariant(role: TeamRole): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (role) {
    case 'owner':
      return 'destructive'; // Red for highest authority
    case 'admin':
      return 'default'; // Blue for admin
    case 'member':
      return 'secondary'; // Gray for regular member
    default:
      return 'outline';
  }
}