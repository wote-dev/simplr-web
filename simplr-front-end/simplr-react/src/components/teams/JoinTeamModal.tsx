import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Key, AlertCircle, Eye, Calendar, Hash } from 'lucide-react';
import { useTeam } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatabaseService } from '@/lib/database';
import type { Team } from '@/types';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinTeamModal({ isOpen, onClose }: JoinTeamModalProps) {
  const { joinTeam, isLoading } = useTeam();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [teamPreview, setTeamPreview] = useState<Pick<Team, 'id' | 'name' | 'description' | 'member_count' | 'max_members' | 'created_at'> | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleInputChange = (value: string) => {
    const cleanCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setJoinCode(cleanCode);
    if (error) setError('');
    setTeamPreview(null);
  };

  // Debounced team preview fetching
  useEffect(() => {
    const fetchTeamPreview = async () => {
      if (joinCode.length >= 6) {
        setIsLoadingPreview(true);
        try {
          const preview = await DatabaseService.getTeamPreview(joinCode);
          setTeamPreview(preview);
        } catch (error) {
          console.error('Error fetching team preview:', error);
          setTeamPreview(null);
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setTeamPreview(null);
        setIsLoadingPreview(false);
      }
    };

    const timeoutId = setTimeout(fetchTeamPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [joinCode]);

  const validateJoinCode = (): boolean => {
    if (!joinCode.trim()) {
      setError('Join code is required');
      return false;
    }
    
    if (joinCode.length < 6) {
      setError('Join code must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateJoinCode()) return;

    try {
      await joinTeam(joinCode);
      handleClose();
    } catch (error) {
      console.error('Error joining team:', error);
      setError(error instanceof Error ? error.message : 'Failed to join team');
    }
  };

  const handleClose = () => {
    setJoinCode('');
    setError('');
    setTeamPreview(null);
    setIsLoadingPreview(false);
    onClose();
  };

  const formatJoinCode = (code: string) => {
    // Format as XXXX-XXXX for better readability
    return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Team
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-code" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Join Code
            </Label>
            <Input
              id="join-code"
              value={formatJoinCode(joinCode)}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="XXXX-XXXX"
              className={error ? 'border-destructive' : ''}
              disabled={isLoading}
              maxLength={9} // 8 characters + 1 dash
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* Team Preview */}
          {isLoadingPreview && (
            <div className="p-4 bg-muted rounded-lg border">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
                <span className="text-sm text-muted-foreground">Loading team preview...</span>
              </div>
            </div>
          )}

          {teamPreview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
            >
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      {teamPreview.name}
                    </h4>
                    {teamPreview.description && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {teamPreview.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{teamPreview.member_count ?? 0}/{teamPreview.max_members} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(teamPreview.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {(teamPreview.member_count ?? 0) >= teamPreview.max_members && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Team is at maximum capacity</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {joinCode.length >= 6 && !isLoadingPreview && !teamPreview && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>No team found with this join code</span>
              </div>
            </div>
          )}

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
              disabled={isLoading || !joinCode.trim() || !teamPreview || (teamPreview.member_count ?? 0) >= teamPreview.max_members}
              className="flex-1"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                'Join Team'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>How to get a join code:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Ask a team member to share the join code</li>
              <li>• Team owners can find it in team settings</li>
              <li>• Join codes are case-insensitive</li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Security Note
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Only join teams from trusted sources. Team members can see your name and tasks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}