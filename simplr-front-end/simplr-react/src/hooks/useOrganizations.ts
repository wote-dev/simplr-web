import { useState, useEffect, useCallback } from 'react';
import { OrganizationService } from '@/lib/organizationService';
import { useAuth } from '@/contexts/AuthContext';
import type { Organization, UserOrganization, OrganizationInvite, UseOrganizationsReturn } from '@/types';

export function useOrganizations(): UseOrganizationsReturn {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's organizations
  const loadOrganizations = useCallback(async () => {
    if (!user?.id) {
      setOrganizations([]);
      setUserOrganizations([]);
      setCurrentOrganization(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [orgs, memberships] = await Promise.all([
        OrganizationService.getUserOrganizations(user.id),
        OrganizationService.getUserOrganizationMemberships(user.id),
      ]);

      setOrganizations(orgs);
      setUserOrganizations(memberships);

      // Set current organization if user has one set
      if (user.currentOrganizationId) {
        const currentOrg = orgs.find(org => org.id === user.currentOrganizationId);
        setCurrentOrganization(currentOrg || null);
      } else if (orgs.length > 0) {
        // Default to first organization if none is set
        setCurrentOrganization(orgs[0]);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.currentOrganizationId]);

  // Load organizations when user changes
  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // Create a new organization
  const createOrganization = useCallback(async (
    data: Omit<Organization, 'id' | 'code' | 'createdAt' | 'updatedAt'>
  ): Promise<Organization> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to create an organization');
    }

    try {
      setIsLoading(true);
      setError(null);

      const newOrg = await OrganizationService.createOrganization({
        ...data,
        ownerId: user.id,
      });

      // Reload organizations to get updated list
      await loadOrganizations();

      return newOrg;
    } catch (err) {
      console.error('Failed to create organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadOrganizations]);

  // Join an organization using invite code
  const joinOrganization = useCallback(async (code: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to join an organization');
    }

    try {
      setIsLoading(true);
      setError(null);

      await OrganizationService.joinOrganization(user.id, code);

      // Reload organizations to get updated list
      await loadOrganizations();
    } catch (err) {
      console.error('Failed to join organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to join organization';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadOrganizations]);

  // Leave an organization
  const leaveOrganization = useCallback(async (organizationId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to leave an organization');
    }

    try {
      setIsLoading(true);
      setError(null);

      await OrganizationService.leaveOrganization(user.id, organizationId);

      // If leaving current organization, clear it
      if (currentOrganization?.id === organizationId) {
        setCurrentOrganization(null);
      }

      // Reload organizations to get updated list
      await loadOrganizations();
    } catch (err) {
      console.error('Failed to leave organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave organization';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentOrganization?.id, loadOrganizations]);

  // Update an organization
  const updateOrganization = useCallback(async (
    id: string,
    updates: Partial<Organization>
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedOrg = await OrganizationService.updateOrganization(id, updates);

      // Update local state
      setOrganizations(prev => 
        prev.map(org => org.id === id ? updatedOrg : org)
      );

      // Update current organization if it's the one being updated
      if (currentOrganization?.id === id) {
        setCurrentOrganization(updatedOrg);
      }
    } catch (err) {
      console.error('Failed to update organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  // Delete an organization
  const deleteOrganization = useCallback(async (id: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to delete an organization');
    }

    try {
      setIsLoading(true);
      setError(null);

      await OrganizationService.deleteOrganization(id, user.id);

      // If deleting current organization, clear it
      if (currentOrganization?.id === id) {
        setCurrentOrganization(null);
      }

      // Reload organizations to get updated list
      await loadOrganizations();
    } catch (err) {
      console.error('Failed to delete organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentOrganization?.id, loadOrganizations]);

  // Validate invite code
  const validateInviteCode = useCallback(async (code: string): Promise<OrganizationInvite | null> => {
    try {
      setError(null);
      return await OrganizationService.validateInviteCode(code);
    } catch (err) {
      console.error('Failed to validate invite code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate invite code';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Generate new organization code
  const generateNewCode = useCallback(async (organizationId: string): Promise<string> => {
    if (!user?.id) {
      throw new Error('User must be authenticated to generate new code');
    }

    try {
      setIsLoading(true);
      setError(null);

      const newCode = await OrganizationService.generateNewCode(organizationId, user.id);

      // Update local organization with new code
      setOrganizations(prev => 
        prev.map(org => 
          org.id === organizationId ? { ...org, code: newCode } : org
        )
      );

      // Update current organization if it's the one being updated
      if (currentOrganization?.id === organizationId) {
        setCurrentOrganization(prev => 
          prev ? { ...prev, code: newCode } : null
        );
      }

      return newCode;
    } catch (err) {
      console.error('Failed to generate new code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate new code';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentOrganization?.id]);

  // Switch to organization (or personal workspace if null)
  const switchToOrganization = useCallback(async (organizationId: string | null) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to switch organizations');
    }

    try {
      setError(null);
      
      // Update user's current organization preference
      // This would typically be saved to user preferences or profile
      // For now, we'll just update the local state and auth context
      
      if (organizationId) {
        const targetOrg = organizations.find(org => org.id === organizationId);
        if (!targetOrg) {
          throw new Error('Organization not found');
        }
        setCurrentOrganization(targetOrg);
      } else {
        setCurrentOrganization(null);
      }
      
      // Update auth context with current organization
      // This will be handled by the auth context's setCurrentOrganization method
      
    } catch (err) {
      console.error('Failed to switch organization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, organizations]);

  return {
    organizations,
    currentOrganization,
    userOrganizations,
    createOrganization,
    joinOrganization,
    leaveOrganization,
    updateOrganization,
    deleteOrganization,
    validateInviteCode,
    generateNewCode,
    switchToOrganization,
    isLoading,
    error,
  };
}