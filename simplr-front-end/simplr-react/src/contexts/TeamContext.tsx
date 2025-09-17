import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { 
  Team, 
  TeamMember, 
  TeamStats, 
  TeamContextState, 
  TeamContextActions, 
  UseTeamContextReturn,
  CreateTeamData,
  TeamRole 
} from '@/types';
import { DatabaseService } from '@/lib/database';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/useToastContext';

const TeamContext = createContext<UseTeamContextReturn | undefined>(undefined);

interface TeamProviderProps {
  children: React.ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [state, setState] = useState<TeamContextState>({
    teams: [],
    currentTeam: null,
    teamMembers: [],
    teamStats: null,
    isLoading: false,
    error: null,
  });

  // Load user teams when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserTeams();
    } else {
      // Clear team data when not authenticated
      setState({
        teams: [],
        currentTeam: null,
        teamMembers: [],
        teamStats: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated, user]);

  // Load team members and stats when current team changes
  useEffect(() => {
    if (state.currentTeam && user) {
      loadTeamData(state.currentTeam.id);
    } else {
      setState(prev => ({
        ...prev,
        teamMembers: [],
        teamStats: null,
      }));
    }
  }, [state.currentTeam, user]);

  const loadUserTeams = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const teams = await DatabaseService.getUserTeams(user.id);
      setState(prev => ({ 
        ...prev, 
        teams, 
        isLoading: false,
        // If current team is not in the list, clear it
        currentTeam: prev.currentTeam && teams.find(t => t.id === prev.currentTeam?.id) 
          ? prev.currentTeam 
          : teams.length > 0 ? teams[0] : null
      }));
    } catch (error) {
      console.error('Error loading teams:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load teams' 
      }));
    }
  }, [user]);

  const loadTeamData = useCallback(async (teamId: string) => {
    if (!user) return;

    try {
      const [members, stats] = await Promise.all([
        DatabaseService.getTeamMembers(teamId),
        DatabaseService.getTeamStats(teamId)
      ]);

      setState(prev => ({
        ...prev,
        teamMembers: members,
        teamStats: stats,
      }));
    } catch (error) {
      console.error('Error loading team data:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load team data' 
      }));
    }
  }, [user]);

  const createTeam = useCallback(async (data: CreateTeamData): Promise<Team> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newTeam = await DatabaseService.createTeam(data, user.id);
      
      setState(prev => ({
        ...prev,
        teams: [...prev.teams, newTeam],
        currentTeam: newTeam,
        isLoading: false,
      }));

      showToast(`Team "${newTeam.name}" created successfully!`, 'success');
      return newTeam;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create team';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, showToast]);

  const joinTeam = useCallback(async (joinCode: string): Promise<Team> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const team = await DatabaseService.joinTeam(joinCode, user.id);
      
      setState(prev => ({
        ...prev,
        teams: [...prev.teams, team],
        currentTeam: team,
        isLoading: false,
      }));

      showToast(`Successfully joined "${team.name}"!`, 'success');
      return team;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join team';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, showToast]);

  const leaveTeam = useCallback(async (teamId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await DatabaseService.leaveTeam(teamId, user.id);
      
      setState(prev => {
        const updatedTeams = prev.teams.filter(t => t.id !== teamId);
        return {
          ...prev,
          teams: updatedTeams,
          currentTeam: prev.currentTeam?.id === teamId 
            ? (updatedTeams.length > 0 ? updatedTeams[0] : null)
            : prev.currentTeam,
          isLoading: false,
        };
      });

      showToast('Left team successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave team';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, showToast]);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await DatabaseService.updateTeam(teamId, updates, user.id);
      
      setState(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === teamId ? { ...t, ...updates } : t),
        currentTeam: prev.currentTeam?.id === teamId 
          ? { ...prev.currentTeam, ...updates }
          : prev.currentTeam,
        isLoading: false,
      }));

      showToast('Team updated successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, showToast]);

  const deleteTeam = useCallback(async (teamId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await DatabaseService.deleteTeam(teamId, user.id);
      
      setState(prev => {
        const updatedTeams = prev.teams.filter(t => t.id !== teamId);
        return {
          ...prev,
          teams: updatedTeams,
          currentTeam: prev.currentTeam?.id === teamId 
            ? (updatedTeams.length > 0 ? updatedTeams[0] : null)
            : prev.currentTeam,
          isLoading: false,
        };
      });

      showToast('Team deleted successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, showToast]);

  const inviteMember = useCallback(async (teamId: string, email?: string) => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // For now, we'll just generate a new join code since we don't have email invites implemented
      const team = state.teams.find(t => t.id === teamId);
      if (!team) throw new Error('Team not found');

      setState(prev => ({ ...prev, isLoading: false }));
      showToast(`Share join code: ${team.join_code}`, 'info', 10000);
      
      return {
        id: `invite_${Date.now()}`,
        team_id: teamId,
        invited_by: user.id,
        email,
        join_code: team.join_code,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, state.teams, showToast]);

  const removeMember = useCallback(async (teamId: string, userId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await DatabaseService.removeMember(teamId, userId, user.id);
      
      // Refresh team members
      if (state.currentTeam?.id === teamId) {
        await loadTeamData(teamId);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      showToast('Member removed successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, state.currentTeam, loadTeamData, showToast]);

  const updateMemberRole = useCallback(async (teamId: string, userId: string, role: TeamRole): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await DatabaseService.updateMemberRole(teamId, userId, role, user.id);
      
      // Refresh team members
      if (state.currentTeam?.id === teamId) {
        await loadTeamData(teamId);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      showToast('Member role updated successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member role';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      showToast(errorMessage, 'error');
      throw error;
    }
  }, [user, state.currentTeam, loadTeamData, showToast]);

  const setCurrentTeam = useCallback((team: Team | null) => {
    setState(prev => ({ ...prev, currentTeam: team }));
  }, []);

  const refreshTeamData = useCallback(async (): Promise<void> => {
    if (user) {
      await loadUserTeams();
    }
  }, [loadUserTeams, user]);

  const value: UseTeamContextReturn = {
    ...state,
    createTeam,
    joinTeam,
    leaveTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    removeMember,
    updateMemberRole,
    setCurrentTeam,
    refreshTeamData,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): UseTeamContextReturn {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}