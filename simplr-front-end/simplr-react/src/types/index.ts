// Task Management Types
export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  category: TaskCategory;
  completed: boolean;
  checklist: ChecklistItem[] | null;
  dueDate: string | null;
  reminderEnabled?: boolean;
  reminderDateTime?: string | null;
  reminderSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Organization fields
  organizationId?: string | null;
  teamId?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  visibility?: TaskVisibility;
  priority?: TaskPriority;
}

export type TaskCategory = 
  | 'URGENT'
  | 'IMPORTANT'
  | 'WORK'
  | 'PERSONAL'
  | 'HEALTH'
  | 'LEARNING'
  | 'SHOPPING'
  | 'TRAVEL';

export type TaskVisibility = 'private' | 'team' | 'organization';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type OrganizationRole = 'admin' | 'manager' | 'member';
export type TeamRole = 'lead' | 'member';

export interface CategoryConfig {
  color: string;
  priority: number;
  displayName: string;
}

export type TaskView = 'today' | 'upcoming' | 'completed';

// Authentication Types
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  currentOrganizationId?: string | null;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  memberCount?: number;
  teamCount?: number;
}

export interface OrganizationSettings {
  allowPublicJoining: boolean;
  requireApprovalForJoining: boolean;
  maxMembers?: number;
  features: OrganizationFeatures;
}

export interface OrganizationFeatures {
  teams: boolean;
  taskAssignment: boolean;
  analytics: boolean;
  customFields: boolean;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: string;
  invitedBy?: string;
  user?: User;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  memberCount?: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  addedBy: string;
  user?: User;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  inviteCode: string;
  email?: string;
  role: OrganizationRole;
  expiresAt?: string;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
  createdBy: string;
}

export type AuthType = 'google' | 'github' | 'guest';

export interface AuthState {
  user: User | null;
  authType: AuthType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

// Storage Types
export interface StorageMetadata {
  version: string;
  lastModified: string;
  taskCount: number;
  backupCount: number;
}

export interface StorageQuota {
  used: number;
  total: number;
  percentage: number;
}

// UI State Types
export interface AppState {
  tasks: Task[];
  currentView: TaskView;
  editingTaskId: number | null;
  expandedCategories: Record<TaskCategory, boolean>;
  isModalOpen: boolean;
  isSettingsOpen: boolean;
}

// Form Types
export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  dueDate: string;
  checklist: Omit<ChecklistItem, 'id'>[];
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

// Component Props Types
export interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: number) => void;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export interface CategoryPillProps {
  category: TaskCategory;
  isSelected: boolean;
  onClick: (category: TaskCategory) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Hook Return Types
export interface UseTasksReturn {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  clearAllCompleted: () => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<void>;
  updateChecklistItem: (taskId: number, itemId: number, updates: Partial<ChecklistItem>) => Promise<void>;
  getTasksForView: (view: TaskView) => Task[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  joinOrganization: (inviteCode: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface UseThemeReturn extends ThemeState {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export interface UseStorageReturn {
  saveData: <T>(key: string, data: T) => Promise<void>;
  loadData: <T>(key: string) => T | null;
  clearData: (key: string) => void;
  getQuota: () => StorageQuota;
  isAvailable: boolean;
  error: string | null;
}

// Organization Hook Types
export interface UseOrganizationReturn {
  currentOrganization: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  createOrganization: (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'inviteCode' | 'createdBy'>) => Promise<Organization>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  switchOrganization: (organizationId: string | null) => Promise<void>;
  inviteMember: (email: string, role: OrganizationRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: OrganizationRole) => Promise<void>;
  createTeam: (data: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'organizationId'>) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string, role: TeamRole) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  validateInviteCode: (inviteCode: string) => Promise<Organization>;
  joinWithInviteCode: (inviteCode: string) => Promise<void>;
  regenerateInviteCode: (organizationId: string) => Promise<string>;
}

// Organization Context Types
export interface OrganizationContextValue extends UseOrganizationReturn {
  // Additional context-specific properties if needed
}

// Organization State Types
export interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  teams: Team[];
  isLoading: boolean;
  error: string | null;
}