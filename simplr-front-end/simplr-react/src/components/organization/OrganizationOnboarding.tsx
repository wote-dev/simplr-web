import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Plus, ArrowRight } from 'lucide-react';
import { OrganizationJoinModal } from './OrganizationJoinModal';
import { OrganizationCreateModal } from './OrganizationCreateModal';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Organization } from '@/types';

interface OrganizationOnboardingProps {
  className?: string;
  onComplete?: (organization: Organization) => void;
}

export function OrganizationOnboarding({ className, onComplete }: OrganizationOnboardingProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  useAuth();

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    // The organization will be automatically set as current in the hook
  };

  const handleCreateSuccess = (organization: Organization) => {
    setShowCreateModal(false);
    onComplete?.(organization);
  };

  return (
    <>
      <div className={cn(
        "w-full max-w-2xl mx-auto space-y-6",
        className
      )}>
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to Enterprise Simplr
            </h2>
            <p className="text-muted-foreground mt-2">
              Join an existing organization or create a new one to start collaborating with your team.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Join Organization Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setShowJoinModal(true)}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Join Organization</CardTitle>
              <CardDescription>
                Have an organization code? Join your team's workspace to access shared tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowJoinModal(true);
                }}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Enter Organization Code
              </Button>
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Perfect if you:</p>
                <ul className="space-y-1">
                  <li>• Have been invited by a team member</li>
                  <li>• Want to join an existing workspace</li>
                  <li>• Need access to shared tasks</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Create Organization Card */}
          <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setShowCreateModal(true)}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-500/20 transition-colors">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Create Organization</CardTitle>
              <CardDescription>
                Start fresh by creating a new organization and inviting your team members.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Organization
              </Button>
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Perfect if you:</p>
                <ul className="space-y-1">
                  <li>• Are starting a new team or project</li>
                  <li>• Want to be the organization admin</li>
                  <li>• Need to invite team members</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-medium text-sm">Enterprise Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span>Shared task management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span>Team collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span>Organization management</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Your personal tasks will remain private and separate from organization tasks.
          </p>
        </div>
      </div>

      {/* Modals */}
      <OrganizationJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
      />
      
      <OrganizationCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}