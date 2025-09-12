import { supabase } from '../lib/supabase';
import type {
  Organization,
  OrganizationMember,
  PopulatedOrganizationMember,
  OrganizationStats,
  CreateOrganizationData,
  JoinOrganizationData,
  UpdateOrganizationData
} from '../types/organization';
import {
  createOrganizationError,
  createAccessCodeError,
  createPermissionError,
  createMembershipError
} from '../types/organization';

export class OrganizationService {
  /**
   * Create a new organization
   */
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description,
          settings: {}
        })
        .select()
        .single();

      if (error) {
        throw createOrganizationError(
          `Failed to create organization: ${error.message}`,
          'CREATE_FAILED',
          error
        );
      }

      return organization;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createOrganizationError(
        'An unexpected error occurred while creating the organization',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganization(id: string): Promise<Organization | null> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw createOrganizationError(
          `Failed to fetch organization: ${error.message}`,
          'FETCH_FAILED',
          error
        );
      }

      return organization;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createOrganizationError(
        'An unexpected error occurred while fetching the organization',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Get organization by access code
   */
  static async getOrganizationByAccessCode(accessCode: string): Promise<Organization | null> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw createAccessCodeError(
          `Failed to find organization with access code: ${error.message}`
        );
      }

      return organization;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createAccessCodeError(
        'An unexpected error occurred while finding the organization'
      );
    }
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    id: string,
    data: UpdateOrganizationData
  ): Promise<Organization> {
    try {
      const { data: organization, error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          description: data.description,
          settings: data.settings
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw createOrganizationError(
          `Failed to update organization: ${error.message}`,
          'UPDATE_FAILED',
          error
        );
      }

      return organization;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createOrganizationError(
        'An unexpected error occurred while updating the organization',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        throw createOrganizationError(
          `Failed to delete organization: ${error.message}`,
          'DELETE_FAILED',
          error
        );
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createOrganizationError(
        'An unexpected error occurred while deleting the organization',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Join organization with access code
   */
  static async joinOrganization(data: JoinOrganizationData, userId: string): Promise<PopulatedOrganizationMember> {
    try {
      // First, verify the access code and get the organization
      const organization = await this.getOrganizationByAccessCode(data.access_code);
      
      if (!organization) {
        throw createAccessCodeError('Invalid access code');
      }

      // Check if user is already a member
      const existingMember = await this.getOrganizationMember(
        organization.id,
        userId
      );

      if (existingMember) {
        throw createMembershipError('User is already a member of this organization');
      }

      // Add user as a member
      const { data: member, error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: userId,
          role: 'member'
        })
        .select(`
          *,
          organization:organizations(*),
          user:user_profiles(*)
        `)
        .single();

      if (error) {
        throw createMembershipError(
          `Failed to join organization: ${error.message}`
        );
      }

      return member;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createMembershipError(
        'An unexpected error occurred while joining the organization'
      );
    }
  }

  /**
   * Get organization member
   */
  static async getOrganizationMember(
    organizationId: string,
    userId: string
  ): Promise<OrganizationMember | null> {
    try {
      const { data: member, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*),
          user:user_profiles(*)
        `)
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw createMembershipError(
          `Failed to fetch member: ${error.message}`
        );
      }

      return member;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createMembershipError(
        'An unexpected error occurred while fetching the member'
      );
    }
  }

  /**
   * Get all members of an organization
   */
  static async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*),
          user:user_profiles(*)
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) {
        throw createMembershipError(
          `Failed to fetch members: ${error.message}`
        );
      }

      return members || [];
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createMembershipError(
        'An unexpected error occurred while fetching members'
      );
    }
  }

  /**
   * Get user's organizations
   */
  static async getUserOrganizations(userId: string): Promise<PopulatedOrganizationMember[]> {
    try {
      const { data: memberships, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*),
          user:user_profiles(*)
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        throw createMembershipError(
          `Failed to fetch user organizations: ${error.message}`
        );
      }

      return memberships || [];
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createMembershipError(
        'An unexpected error occurred while fetching user organizations'
      );
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    organizationId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<OrganizationMember> {
    try {
      const { data: member, error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .select(`
          *,
          organization:organizations(*),
          user:user_profiles(*)
        `)
        .single();

      if (error) {
        throw createPermissionError(
          `Failed to update member role: ${error.message}`
        );
      }

      return member;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createPermissionError(
        'An unexpected error occurred while updating member role'
      );
    }
  }

  /**
   * Remove member from organization
   */
  static async removeMember(organizationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) {
        throw createMembershipError(
          `Failed to remove member: ${error.message}`
        );
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createMembershipError(
        'An unexpected error occurred while removing member'
      );
    }
  }

  /**
   * Get organization statistics
   */
  static async getOrganizationStats(organizationId: string): Promise<Omit<OrganizationStats, 'id' | 'name' | 'access_code' | 'created_at' | 'updated_at'>> {
    try {
      // Get member count
      const { count: memberCount, error: memberError } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (memberError) {
        throw createOrganizationError(
          `Failed to fetch member count: ${memberError.message}`,
          'STATS_FAILED',
          memberError
        );
      }

      // Get task count
      const { count: taskCount, error: taskError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (taskError) {
        throw createOrganizationError(
          `Failed to fetch task count: ${taskError.message}`,
          'STATS_FAILED',
          taskError
        );
      }

      // Get completed task count
      const { count: completedTaskCount, error: completedTaskError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('completed', true);

      if (completedTaskError) {
        throw createOrganizationError(
          `Failed to fetch completed task count: ${completedTaskError.message}`,
          'STATS_FAILED',
          completedTaskError
        );
      }

      return {
        member_count: memberCount || 0,
        task_count: taskCount || 0,
        completed_task_count: completedTaskCount || 0
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createOrganizationError(
        'An unexpected error occurred while fetching organization statistics',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  /**
   * Regenerate organization access code
   */
  static async regenerateAccessCode(organizationId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('regenerate_organization_access_code', {
          org_id: organizationId
        });

      if (error) {
        throw createOrganizationError(
          `Failed to regenerate access code: ${error.message}`,
          'REGENERATE_FAILED',
          error
        );
      }

      return data;
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error) {
        throw error;
      }
      throw createOrganizationError(
        'An unexpected error occurred while regenerating access code',
        'UNKNOWN_ERROR',
        error
      );
    }
  }
}

export default OrganizationService;