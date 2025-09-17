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
  team_id?: string;
  is_team_task?: boolean;
  assigned_to?: string;
  assignee?: User;
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

export interface CategoryConfig {
  color: string;
  priority: number;
  displayName: string;
}

export type TaskView = 'today' | 'upcoming' | 'completed';

// Team Management Types
export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamStatus = 'active' | 'suspended' | 'archived';

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  join_code: string;
  status: TeamStatus;
  max_members: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: TeamRole;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  invited_by?: string;
  user?: User;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  invited_by: string;
  email?: string;
  join_code: string;
  expires_at: string;
  used_at?: string;
  used_by?: string;
  created_at: string;
  team?: Team;
  inviter?: User;
}

export interface TeamStats {
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  pending_invites: number;
}

// Authentication Types
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
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

// Team Hook Return Types
export interface UseTeamsReturn {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  teamStats: TeamStats | null;
  createTeam: (data: CreateTeamData) => Promise<Team>;
  joinTeam: (joinCode: string) => Promise<Team>;
  leaveTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, email?: string) => Promise<TeamInvite>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, role: TeamRole) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  refreshTeamData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Team Form Types
export interface CreateTeamData {
  name: string;
  description?: string;
  max_members?: number;
}

export interface JoinTeamData {
  join_code: string;
}

export interface TeamSettingsData {
  name: string;
  description?: string;
  max_members: number;
}

// Team Context Types
export interface TeamContextState {
  teams: Team[];
  currentTeam: Team | null;
  teamMembers: TeamMember[];
  teamStats: TeamStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface TeamContextActions {
  createTeam: (data: CreateTeamData) => Promise<Team>;
  joinTeam: (joinCode: string) => Promise<Team>;
  leaveTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, email?: string) => Promise<TeamInvite>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, role: TeamRole) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  refreshTeamData: () => Promise<void>;
}

export interface UseTeamContextReturn extends TeamContextState, TeamContextActions {}