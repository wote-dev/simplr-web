import { supabase } from './supabase';
import type { Organization, UserOrganization, OrganizationRole, OrganizationInvite } from '@/types';

// Database types that match Supabase schema
export interface DatabaseOrganization {
  id: string;
  name: string;
  code: string;
  description?: string;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrganizationRole;
  joined_at: string;
}

export class OrganizationService {
  // Convert database organization to app organization
  private static mapDatabaseToOrganization(dbOrg: DatabaseOrganization): Organization {
    return {
      id: dbOrg.id,
      name: dbOrg.name,
      code: dbOrg.code,
      description: dbOrg.description,
      ownerId: dbOrg.owner_id,
      settings: dbOrg.settings,
      createdAt: dbOrg.created_at,
      updatedAt: dbOrg.updated_at,
    };
  }

  // Convert database user organization to app user organization
  private static mapDatabaseToUserOrganization(dbUserOrg: DatabaseUserOrganization): UserOrganization {
    return {
      id: dbUserOrg.id,
      userId: dbUserOrg.user_id,
      organizationId: dbUserOrg.organization_id,
      role: dbUserOrg.role,
      joinedAt: dbUserOrg.joined_at,
    };
  }

  // Generate a unique organization code
  static async generateOrganizationCode(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_organization_code');
    
    if (error) {
      console.error('Error generating organization code:', error);
      throw new Error('Failed to generate organization code');
    }
    
    return data;
  }

  // Create a new organization
  static async createOrganization(
    data: Omit<Organization, 'id' | 'code' | 'createdAt' | 'updatedAt'>
  ): Promise<Organization> {
    try {
      // Generate unique code
      const code = await this.generateOrganizationCode();
      
      const { data: orgData, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          code,
          description: data.description,
          owner_id: data.ownerId,
          settings: data.settings,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        throw new Error('Failed to create organization');
      }

      return this.mapDatabaseToOrganization(orgData);
    } catch (error) {
      console.error('Error in createOrganization:', error);
      throw error;
    }
  }

  // Get organizations for a user
  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          organizations!inner (
            id,
            name,
            code,
            description,
            owner_id,
            settings,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user organizations:', error);
        throw new Error('Failed to fetch organizations');
      }

      return data
        .map((item: any) => item.organizations)
        .filter(Boolean)
        .map((org: any) => this.mapDatabaseToOrganization(org as DatabaseOrganization));
    } catch (error) {
      console.error('Error in getUserOrganizations:', error);
      throw error;
    }
  }

  // Get user organization memberships
  static async getUserOrganizationMemberships(userId: string): Promise<UserOrganization[]> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user organization memberships:', error);
        throw new Error('Failed to fetch organization memberships');
      }

      return data.map(item => this.mapDatabaseToUserOrganization(item));
    } catch (error) {
      console.error('Error in getUserOrganizationMemberships:', error);
      throw error;
    }
  }

  // Get organization by ID
  static async getOrganization(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Organization not found
        }
        console.error('Error fetching organization:', error);
        throw new Error('Failed to fetch organization');
      }

      return this.mapDatabaseToOrganization(data);
    } catch (error) {
      console.error('Error in getOrganization:', error);
      throw error;
    }
  }

  // Validate organization invite code
  static async validateInviteCode(code: string): Promise<OrganizationInvite | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, code')
        .eq('code', code)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Invalid code
        }
        console.error('Error validating invite code:', error);
        throw new Error('Failed to validate invite code');
      }

      return {
        code: data.code,
        organizationId: data.id,
        organizationName: data.name,
      };
    } catch (error) {
      console.error('Error in validateInviteCode:', error);
      throw error;
    }
  }

  // Join organization using invite code
  static async joinOrganization(userId: string, code: string): Promise<void> {
    try {
      // First validate the code and get organization info
      const invite = await this.validateInviteCode(code);
      if (!invite) {
        throw new Error('Invalid organization code');
      }

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', invite.organizationId)
        .single();

      if (existingMembership) {
        throw new Error('You are already a member of this organization');
      }

      // Add user to organization
      const { error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: invite.organizationId,
          role: 'member',
        });

      if (error) {
        console.error('Error joining organization:', error);
        throw new Error('Failed to join organization');
      }
    } catch (error) {
      console.error('Error in joinOrganization:', error);
      throw error;
    }
  }

  // Leave organization
  static async leaveOrganization(userId: string, organizationId: string): Promise<void> {
    try {
      // Check if user is the owner
      const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single();

      if (org?.owner_id === userId) {
        throw new Error('Organization owners cannot leave. Transfer ownership or delete the organization.');
      }

      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error leaving organization:', error);
        throw new Error('Failed to leave organization');
      }
    } catch (error) {
      console.error('Error in leaveOrganization:', error);
      throw error;
    }
  }

  // Update organization
  static async updateOrganization(
    id: string,
    updates: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Organization> {
    try {
      const updateData: Partial<DatabaseOrganization> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.settings !== undefined) updateData.settings = updates.settings;
      if (updates.ownerId !== undefined) updateData.owner_id = updates.ownerId;

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization:', error);
        throw new Error('Failed to update organization');
      }

      return this.mapDatabaseToOrganization(data);
    } catch (error) {
      console.error('Error in updateOrganization:', error);
      throw error;
    }
  }

  // Delete organization
  static async deleteOrganization(id: string, userId: string): Promise<void> {
    try {
      // Verify user is the owner
      const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (!org || org.owner_id !== userId) {
        throw new Error('Only organization owners can delete the organization');
      }

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting organization:', error);
        throw new Error('Failed to delete organization');
      }
    } catch (error) {
      console.error('Error in deleteOrganization:', error);
      throw error;
    }
  }

  // Generate new organization code
  static async generateNewCode(organizationId: string, userId: string): Promise<string> {
    try {
      // Verify user is the owner or admin
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new Error('Only organization owners and admins can generate new codes');
      }

      // Generate new code
      const newCode = await this.generateOrganizationCode();

      // Update organization with new code
      const { error } = await supabase
        .from('organizations')
        .update({ code: newCode })
        .eq('id', organizationId);

      if (error) {
        console.error('Error updating organization code:', error);
        throw new Error('Failed to generate new code');
      }

      return newCode;
    } catch (error) {
      console.error('Error in generateNewCode:', error);
      throw error;
    }
  }

  // Get organization members
  static async getOrganizationMembers(organizationId: string): Promise<UserOrganization[]> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          user_profiles (
            name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching organization members:', error);
        throw new Error('Failed to fetch organization members');
      }

      return data.map(item => this.mapDatabaseToUserOrganization(item));
    } catch (error) {
      console.error('Error in getOrganizationMembers:', error);
      throw error;
    }
  }

  // Update user role in organization
  static async updateUserRole(
    organizationId: string,
    targetUserId: string,
    newRole: OrganizationRole,
    requestingUserId: string
  ): Promise<void> {
    try {
      // Verify requesting user has permission
      const { data: requestingMembership } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', requestingUserId)
        .eq('organization_id', organizationId)
        .single();

      if (!requestingMembership || !['owner', 'admin'].includes(requestingMembership.role)) {
        throw new Error('Insufficient permissions to update user roles');
      }

      // Prevent non-owners from promoting to owner
      if (newRole === 'owner' && requestingMembership.role !== 'owner') {
        throw new Error('Only organization owners can promote users to owner');
      }

      const { error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('user_id', targetUserId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error updating user role:', error);
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      throw error;
    }
  }

  // Remove user from organization
  static async removeUserFromOrganization(
    organizationId: string,
    targetUserId: string,
    requestingUserId: string
  ): Promise<void> {
    try {
      // Verify requesting user has permission
      const { data: requestingMembership } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', requestingUserId)
        .eq('organization_id', organizationId)
        .single();

      if (!requestingMembership || !['owner', 'admin'].includes(requestingMembership.role)) {
        throw new Error('Insufficient permissions to remove users');
      }

      // Prevent removing the owner
      const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single();

      if (org?.owner_id === targetUserId) {
        throw new Error('Cannot remove organization owner');
      }

      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', targetUserId)
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error removing user from organization:', error);
        throw new Error('Failed to remove user from organization');
      }
    } catch (error) {
      console.error('Error in removeUserFromOrganization:', error);
      throw error;
    }
  }
}