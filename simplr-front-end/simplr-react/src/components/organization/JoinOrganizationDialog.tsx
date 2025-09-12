import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/useToastContext';
import { UserPlus, Building2 } from 'lucide-react';
import type { JoinOrganizationDialogProps } from '@/types/organization';

export const JoinOrganizationDialog: React.FC<JoinOrganizationDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { joinOrganization, currentOrganization } = useOrganization();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      showToast('Access code is required', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      await joinOrganization({
        access_code: accessCode.trim()
      });
      
      showToast('Successfully joined organization!', 'success');
      
      // Reset form
      setAccessCode('');
      
      // Close dialog and notify parent
      onOpenChange(false);
      if (currentOrganization) {
        onSuccess?.(currentOrganization);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to join organization', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setAccessCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Join Organization
          </DialogTitle>
          <DialogDescription>
            Enter the access code provided by your organization administrator to join.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              disabled={isLoading}
              className="font-mono"
              autoComplete="off"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !accessCode.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Join Organization
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};