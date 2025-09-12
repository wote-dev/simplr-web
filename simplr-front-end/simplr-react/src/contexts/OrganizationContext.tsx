import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { OrganizationService } from '../services/organizationService';
import type {
  Organization,
  OrganizationMember,
  OrganizationInvite,
  OrganizationContextType,
  CreateOrganizationData,
  UpdateOrganizationData,
  JoinOrganizationData,
  InviteUserData,
  UpdateMemberRoleData
} from '../types/organization';

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [organizationInvites, setOrganizationInvites] = useState<OrganizationInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to clear error after a delay
  const clearError = useCallback(() => {
    setTimeout(() => setError(null), 5000);
  }, []);

  // Helper function to handle errors
  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : defaultMessage;
    setError(errorMessage);
    clearError();
  }, [clearError]);

  // Load user organizations
  const loadUserOrganizations = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setUserOrganizations([]);
      setCurrentOrganization(null);
      return;
    }

    try {
      setIsLoading(true);
      const memberships = await OrganizationService.getUserOrganizations(user.id);
      const organizations = memberships.map(membership => membership.organization);
      setUserOrganizations(organizations);
      
      // Set current organization if none is selected
      if (!currentOrganization && organizations.length > 0) {
        const savedOrgId = localStorage.getItem('simplr_current_organization');
        const savedOrg = savedOrgId ? organizations.find(org => org.id === savedOrgId) : null;
        setCurrentOrganization(savedOrg || organizations[0]);
      }
    } catch (error) {
      // Silently handle missing backend - this is expected in development
      console.warn('Organization backend not available:', error);
      setUserOrganizations([]);
      setCurrentOrganization(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isAuthenticated, currentOrganization]);

  // Load organization members and invites
  const loadOrganizationData = useCallback(async (organizationId: string) => {
    try {
      setIsLoading(true);
      const [members] = await Promise.all([
        OrganizationService.getOrganizationMembers(organizationId)
      ]);
      setOrganizationMembers(members);
      // Note: Invites functionality can be added later when needed
      setOrganizationInvites([]);
    } catch (error) {
      // Silently handle missing backend - this is expected in development
      console.warn('Organization data backend not available:', error);
      setOrganizationMembers([]);
      setOrganizationInvites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Organization management functions
  const createOrganization = useCallback(async (data: CreateOrganizationData): Promise<Organization> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to create an organization');
    }

    try {
      setIsLoading(true);
      const organization = await OrganizationService.createOrganization(data);
      await loadUserOrganizations();
      setCurrentOrganization(organization);
      return organization;
    } catch (error) {
      handleError(error, 'Failed to create organization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadUserOrganizations, handleError]);

  const updateOrganization = useCallback(async (id: string, data: UpdateOrganizationData): Promise<void> => {
    try {
      setIsLoading(true);
      const updatedOrganization = await OrganizationService.updateOrganization(id, data);
      
      // Update local state
      setUserOrganizations(prev => 
        prev.map(org => org.id === id ? updatedOrganization : org)
      );
      
      if (currentOrganization?.id === id) {
        setCurrentOrganization(updatedOrganization);
      }
    } catch (error) {
      handleError(error, 'Failed to update organization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, handleError]);

  const deleteOrganization = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      await OrganizationService.deleteOrganization(id);
      
      // Update local state
      setUserOrganizations(prev => prev.filter(org => org.id !== id));
      
      if (currentOrganization?.id === id) {
        setCurrentOrganization(null);
        localStorage.removeItem('simplr_current_organization');
      }
    } catch (error) {
      handleError(error, 'Failed to delete organization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, handleError]);

  const joinOrganization = useCallback(async (data: JoinOrganizationData): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to join an organization');
    }

    try {
      setIsLoading(true);
      const membership = await OrganizationService.joinOrganization(data, user.id);
      await loadUserOrganizations();
      
      setCurrentOrganization(membership.organization);
    } catch (error) {
      handleError(error, 'Failed to join organization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadUserOrganizations, handleError]);

  const leaveOrganization = useCallback(async (organizationId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to leave an organization');
    }

    try {
      setIsLoading(true);
      await OrganizationService.removeMember(organizationId, user.id);
      
      // Update local state
      setUserOrganizations(prev => prev.filter(org => org.id !== organizationId));
      
      if (currentOrganization?.id === organizationId) {
        const remainingOrgs = userOrganizations.filter(org => org.id !== organizationId);
        setCurrentOrganization(remainingOrgs.length > 0 ? remainingOrgs[0] : null);
        localStorage.removeItem('simplr_current_organization');
      }
    } catch (error) {
      handleError(error, 'Failed to leave organization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentOrganization?.id, userOrganizations, handleError]);

  const switchOrganization = useCallback(async (organizationId: string | null): Promise<void> => {
    try {
      if (organizationId) {
        const organization = userOrganizations.find(org => org.id === organizationId);
        if (organization) {
          setCurrentOrganization(organization);
          localStorage.setItem('simplr_current_organization', organizationId);
          await loadOrganizationData(organizationId);
        }
      } else {
        setCurrentOrganization(null);
        localStorage.removeItem('simplr_current_organization');
        setOrganizationMembers([]);
        setOrganizationInvites([]);
      }
    } catch (error) {
      handleError(error, 'Failed to switch organization');
    }
  }, [userOrganizations, loadOrganizationData, handleError]);

  // Member management functions (placeholder implementations)
  const inviteUser = useCallback(async (organizationId: string, data: InviteUserData): Promise<void> => {
    // TODO: Implement invite functionality when needed
    console.log('Invite user functionality not yet implemented', { organizationId, data });
  }, []);

  const updateMemberRole = useCallback(async (memberId: string, data: UpdateMemberRoleData): Promise<void> => {
    try {
      setIsLoading(true);
      // Find the member to get organization and user IDs
      const member = organizationMembers.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      await OrganizationService.updateMemberRole(member.organization_id, member.user_id, data.role);
      
      // Refresh organization data
      if (currentOrganization) {
        await loadOrganizationData(currentOrganization.id);
      }
    } catch (error) {
      handleError(error, 'Failed to update member role');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [organizationMembers, currentOrganization, loadOrganizationData, handleError]);

  const removeMember = useCallback(async (memberId: string): Promise<void> => {
    try {
      setIsLoading(true);
      // Find the member to get organization and user IDs
      const member = organizationMembers.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      await OrganizationService.removeMember(member.organization_id, member.user_id);
      
      // Refresh organization data
      if (currentOrganization) {
        await loadOrganizationData(currentOrganization.id);
      }
    } catch (error) {
      handleError(error, 'Failed to remove member');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [organizationMembers, currentOrganization, loadOrganizationData, handleError]);

  const cancelInvite = useCallback(async (inviteId: string): Promise<void> => {
    // TODO: Implement cancel invite functionality when needed
    console.log('Cancel invite functionality not yet implemented', { inviteId });
  }, []);

  // Utility functions
  const refreshOrganizations = useCallback(async (): Promise<void> => {
    await loadUserOrganizations();
    if (currentOrganization) {
      await loadOrganizationData(currentOrganization.id);
    }
  }, [loadUserOrganizations, currentOrganization, loadOrganizationData]);

  const getUserRole = useCallback((organizationId: string): 'owner' | 'admin' | 'member' | null => {
    if (!user?.id) return null;
    
    const member = organizationMembers.find(
      m => m.organization_id === organizationId && m.user_id === user.id
    );
    
    return member?.role || null;
  }, [user?.id, organizationMembers]);

  const canManageOrganization = useCallback((organizationId: string): boolean => {
    const role = getUserRole(organizationId);
    return role === 'owner' || role === 'admin';
  }, [getUserRole]);

  const canManageMembers = useCallback((organizationId: string): boolean => {
    const role = getUserRole(organizationId);
    return role === 'owner' || role === 'admin';
  }, [getUserRole]);

  // Effects
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserOrganizations();
    } else {
      // Clear organization data when user logs out
      setCurrentOrganization(null);
      setUserOrganizations([]);
      setOrganizationMembers([]);
      setOrganizationInvites([]);
      localStorage.removeItem('simplr_current_organization');
    }
  }, [isAuthenticated, user?.id, loadUserOrganizations]);

  useEffect(() => {
    if (currentOrganization) {
      loadOrganizationData(currentOrganization.id);
    }
  }, [currentOrganization, loadOrganizationData]);

  const contextValue: OrganizationContextType = {
    currentOrganization,
    userOrganizations,
    organizationMembers,
    organizationInvites,
    isLoading,
    error,
    
    // Organization management
    createOrganization,
    updateOrganization,
    deleteOrganization,
    joinOrganization,
    leaveOrganization,
    switchOrganization,
    
    // Member management
    inviteUser,
    updateMemberRole,
    removeMember,
    cancelInvite,
    
    // Utility functions
    refreshOrganizations,
    getUserRole,
    canManageOrganization,
    canManageMembers
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};