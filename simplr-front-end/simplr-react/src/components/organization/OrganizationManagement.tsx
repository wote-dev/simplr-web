import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/useToastContext';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';
import { JoinOrganizationDialog } from './JoinOrganizationDialog';
import { 
  Building2, 
  Plus, 
  UserPlus, 
  Users, 
  Settings, 
  ExternalLink,
  Copy,
  Crown,
  Shield,
  User
} from 'lucide-react';
import type { Organization } from '@/types/organization';

export const OrganizationManagement: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  
  const {
    currentOrganization,
    userOrganizations,
    switchOrganization,
    getUserRole,
    isLoading
  } = useOrganization();
  
  const { showToast } = useToast();

  const handleCreateSuccess = (organization: Organization) => {
    showToast(`Organization "${organization.name}" created successfully!`, 'success');
  };

  const handleJoinSuccess = (organization: Organization) => {
    showToast(`Successfully joined "${organization.name}"!`, 'success');
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    try {
      await switchOrganization(organizationId);
      showToast('Switched organization successfully', 'success');
    } catch (error) {
      showToast('Failed to switch organization', 'error');
    }
  };

  const copyAccessCode = async (accessCode: string) => {
    try {
      await navigator.clipboard.writeText(accessCode);
      showToast('Access code copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy access code', 'error');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and collaborate with your team
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowJoinDialog(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Join Organization
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Current Organization */}
      {currentOrganization && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {currentOrganization.name}
                    <Badge variant="default">Current</Badge>
                  </CardTitle>
                  <CardDescription>
                    {currentOrganization.description || 'No description provided'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getRoleBadgeVariant(getUserRole(currentOrganization.id) || 'member')}
                  className="flex items-center gap-1"
                >
                  {getRoleIcon(getUserRole(currentOrganization.id) || 'member')}
                  {getUserRole(currentOrganization.id)}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Access Code:</span>
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {currentOrganization.access_code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyAccessCode(currentOrganization.access_code)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Organizations</h2>
        
        {userOrganizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organizations</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                You're not a member of any organizations yet. Create a new organization or join an existing one using an access code.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowJoinDialog(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Join Organization
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userOrganizations.map((organization) => {
              const userRole = getUserRole(organization.id);
              const isCurrent = currentOrganization?.id === organization.id;
              
              return (
                <Card 
                  key={organization.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isCurrent ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => !isCurrent && handleSwitchOrganization(organization.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{organization.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                        <Badge 
                          variant={getRoleBadgeVariant(userRole || 'member')}
                          className="flex items-center gap-1 text-xs"
                        >
                          {getRoleIcon(userRole || 'member')}
                          {userRole}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {organization.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Access Code: {organization.access_code}</span>
                      {!isCurrent && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
      
      <JoinOrganizationDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};