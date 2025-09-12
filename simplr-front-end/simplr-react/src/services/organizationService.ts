import { supabase } from '../lib/supabase';
import type {
  Organization,
  OrganizationMember,
  Team,
  TeamMember,
  OrganizationRole,
  TeamRole,
  OrganizationSettings
} from '../types';

/**
 * Service for managing organizations, members, teams, and invitations
 */
export class OrganizationService {
  /**
   * Generate a unique invite code for an organization
   */
  private static generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new organization
   */
  static async createOrganization(data: {
    name: string;
    description?: string;
    settings?: Partial<OrganizationSettings>;
  }): Promise<Organization> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const defaultSettings: OrganizationSettings = {
      allowPublicJoining: false,
      requireApprovalForJoining: true,
      features: {
        teams: true,
        taskAssignment: true,
        analytics: false,
        customFields: false
      },
      ...data.settings
    };

    const inviteCode = this.generateInviteCode();

    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        description: data.description,
        invite_code: inviteCode,
        settings: defaultSettings,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Automatically add creator as admin
    await this.addMember(organization.id, user.id, 'admin');

    return this.mapDatabaseToOrganization(organization);
  }

  /**
   * Get organization by ID
   */
  static async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members(count),
        teams(count)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapDatabaseToOrganization(data);
  }

  /**
   * Get organization by invite code
   */
  static async getOrganizationByInviteCode(inviteCode: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapDatabaseToOrganization(data);
  }

  /**
   * Get all organizations for current user
   */
  static async getUserOrganizations(): Promise<Organization[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members!inner(user_id),
        organization_members(count),
        teams(count)
      `)
      .eq('organization_members.user_id', user.id);

    if (error) throw error;

    return data.map(this.mapDatabaseToOrganization);
  }

  /**
   * Update organization
   */
  static async updateOrganization(id: string, updates: Partial<Organization>): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        name: updates.name,
        description: updates.description,
        settings: updates.settings
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Regenerate invite code for organization
   */
  static async regenerateInviteCode(organizationId: string): Promise<string> {
    const newInviteCode = this.generateInviteCode();

    const { error } = await supabase
      .from('organizations')
      .update({ invite_code: newInviteCode })
      .eq('id', organizationId);

    if (error) throw error;

    return newInviteCode;
  }

  /**
   * Add member to organization
   */
  static async addMember(
    organizationId: string,
    userId: string,
    role: OrganizationRole = 'member'
  ): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role
      });

    if (error) throw error;
  }

  /**
   * Join organization with invite code
   */
  static async joinOrganization(inviteCode: string): Promise<Organization> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const organization = await this.getOrganizationByInviteCode(inviteCode);
    if (!organization) throw new Error('Invalid invite code');

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this organization');
    }

    await this.addMember(organization.id, user.id, 'member');
    return organization;
  }

  /**
   * Get organization members
   */
  static async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user_profiles(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return data.map(member => ({
      id: member.id,
      organizationId: member.organization_id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.created_at,
      invitedBy: member.invited_by,
      user: member.user_profiles ? {
        id: member.user_profiles.id,
        name: member.user_profiles.full_name || 'Unknown User',
        email: member.user_profiles.email,
        avatar: member.user_profiles.avatar_url
      } : undefined
    }));
  }

  /**
   * Remove member from organization
   */
  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  /**
   * Update member role
   */
  static async updateMemberRole(memberId: string, role: OrganizationRole): Promise<void> {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;
  }

  /**
   * Create team
   */
  static async createTeam(organizationId: string, data: {
    name: string;
    description?: string;
  }): Promise<Team> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: data.name,
        description: data.description,
        organization_id: organizationId,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseToTeam(team);
  }

  /**
   * Get teams for organization
   */
  static async getOrganizationTeams(organizationId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(count)
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return data.map(this.mapDatabaseToTeam);
  }

  /**
   * Update team
   */
  static async updateTeam(id: string, updates: Partial<Team>): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({
        name: updates.name,
        description: updates.description
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete team
   */
  static async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Add member to team
   */
  static async addTeamMember(
    teamId: string,
    userId: string,
    role: TeamRole = 'member'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        added_by: user.id
      });

    if (error) throw error;
  }

  /**
   * Remove member from team
   */
  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        user_profiles(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('team_id', teamId);

    if (error) throw error;

    return data.map(member => ({
      id: member.id,
      teamId: member.team_id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.created_at,
      addedBy: member.added_by,
      user: member.user_profiles ? {
        id: member.user_profiles.id,
        name: member.user_profiles.full_name || 'Unknown User',
        email: member.user_profiles.email,
        avatar: member.user_profiles.avatar_url
      } : undefined
    }));
  }

  /**
   * Map database organization to app organization
   */
  private static mapDatabaseToOrganization(dbOrg: any): Organization {
    return {
      id: dbOrg.id,
      name: dbOrg.name,
      description: dbOrg.description,
      inviteCode: dbOrg.invite_code,
      settings: dbOrg.settings,
      createdAt: dbOrg.created_at,
      updatedAt: dbOrg.updated_at,
      createdBy: dbOrg.created_by,
      memberCount: dbOrg.organization_members?.[0]?.count || 0,
      teamCount: dbOrg.teams?.[0]?.count || 0
    };
  }

  /**
   * Map database team to app team
   */
  private static mapDatabaseToTeam(dbTeam: any): Team {
    return {
      id: dbTeam.id,
      name: dbTeam.name,
      description: dbTeam.description,
      organizationId: dbTeam.organization_id,
      createdAt: dbTeam.created_at,
      updatedAt: dbTeam.updated_at,
      createdBy: dbTeam.created_by,
      memberCount: dbTeam.team_members?.[0]?.count || 0
    };
  }
}

export default OrganizationService;