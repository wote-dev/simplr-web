// Organization-related TypeScript types

export interface Organization {
  id: string;
  name: string;
  description?: string;
  access_code: string;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  // Populated from joins
  user?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  organization?: {
    id: string;
    name: string;
    description?: string;
    access_code: string;
    owner_id: string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
}

// Type for OrganizationMember with populated organization data
export interface PopulatedOrganizationMember extends OrganizationMember {
  organization: Organization;
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  invited_by: string;
  role: 'admin' | 'member';
  expires_at: string;
  created_at: string;
  // Populated from joins
  invited_by_user?: {
    id: string;
    name: string;
    email?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface OrganizationStats {
  id: string;
  name: string;
  access_code: string;
  member_count: number;
  task_count: number;
  completed_task_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface JoinOrganizationData {
  access_code: string;
}

export interface InviteUserData {
  email: string;
  role: 'admin' | 'member';
}

export interface UpdateMemberRoleData {
  role: 'admin' | 'member';
}

// Database types that match Supabase schema
export interface DatabaseOrganization {
  id: string;
  name: string;
  description?: string;
  access_code: string;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseOrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface DatabaseOrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  invited_by: string;
  role: 'admin' | 'member';
  expires_at: string;
  created_at: string;
}

// Context types
export interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  organizationMembers: OrganizationMember[];
  organizationInvites: OrganizationInvite[];
  isLoading: boolean;
  error: string | null;
  
  // Organization management
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (id: string, data: UpdateOrganizationData) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  joinOrganization: (data: JoinOrganizationData) => Promise<void>;
  leaveOrganization: (organizationId: string) => Promise<void>;
  switchOrganization: (organizationId: string | null) => Promise<void>;
  
  // Member management
  inviteUser: (organizationId: string, data: InviteUserData) => Promise<void>;
  updateMemberRole: (memberId: string, data: UpdateMemberRoleData) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  
  // Utility functions
  refreshOrganizations: () => Promise<void>;
  getUserRole: (organizationId: string) => 'owner' | 'admin' | 'member' | null;
  canManageOrganization: (organizationId: string) => boolean;
  canManageMembers: (organizationId: string) => boolean;
}

// Hook return types
export interface UseOrganizationsReturn extends OrganizationContextType {}

export interface UseOrganizationMembersReturn {
  members: OrganizationMember[];
  invites: OrganizationInvite[];
  isLoading: boolean;
  error: string | null;
  inviteUser: (data: InviteUserData) => Promise<void>;
  updateMemberRole: (memberId: string, data: UpdateMemberRoleData) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
}

// Component prop types
export interface OrganizationSelectorProps {
  value?: string | null;
  onValueChange?: (organizationId: string | null) => void;
  className?: string;
}

export interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (organization: Organization) => void;
}

export interface JoinOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (organization: Organization) => void;
}

export interface OrganizationSettingsProps {
  organization: Organization;
  onUpdate?: (organization: Organization) => void;
  onDelete?: () => void;
}

export interface MemberManagementProps {
  organizationId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
}

export interface InviteUserDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Error types
export interface OrganizationError {
  message: string;
  code?: string;
  details?: unknown;
  name: string;
}

export interface AccessCodeError {
  message: string;
  code: 'INVALID_ACCESS_CODE';
  details?: unknown;
  name: 'AccessCodeError';
}

export interface PermissionError {
  message: string;
  code: 'INSUFFICIENT_PERMISSIONS';
  details?: unknown;
  name: 'PermissionError';
}

export interface MembershipError {
  message: string;
  code: 'MEMBERSHIP_ERROR';
  details?: unknown;
  name: 'MembershipError';
}

// Error factory functions
export const createOrganizationError = (
  message: string,
  code?: string,
  details?: unknown
): OrganizationError => ({
  message,
  code,
  details,
  name: 'OrganizationError'
});

export const createAccessCodeError = (
  message: string = 'Invalid access code'
): AccessCodeError => ({
  message,
  code: 'INVALID_ACCESS_CODE',
  name: 'AccessCodeError'
});

export const createPermissionError = (
  message: string = 'Insufficient permissions'
): PermissionError => ({
  message,
  code: 'INSUFFICIENT_PERMISSIONS',
  name: 'PermissionError'
});

export const createMembershipError = (
  message: string = 'Membership error'
): MembershipError => ({
  message,
  code: 'MEMBERSHIP_ERROR',
  name: 'MembershipError'
});