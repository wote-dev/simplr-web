import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Building2, Plus, Copy, Check } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useToast } from '@/hooks/useToastContext';
import type { Organization } from '@/types';

interface OrganizationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (organization: Organization) => void;
}

export function OrganizationCreateModal({ isOpen, onClose, onSuccess }: OrganizationCreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrganization, setCreatedOrganization] = useState<Organization | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const { createOrganization } = useOrganizations();
  const { showToast } = useToast();

  const handleCreateOrganization = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter an organization name', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const organization = await createOrganization({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        ownerId: '', // This will be set by the service
        settings: {}
      });
      
      setCreatedOrganization(organization);
      showToast('Organization created successfully!', 'success');
      onSuccess?.(organization);
    } catch (error) {
      console.error('Failed to create organization:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to create organization',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdOrganization) return;
    
    try {
      await navigator.clipboard.writeText(createdOrganization.code);
      setCodeCopied(true);
      showToast('Organization code copied to clipboard!', 'success');
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy code', 'error');
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setCreatedOrganization(null);
    setCodeCopied(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && formData.name.trim() && !createdOrganization) {
      handleCreateOrganization();
    }
  };

  // Show success screen after organization is created
  if (createdOrganization) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Created!
            </DialogTitle>
          </DialogHeader>
          
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pb-4">
              <CardTitle className="text-lg">{createdOrganization.name}</CardTitle>
              <CardDescription>
                Your organization has been created successfully. Share the code below with team members to invite them.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-0 space-y-4">
              <div className="space-y-2">
                <Label>Organization Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdOrganization.code}
                    readOnly
                    className="text-center text-lg font-mono tracking-wider bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="flex-shrink-0"
                  >
                    {codeCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Team members can use this code to join your organization
                </p>
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p className="font-medium mb-1 text-primary">Next steps:</p>
                  <ul className="space-y-1">
                    <li>• Share the organization code with your team</li>
                    <li>• Create tasks that will be visible to all members</li>
                    <li>• Manage organization settings from your dashboard</li>
                  </ul>
                </div>
              </div>
              
              <Button onClick={handleClose} className="w-full">
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create Organization
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardDescription>
              Create a new organization to collaborate with your team on shared tasks and projects.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                placeholder="Enter organization name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="org-description">Description (Optional)</Label>
              <Textarea
                id="org-description"
                placeholder="Brief description of your organization"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={isLoading}
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={isLoading || !formData.name.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}