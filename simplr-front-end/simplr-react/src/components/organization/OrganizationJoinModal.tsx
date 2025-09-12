import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Building2, Users, ArrowRight } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useToast } from '@/hooks/useToastContext';
import { cn } from '@/lib/utils';

interface OrganizationJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OrganizationJoinModal({ isOpen, onClose, onSuccess }: OrganizationJoinModalProps) {
  const [organizationCode, setOrganizationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { joinOrganization, validateInviteCode } = useOrganizations();
  const { showToast } = useToast();

  const handleJoinOrganization = async () => {
    if (!organizationCode.trim()) {
      showToast('Please enter an organization code', 'error');
      return;
    }

    try {
      setIsLoading(true);
      await joinOrganization(organizationCode.trim().toUpperCase());
      showToast('Successfully joined organization!', 'success');
      setOrganizationCode('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to join organization:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to join organization',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Convert to uppercase and limit to 8 characters
    const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setOrganizationCode(formattedCode);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && organizationCode.trim()) {
      handleJoinOrganization();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Join Organization
          </DialogTitle>
        </DialogHeader>
        
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardDescription>
              Enter the organization code provided by your team administrator to join and access shared tasks.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-code">Organization Code</Label>
              <Input
                id="org-code"
                placeholder="Enter 8-character code"
                value={organizationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-center text-lg font-mono tracking-wider"
                maxLength={8}
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Organization codes are 8 characters long (letters and numbers)
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoinOrganization}
                disabled={isLoading || !organizationCode.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Join Organization
              </Button>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p className="font-medium mb-1">What happens when you join:</p>
                  <ul className="space-y-1">
                    <li>• Access to organization's shared tasks</li>
                    <li>• Collaborate with team members</li>
                    <li>• Your existing tasks remain private</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}