import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { 
  TeamPermissions, 
  TaskPermissions, 
  UIPermissions, 
  getPermissionContext,
  type PermissionContext 
} from '@/lib/permissions';
import type { Task } from '@/types';

/**
 * Hook for accessing role-based permissions throughout the app
 */
export function usePermissions() {
  const { user } = useAuth();
  const { currentTeam, teamMembers } = useTeam();

  const context = useMemo((): PermissionContext => {
    return getPermissionContext(user?.id, currentTeam, teamMembers);
  }, [user?.id, currentTeam, teamMembers]);

  return {
    context,
    
    // Team permissions
    team: {
      canUpdate: () => TeamPermissions.canUpdateTeam(context),
      canDelete: () => TeamPermissions.canDeleteTeam(context),
      canManageSettings: () => TeamPermissions.canManageSettings(context),
      canInviteMembers: () => TeamPermissions.canInviteMembers(context),
      canRemoveMembers: () => TeamPermissions.canRemoveMembers(context),
      canUpdateMemberRoles: () => TeamPermissions.canUpdateMemberRoles(context),
      canRemoveSpecificMember: (targetUserId: string) => 
        TeamPermissions.canRemoveSpecificMember(context, targetUserId),
      canUpdateSpecificMemberRole: (targetUserId: string, newRole: any) => 
        TeamPermissions.canUpdateSpecificMemberRole(context, targetUserId, newRole),
      canView: () => TeamPermissions.canViewTeam(context),
      canLeave: () => TeamPermissions.canLeaveTeam(context),
    },

    // Task permissions
    task: {
      canCreate: () => TaskPermissions.canCreateTasks(context),
      canView: (task: Task) => TaskPermissions.canViewTask(context, task),
      canEdit: (task: Task) => TaskPermissions.canEditTask(context, task),
      canDelete: (task: Task) => TaskPermissions.canDeleteTask(context, task),
      canAssign: (task: Task) => TaskPermissions.canAssignTask(context, task),
      canComplete: (task: Task) => TaskPermissions.canCompleteTask(context, task),
    },

    // UI permissions
    ui: {
      showTeamSettings: () => UIPermissions.showTeamSettings(context),
      showMemberManagement: () => UIPermissions.showMemberManagement(context),
      showInviteButton: () => UIPermissions.showInviteButton(context),
      showDeleteTeamButton: () => UIPermissions.showDeleteTeamButton(context),
      showTaskActions: (task: Task) => UIPermissions.showTaskActions(context, task),
      showAssignmentControls: (task: Task) => UIPermissions.showAssignmentControls(context, task),
    },
  };
}

/**
 * Hook for checking a specific permission quickly
 */
export function usePermission<T extends keyof ReturnType<typeof usePermissions>>(
  category: T,
  permission: keyof ReturnType<typeof usePermissions>[T],
  ...args: any[]
) {
  const permissions = usePermissions();
  
  return useMemo(() => {
    const categoryPerms = permissions[category] as any;
    const permissionFn = categoryPerms[permission];
    
    if (typeof permissionFn === 'function') {
      return permissionFn(...args);
    }
    
    return false;
  }, [permissions, category, permission, ...args]);
}