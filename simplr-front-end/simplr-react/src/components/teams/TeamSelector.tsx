import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Users, Settings, LogOut } from 'lucide-react';
import { useTeam } from '@/contexts/TeamContext';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreateTeamModal } from './CreateTeamModal';
import { JoinTeamModal } from './JoinTeamModal';
import { TeamSettingsModal } from './TeamSettingsModal';
import type { Team } from '@/types';

export function TeamSelector() {
  const { 
    teams, 
    currentTeam, 
    setCurrentTeam, 
    leaveTeam, 
    teamMembers,
    isLoading 
  } = useTeam();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleTeamSelect = (team: Team) => {
    setCurrentTeam(team);
    setIsOpen(false);
  };

  const handleLeaveTeam = async (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to leave "${team.name}"?`)) {
      try {
        await leaveTeam(team.id);
      } catch (error) {
        console.error('Error leaving team:', error);
      }
    }
  };

  const getCurrentUserRole = () => {
    if (!currentTeam || !teamMembers.length) return null;
    const currentMember = teamMembers.find(member => member.user_id === currentTeam.created_by);
    return currentMember?.role || 'member';
  };

  const canManageTeam = () => {
    const role = getCurrentUserRole();
    return role === 'owner' || role === 'admin';
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-auto p-3 hover:bg-accent/50"
          disabled={isLoading}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {currentTeam ? currentTeam.name.charAt(0).toUpperCase() : 'P'}
              </div>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">
                {currentTeam ? currentTeam.name : 'Personal'}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentTeam ? `${teamMembers.length} members` : 'Individual workspace'}
              </span>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="p-2">
                {/* Personal workspace */}
                <Button
                  variant="ghost"
                  onClick={() => handleTeamSelect(null as any)}
                  className={`w-full justify-start h-auto p-3 ${
                    !currentTeam ? 'bg-accent' : 'hover:bg-accent/50'
                  }`}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-medium">
                      P
                    </div>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Personal</span>
                    <span className="text-xs text-muted-foreground">Individual workspace</span>
                  </div>
                </Button>

                {teams.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      {teams.map((team) => (
                        <div key={team.id} className="group relative">
                          <Button
                            variant="ghost"
                            onClick={() => handleTeamSelect(team)}
                            className={`w-full justify-start h-auto p-3 pr-10 ${
                              currentTeam?.id === team.id ? 'bg-accent' : 'hover:bg-accent/50'
                            }`}
                          >
                            <Avatar className="h-8 w-8 mr-3">
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                {team.name.charAt(0).toUpperCase()}
                              </div>
                            </Avatar>
                            <div className="flex flex-col items-start flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{team.name}</span>
                                {team.created_by && (
                                  <Badge variant="secondary" className="text-xs">
                                    Owner
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {team.description || 'No description'}
                              </span>
                            </div>
                          </Button>
                          
                          {/* Team actions */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleLeaveTeam(team, e)}
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <LogOut className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator className="my-2" />
                
                {/* Team actions */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full justify-start h-auto p-3"
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    <span className="text-sm">Create team</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowJoinModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full justify-start h-auto p-3"
                  >
                    <Users className="h-4 w-4 mr-3" />
                    <span className="text-sm">Join team</span>
                  </Button>

                  {currentTeam && canManageTeam() && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowSettingsModal(true);
                        setIsOpen(false);
                      }}
                      className="w-full justify-start h-auto p-3"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      <span className="text-sm">Team settings</span>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CreateTeamModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <JoinTeamModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)} 
      />
      {currentTeam && (
        <TeamSettingsModal 
          isOpen={showSettingsModal} 
          onClose={() => setShowSettingsModal(false)} 
          team={currentTeam} 
        />
      )}
    </>
  );
}