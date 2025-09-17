import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { Shield, Users, Settings, Trash2, UserPlus, Crown } from 'lucide-react';

export function PermissionsDemo() {
  const { user } = useAuth();
  const { currentTeam } = useTeam();
  const permissions = usePermissions();

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions Demo
          </CardTitle>
          <CardDescription>Please log in to see permissions in action</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Permissions Demo
          </CardTitle>
          <CardDescription>
            This demonstrates how permissions change based on your role in the team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Current User:</span>
            <span>{user.name}</span>
            <Badge variant="outline">{user.email}</Badge>
          </div>
          
          {currentTeam && (
            <div className="flex items-center gap-4">
              <span className="font-medium">Current Team:</span>
              <span>{currentTeam.name}</span>
              <Badge variant="secondary">{permissions.context.currentUserRole || 'member'}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Team Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4" />
              Team Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PermissionItem
              label="Manage Settings"
              allowed={permissions.team.canManageSettings()}
              icon={<Settings className="h-4 w-4" />}
            />
            <PermissionItem
              label="Invite Members"
              allowed={permissions.team.canInviteMembers()}
              icon={<UserPlus className="h-4 w-4" />}
            />
            <PermissionItem
              label="Remove Members"
              allowed={permissions.team.canRemoveMembers()}
              icon={<Trash2 className="h-4 w-4" />}
            />
            <PermissionItem
              label="Update Member Roles"
              allowed={permissions.team.canUpdateMemberRoles()}
              icon={<Crown className="h-4 w-4" />}
            />
            <PermissionItem
              label="Delete Team"
              allowed={permissions.team.canDelete()}
              icon={<Trash2 className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        {/* Task Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-4 w-4" />
              Task Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PermissionItem
              label="View Tasks"
              allowed={permissions.task.canView({ id: 'demo', team_id: currentTeam?.id } as any)}
              description="Can view team tasks"
            />
            <PermissionItem
              label="Edit Tasks"
              allowed={permissions.task.canEdit({ id: 'demo', team_id: currentTeam?.id } as any)}
              description="Can edit team tasks"
            />
            <PermissionItem
              label="Delete Tasks"
              allowed={permissions.task.canDelete({ id: 'demo', team_id: currentTeam?.id } as any)}
              description="Can delete team tasks"
            />
            <PermissionItem
              label="Assign Tasks"
              allowed={permissions.task.canAssign({ id: 'demo', team_id: currentTeam?.id } as any)}
              description="Can assign tasks to members"
            />
            <PermissionItem
              label="Complete Tasks"
              allowed={permissions.task.canComplete({ id: 'demo', team_id: currentTeam?.id } as any)}
              description="Can mark tasks as complete"
            />
          </CardContent>
        </Card>

        {/* UI Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-4 w-4" />
              UI Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PermissionItem
              label="Show Team Settings"
              allowed={permissions.ui.showTeamSettings()}
              description="Can access team settings"
            />
            <PermissionItem
              label="Show Member Management"
              allowed={permissions.ui.showMemberManagement()}
              description="Can manage team members"
            />
            <PermissionItem
              label="Show Delete Team Button"
              allowed={permissions.ui.showDeleteTeamButton()}
              description="Can see delete team option"
            />
            <PermissionItem
              label="Show Task Actions"
              allowed={permissions.ui.showTaskActions({ id: 'demo', team_id: currentTeam?.id } as any)}
              description="Can see task action menu"
            />
          </CardContent>
        </Card>
      </div>

      {!currentTeam && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800">
              Join or create a team to see team-specific permissions in action!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PermissionItemProps {
  label: string;
  allowed: boolean;
  icon?: React.ReactNode;
  description?: string;
}

function PermissionItem({ label, allowed, icon, description }: PermissionItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg border">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Badge variant={allowed ? "default" : "secondary"}>
        {allowed ? "Allowed" : "Denied"}
      </Badge>
    </div>
  );
}