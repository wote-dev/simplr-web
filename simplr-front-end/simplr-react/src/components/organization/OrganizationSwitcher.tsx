import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Plus, Users, Settings, Check } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationJoinModal } from './OrganizationJoinModal';
import { OrganizationCreateModal } from './OrganizationCreateModal';
import { cn } from '@/lib/utils';
import type { Organization } from '@/types';

interface OrganizationSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function OrganizationSwitcher({ className, showLabel = true }: OrganizationSwitcherProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { 
    organizations, 
    currentOrganization, 
    switchToOrganization,
    isLoading 
  } = useOrganizations();
  const { user } = useAuth();

  const handleOrganizationSwitch = async (organization: Organization) => {
    try {
      await switchToOrganization(organization.id);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const handleSwitchToPersonal = async () => {
    try {
      await switchToOrganization(null);
    } catch (error) {
      console.error('Failed to switch to personal:', error);
    }
  };

  const handleCreateSuccess = (organization: Organization) => {
    setShowCreateModal(false);
    // The organization will be automatically set as current
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    // The organization will be automatically set as current
  };

  const displayName = currentOrganization ? currentOrganization.name : 'Personal';
  const isPersonal = !currentOrganization;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "justify-between min-w-[200px] max-w-[250px]",
              className
            )}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col items-start min-w-0">
                {showLabel && (
                  <span className="text-xs text-muted-foreground leading-none">
                    {isPersonal ? 'Personal Workspace' : 'Organization'}
                  </span>
                )}
                <span className="font-medium truncate text-sm">
                  {displayName}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-[250px]">
          <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Personal Workspace */}
          <DropdownMenuItem 
            onClick={handleSwitchToPersonal}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Personal</span>
                <span className="text-xs text-muted-foreground">Your private tasks</span>
              </div>
            </div>
            {isPersonal && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          
          {/* Organization List */}
          {organizations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {organizations.map((org) => {
                const isSelected = currentOrganization?.id === org.id;
                return (
                  <DropdownMenuItem 
                    key={org.id}
                    onClick={() => handleOrganizationSwitch(org)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{org.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Code: {org.code}</span>
                          {org.ownerId === user?.id && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Owner
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Actions */}
          <DropdownMenuItem onClick={() => setShowJoinModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Join Organization
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Create Organization
          </DropdownMenuItem>
          
          {currentOrganization && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                Organization Settings
                <Badge variant="outline" className="ml-auto text-xs">
                  Soon
                </Badge>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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