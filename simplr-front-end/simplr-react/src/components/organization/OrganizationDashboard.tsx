import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToastContext';
import { Copy, Users, Settings, Trash2, RefreshCw, Plus, Crown, Shield, User } from 'lucide-react';
import type { Organization, UserOrganization, OrganizationRole } from '@/types';

interface OrganizationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizationDashboard({ isOpen, onClose }: OrganizationDashboardProps) {
  const { user, currentOrganization } = useAuth();
  const {
    organizations,
    userOrganizations,
    updateOrganization,
    deleteOrganization,
    generateNewCode,
    switchToOrganization,
    isLoading,
    error
  } = useOrganizations();

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(currentOrganization);
  const [orgMembers, setOrgMembers] = useState<UserOrganization[]>([]);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [regenerateCodeOpen, setRegenerateCodeOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const { showToast } = useToast();

  // Set selected org when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      setSelectedOrg(currentOrganization);
    }
  }, [currentOrganization]);

  // Load organization members when selected org changes
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedOrg) return;
      
      setLoadingMembers(true);
      try {
        // Filter user organizations for the selected org
        const members = userOrganizations.filter(uo => uo.organizationId === selectedOrg.id);
        setOrgMembers(members);
      } catch (error) {
        console.error('Failed to load members:', error);
        showToast('Failed to load organization members', 'error');
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [selectedOrg, userOrganizations]);

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await switchToOrganization(orgId);
      const org = organizations.find(o => o.id === orgId);
      setSelectedOrg(org || null);
      showToast(`Switched to ${org?.name}`, 'success');
    } catch (error) {
      console.error('Failed to switch organization:', error);
      showToast('Failed to switch organization', 'error');
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Organization code copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy code', 'error');
    }
  };

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      description: org.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingOrg) return;

    try {
      await updateOrganization(editingOrg.id, {
        name: editForm.name,
        description: editForm.description
      });
      showToast('Organization updated successfully', 'success');
      setEditingOrg(null);
    } catch (error) {
      console.error('Failed to update organization:', error);
      showToast('Failed to update organization', 'error');
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return;

    try {
      await deleteOrganization(selectedOrg.id);
      showToast('Organization deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setSelectedOrg(null);
    } catch (error) {
      console.error('Failed to delete organization:', error);
      showToast('Failed to delete organization', 'error');
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedOrg) return;

    try {
      const newCode = await generateNewCode(selectedOrg.id);
      showToast('New organization code generated', 'success');
      setRegenerateCodeOpen(false);
      // Update the selected org with new code
      setSelectedOrg({ ...selectedOrg, code: newCode });
    } catch (error) {
      console.error('Failed to regenerate code:', error);
      showToast('Failed to regenerate organization code', 'error');
    }
  };

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member':
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: OrganizationRole) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'member':
        return 'outline';
    }
  };

  const currentUserRole = selectedOrg ? 
    userOrganizations.find(uo => uo.organizationId === selectedOrg.id && uo.userId === user?.id)?.role 
    : null;

  const canManageOrg = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === 'owner';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organization Dashboard</DialogTitle>
          <DialogDescription>
            Manage your organizations, members, and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Organization Selector */}
          <div className="space-y-2">
            <Label>Select Organization</Label>
            <div className="flex flex-wrap gap-2">
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  variant={selectedOrg?.id === org.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchOrganization(org.id)}
                  className="flex items-center gap-2"
                >
                  {org.name}
                  {currentOrganization?.id === org.id && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {selectedOrg && (
            <div className="w-full">
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('members')}
                >
                  Members
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedOrg.name}
                      <Badge variant={getRoleBadgeVariant(currentUserRole || 'member')}>
                        {getRoleIcon(currentUserRole || 'member')}
                        {currentUserRole}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {selectedOrg.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">Organization Code</Label>
                        <p className="text-sm text-muted-foreground">Share this code to invite new members</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-background rounded border font-mono text-sm">
                          {selectedOrg.code}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(selectedOrg.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedOrg.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Members</Label>
                        <p className="text-sm text-muted-foreground">
                          {orgMembers.length} member{orgMembers.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Organization Members
                    </CardTitle>
                    <CardDescription>
                      Manage who has access to this organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : orgMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No members found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orgMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Member {member.userId}</p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {getRoleIcon(member.role)}
                              {member.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4 mt-4">
                {canManageOrg ? (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Organization Settings
                        </CardTitle>
                        <CardDescription>
                          Manage organization details and preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {editingOrg?.id === selectedOrg.id ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="org-name">Organization Name</Label>
                              <Input
                                id="org-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Enter organization name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="org-description">Description</Label>
                              <Input
                                id="org-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Enter organization description"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveEdit} disabled={isLoading}>
                                Save Changes
                              </Button>
                              <Button variant="outline" onClick={() => setEditingOrg(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Button
                              variant="outline"
                              onClick={() => handleEditOrganization(selectedOrg)}
                            >
                              Edit Organization
                            </Button>
                          </div>
                        )}

                        <div className="border-t pt-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Regenerate Invite Code</Label>
                            <p className="text-sm text-muted-foreground">
                              Generate a new invite code. The old code will no longer work.
                            </p>
                            <Dialog open={regenerateCodeOpen} onOpenChange={setRegenerateCodeOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4" />
                                  Regenerate Code
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Regenerate Invite Code</DialogTitle>
                                  <DialogDescription>
                                    This will generate a new invite code for your organization. 
                                    The current code will no longer work. Are you sure?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setRegenerateCodeOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleRegenerateCode} disabled={isLoading}>
                                    Regenerate
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {isOwner && (
                            <div className="space-y-2">
                              <Label className="text-destructive">Danger Zone</Label>
                              <p className="text-sm text-muted-foreground">
                                Permanently delete this organization. This action cannot be undone.
                              </p>
                              <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" className="flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete Organization
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Organization</DialogTitle>
                                    <DialogDescription>
                                      This will permanently delete "{selectedOrg.name}" and all associated data. 
                                      This action cannot be undone. Are you sure?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDeleteOrganization} disabled={isLoading}>
                                      Delete Organization
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>You don't have permission to manage this organization.</p>
                        <p className="text-sm">Contact an admin or owner for access.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                </div>
              )}
            </div>
          )}

          {organizations.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You're not a member of any organizations yet.</p>
                  <p className="text-sm">Create or join an organization to get started.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}