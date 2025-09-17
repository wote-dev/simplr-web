import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Hash, FileText } from 'lucide-react';
import { useTeam } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CreateTeamData } from '@/types';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTeamModal({ isOpen, onClose }: CreateTeamModalProps) {
  const { createTeam, isLoading } = useTeam();
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
    max_members: 10,
  });
  const [errors, setErrors] = useState<Partial<CreateTeamData>>({});

  const handleInputChange = (field: keyof CreateTeamData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateTeamData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Team name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (formData.max_members && (formData.max_members < 2 || formData.max_members > 100)) {
      newErrors.max_members = 'Max members must be between 2 and 100' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await createTeam(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      max_members: 10,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Team Name
            </Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter team name"
              className={errors.name ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description (Optional)
            </Label>
            <Textarea
              id="team-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your team's purpose"
              className={errors.description ? 'border-destructive' : ''}
              disabled={isLoading}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Maximum Members
            </Label>
            <Input
              id="max-members"
              type="number"
              min="2"
              max="100"
              value={formData.max_members}
              onChange={(e) => handleInputChange('max_members', parseInt(e.target.value) || 10)}
              className={errors.max_members ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.max_members && (
              <p className="text-sm text-destructive">{errors.max_members}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                'Create Team'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> After creating your team, you'll receive a unique join code that you can share with others to invite them to your team.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}