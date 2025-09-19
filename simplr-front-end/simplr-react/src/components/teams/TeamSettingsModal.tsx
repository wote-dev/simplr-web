import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Users, 
  Settings, 
  Trash2, 
  Copy, 
  RefreshCw, 
  Crown, 
  UserMinus, 
  AlertTriangle,
  Hash,
  FileText,
  Calendar,
  Shield,
  User,
  Check
} from 'lucide-react';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToastContext';
import { useModalState } from '@/contexts/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Team, TeamRole } from '@/types';

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
}

export function TeamSettingsModal({ isOpen, onClose, team }: TeamSettingsModalProps) {
  const { user } = useAuth();
  const { 
    updateTeam, 
    deleteTeam, 
    removeMember, 
    updateMemberRole, 
    inviteMember,
    teamMembers, 
    isLoading 
  } = useTeam();
  
  const permissions = usePermissions();
  
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    max_members: team.max_members,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Use permissions instead of manual checks
  const canManageSettings = permissions.team.canManageSettings();
  const canInviteMembers = permissions.team.canInviteMembers();
  const canDeleteTeam = permissions.team.canDelete();
  const showMemberManagement = permissions.ui.showMemberManagement();
  const showDeleteButton = permissions.ui.showDeleteTeamButton();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }

    if (formData.max_members < 2 || formData.max_members > 100) {
      newErrors.max_members = 'Max members must be between 2 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateTeam = async () => {
    if (!validateForm()) return;

    try {
      await updateTeam(team.id, formData);
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(team.id);
      onClose();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleCopyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(team.join_code);
      setCopiedJoinCode(true);
      setTimeout(() => setCopiedJoinCode(false), 2000);
    } catch (error) {
      console.error('Error copying join code:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(team.id, userId);
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleUpdateRole = async (userId: string, role: TeamRole) => {
    try {
      await updateMemberRole(team.id, userId, role);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleInviteMember = async () => {
    try {
      await inviteMember(team.id);
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Members ({teamMembers.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6 p-1">
              {/* Team Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!canManageSettings || isLoading}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!canManageSettings || isLoading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-members">Maximum Members</Label>
                  <Input
                    id="max-members"
                    type="number"
                    min="2"
                    max="100"
                    value={formData.max_members}
                    onChange={(e) => handleInputChange('max_members', parseInt(e.target.value) || 10)}
                    disabled={!canManageSettings || isLoading}
                    className={errors.max_members ? 'border-destructive' : ''}
                  />
                  {errors.max_members && (
                    <p className="text-sm text-destructive">{errors.max_members}</p>
                  )}
                </div>

                {canManageSettings && (
                  <Button onClick={handleUpdateTeam} disabled={isLoading}>
                    Save Changes
                  </Button>
                )}
              </div>

              <Separator />

              {/* Join Code */}
              <div className="space-y-3">
                <Label>Join Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={team.join_code}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyJoinCode}
                    className="shrink-0"
                  >
                    {copiedJoinCode ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this code with others to invite them to your team.
                </p>
              </div>

              {/* Invite Member */}
              <div className="space-y-3">
                <Label>Invite Members</Label>
                <Button
                  onClick={handleInviteMember}
                  disabled={isLoading || !canInviteMembers}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Share Join Code
                </Button>
              </div>

              {/* Danger Zone */}
              {showDeleteButton && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-destructive flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Danger Zone
                    </Label>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Team
                    </Button>

                    <AlertDialog open={showDeleteDialog}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{team.name}"? This action cannot be undone.
                            All team tasks and data will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteTeam}
                          >
                            Delete Team
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4 p-1">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user?.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>

                    {showMemberManagement && member.user_id !== user?.id && member.role !== 'owner' && (
                      <div className="flex gap-1">
                        {member.role !== 'admin' && permissions.team.canUpdateMemberRoles() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRole(member.user_id, 'admin')}
                            disabled={isLoading}
                          >
                            Make Admin
                          </Button>
                        )}
                        {member.role === 'admin' && permissions.team.canUpdateMemberRoles() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRole(member.user_id, 'member')}
                            disabled={isLoading}
                          >
                            Remove Admin
                          </Button>
                        )}
                        {permissions.team.canRemoveMembers() && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setMemberToRemove(member.user_id)}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      </Dialog>

      {/* Member Removal Dialog */}
      <AlertDialog open={!!memberToRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (memberToRemove) {
                  handleRemoveMember(memberToRemove);
                  setMemberToRemove(null);
                }
              }}
              variant="destructive"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};