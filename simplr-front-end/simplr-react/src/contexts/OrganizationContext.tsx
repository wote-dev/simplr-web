import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { OrganizationService } from '../services/organizationService';
import { useAuth } from './AuthContext';
import { ToastContext } from './ToastContext';
import type {
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
  OrganizationRole,
  TeamRole,
  OrganizationContextValue,
  OrganizationState
} from '../types';

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const toastContext = useContext(ToastContext);
  if (!toastContext) {
    throw new Error('OrganizationProvider must be used within a ToastProvider');
  }
  const { showToast } = toastContext;
  
  const [state, setState] = useState<OrganizationState>({
    currentOrganization: null,
    organizations: [],
    members: [],
    teams: [],
    isLoading: false,
    error: null
  });

  /**
   * Load user's organizations
   */
  const loadOrganizations = useCallback(async () => {
    if (!isAuthenticated) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const organizations = await OrganizationService.getUserOrganizations();
      setState(prev => ({ 
        ...prev, 
        organizations,
        isLoading: false 
      }));

      // Set current organization if user has one set or default to first
      if (user?.currentOrganizationId) {
        const currentOrg = organizations.find(org => org.id === user.currentOrganizationId);
        if (currentOrg) {
          await switchOrganization(currentOrg.id);
        }
      } else if (organizations.length > 0) {
        await switchOrganization(organizations[0].id);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load organizations',
        isLoading: false 
      }));
    }
  }, [isAuthenticated, user?.currentOrganizationId]);

  /**
   * Load organization details (members and teams)
   */
  const loadOrganizationDetails = useCallback(async (organizationId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [members, teams] = await Promise.all([
        OrganizationService.getOrganizationMembers(organizationId),
        OrganizationService.getOrganizationTeams(organizationId)
      ]);
      
      setState(prev => ({ 
        ...prev, 
        members, 
        teams,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Failed to load organization details:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load organization details',
        isLoading: false 
      }));
    }
  }, []);

  /**
   * Create a new organization
   */
  const createOrganization = useCallback(async (data: {
    name: string;
    description?: string;
  }): Promise<Organization> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const organization = await OrganizationService.createOrganization(data);
      
      setState(prev => ({ 
        ...prev, 
        organizations: [...prev.organizations, organization],
        currentOrganization: organization,
        isLoading: false 
      }));
      
      showToast('Organization created successfully!', 'success');
      await loadOrganizationDetails(organization.id);
      
      return organization;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create organization';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast, loadOrganizationDetails]);

  /**
   * Update organization
   */
  const updateOrganization = useCallback(async (id: string, updates: Partial<Organization>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.updateOrganization(id, updates);
      
      setState(prev => ({
        ...prev,
        organizations: prev.organizations.map(org => 
          org.id === id ? { ...org, ...updates } : org
        ),
        currentOrganization: prev.currentOrganization?.id === id 
          ? { ...prev.currentOrganization, ...updates }
          : prev.currentOrganization,
        isLoading: false
      }));
      
      showToast('Organization updated successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update organization';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  /**
   * Delete organization
   */
  const deleteOrganization = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.deleteOrganization(id);
      
      setState(prev => {
        const newOrganizations = prev.organizations.filter(org => org.id !== id);
        return {
          ...prev,
          organizations: newOrganizations,
          currentOrganization: prev.currentOrganization?.id === id ? null : prev.currentOrganization,
          members: prev.currentOrganization?.id === id ? [] : prev.members,
          teams: prev.currentOrganization?.id === id ? [] : prev.teams,
          isLoading: false
        };
      });
      
      showToast('Organization deleted successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete organization';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  /**
   * Switch current organization
   */
  const switchOrganization = useCallback(async (organizationId: string | null) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let currentOrganization: Organization | null = null;
      
      if (organizationId) {
        currentOrganization = state.organizations.find(org => org.id === organizationId) || null;
        if (!currentOrganization) {
          currentOrganization = await OrganizationService.getOrganization(organizationId);
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        currentOrganization,
        members: [],
        teams: [],
        isLoading: false 
      }));
      
      if (organizationId && currentOrganization) {
        await loadOrganizationDetails(organizationId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch organization';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
    }
  }, [state.organizations, loadOrganizationDetails, showToast]);

  /**
   * Invite member to organization
   */
  const inviteMember = useCallback(async (email: string, role: OrganizationRole) => {
    if (!state.currentOrganization) throw new Error('No current organization');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // For now, we'll just show the invite code since we don't have email functionality
      showToast(`Share invite code: ${state.currentOrganization.inviteCode}`, 'info');
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [state.currentOrganization, showToast]);

  /**
   * Remove member from organization
   */
  const removeMember = useCallback(async (memberId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.removeMember(memberId);
      
      setState(prev => ({
        ...prev,
        members: prev.members.filter(member => member.id !== memberId),
        isLoading: false
      }));
      
      showToast('Member removed successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  /**
   * Update member role
   */
  const updateMemberRole = useCallback(async (memberId: string, role: OrganizationRole) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.updateMemberRole(memberId, role);
      
      setState(prev => ({
        ...prev,
        members: prev.members.map(member => 
          member.id === memberId ? { ...member, role } : member
        ),
        isLoading: false
      }));
      
      showToast('Member role updated successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member role';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  /**
   * Create team
   */
  const createTeam = useCallback(async (data: {
    name: string;
    description?: string;
  }): Promise<Team> => {
    if (!state.currentOrganization) throw new Error('No current organization');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const team = await OrganizationService.createTeam(state.currentOrganization.id, data);
      
      setState(prev => ({
        ...prev,
        teams: [...prev.teams, team],
        isLoading: false
      }));
      
      showToast('Team created successfully!', 'success');
      return team;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create team';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [state.currentOrganization, showToast]);

  /**
   * Update team
   */
  const updateTeam = useCallback(async (id: string, updates: Partial<Team>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.updateTeam(id, updates);
      
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(team => 
          team.id === id ? { ...team, ...updates } : team
        ),
        isLoading: false
      }));
      
      showToast('Team updated successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  /**
   * Delete team
   */
  const deleteTeam = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.deleteTeam(id);
      
      setState(prev => ({
        ...prev,
        teams: prev.teams.filter(team => team.id !== id),
        isLoading: false
      }));
      
      showToast('Team deleted successfully!', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  /**
   * Add member to team
   */
  const addTeamMember = useCallback(async (teamId: string, userId: string, role: TeamRole) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.addTeamMember(teamId, userId, role);
      showToast('Team member added successfully!', 'success');
      
      // Reload organization details to get updated team member counts
      if (state.currentOrganization) {
        await loadOrganizationDetails(state.currentOrganization.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add team member';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [state.currentOrganization, loadOrganizationDetails, showToast]);

  /**
   * Remove member from team
   */
  const removeTeamMember = useCallback(async (teamId: string, userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await OrganizationService.removeTeamMember(teamId, userId);
      showToast('Team member removed successfully!', 'success');
      
      // Reload organization details to get updated team member counts
      if (state.currentOrganization) {
        await loadOrganizationDetails(state.currentOrganization.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove team member';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [state.currentOrganization, loadOrganizationDetails, showToast]);

  /**
   * Validate invite code
   */
  const validateInviteCode = useCallback(async (inviteCode: string): Promise<Organization> => {
    const organization = await OrganizationService.getOrganizationByInviteCode(inviteCode);
    if (!organization) {
      throw new Error('Invalid invite code');
    }
    return organization;
  }, []);

  /**
   * Join organization with invite code
   */
  const joinWithInviteCode = useCallback(async (inviteCode: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const organization = await OrganizationService.joinOrganization(inviteCode);
      
      setState(prev => ({
        ...prev,
        organizations: [...prev.organizations, organization],
        currentOrganization: organization,
        isLoading: false
      }));
      
      showToast(`Successfully joined ${organization.name}!`, 'success');
      await loadOrganizationDetails(organization.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join organization';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [loadOrganizationDetails, showToast]);

  /**
   * Regenerate invite code
   */
  const regenerateInviteCode = useCallback(async (organizationId: string): Promise<string> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newInviteCode = await OrganizationService.regenerateInviteCode(organizationId);
      
      setState(prev => ({
        ...prev,
        organizations: prev.organizations.map(org => 
          org.id === organizationId ? { ...org, inviteCode: newInviteCode } : org
        ),
        currentOrganization: prev.currentOrganization?.id === organizationId 
          ? { ...prev.currentOrganization, inviteCode: newInviteCode }
          : prev.currentOrganization,
        isLoading: false
      }));
      
      showToast('Invite code regenerated successfully!', 'success');
      return newInviteCode;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate invite code';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [showToast]);

  // Load organizations when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations();
    } else {
      setState({
        currentOrganization: null,
        organizations: [],
        members: [],
        teams: [],
        isLoading: false,
        error: null
      });
    }
  }, [isAuthenticated, loadOrganizations]);

  const value: OrganizationContextValue = {
    ...state,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    switchOrganization,
    inviteMember,
    removeMember,
    updateMemberRole,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    validateInviteCode,
    joinWithInviteCode,
    regenerateInviteCode
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

export { OrganizationContext };