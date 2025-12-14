import { useEffect, useState } from 'react';
import { Users, TrendingUp, Search, UserPlus, Loader2, Bell } from 'lucide-react';
import { getTeams, getMatchRequests } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import logo from 'figma:asset/a9109d0003972ab9d286aab63c38b1a2b2dbb9dc.png';

export default function TeamsScreen({ onViewTeam, onInvitePlayers, onTeamNotifications }: { 
  onViewTeam: (teamId: string) => void;
  onInvitePlayers?: () => void;
  onTeamNotifications?: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    loadTeams();
  }, [user]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      
      // Get user's profile to find their team
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('captain_id', profile.id)
            .single();

          if (team) {
            setUserTeamId(team.id);
            // Load pending match requests count
            loadMatchRequestsCount(team.id);
          }
        }
      }

      // Get all teams
      const { data, error } = await getTeams();
      if (error) {
        console.error('Error loading teams:', error);
      } else {
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchRequestsCount = async (teamId: string) => {
    try {
      const { data: requests } = await getMatchRequests(teamId);
      if (requests) {
        const pendingCount = requests.filter(
          (req: any) => req.requested_team_id === teamId && req.status === 'pending'
        ).length;
        setPendingRequestsCount(pendingCount);
      } else {
        setPendingRequestsCount(0);
      }
    } catch (error) {
      console.error('Error loading match requests count:', error);
    }
  };

  // Refresh notification count when component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (userTeamId) {
        loadMatchRequestsCount(userTeamId);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && userTeamId) {
        loadMatchRequestsCount(userTeamId);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userTeamId]);

  const filteredTeams = teams
    .filter(team =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // Sort user's team to the top
      if (a.id === userTeamId && b.id !== userTeamId) return -1;
      if (a.id !== userTeamId && b.id === userTeamId) return 1;
      // For other teams, sort by rating (highest first)
      return (b.rating || 5.0) - (a.rating || 5.0);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-[#00FF57] blur-2xl opacity-30 rounded-full animate-pulse"></div>
            <div className="relative w-16 h-16 mx-auto">
              <img 
                src={logo} 
                alt="Futsal Connect" 
                className="w-full h-full object-contain animate-pulse"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>
          <p className="text-zinc-400 text-sm">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-5">
        <h1 className="text-2xl mb-2">
          <span className="text-[#00FF57]">Teams</span>
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">Discover futsal teams in Karachi</p>
          {onTeamNotifications && userTeamId && (
            <button
              onClick={onTeamNotifications}
              className="relative p-1.5 text-zinc-400 hover:text-[#00FF57] transition-colors active:scale-95"
            >
              <Bell className="w-4 h-4" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {userTeamId && (
        <div className="px-6 pb-4">
          <button
            onClick={onInvitePlayers}
            className="w-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl py-2 text-black text-sm font-medium flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-[0_0_15px_rgba(0,255,87,0.15)]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Players to Team
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#00FF57]/50 focus:outline-none focus:ring-1 focus:ring-[#00FF57]/20 transition-all"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="px-6 pb-6">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2 text-sm">
              {searchQuery ? 'No teams found matching your search' : 'No teams registered yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#00FF57] text-sm mt-4"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map((team) => {
              const isMyTeam = team.id === userTeamId;
              const winRate = team.wins + team.losses > 0
                ? Math.round((team.wins / (team.wins + team.losses)) * 100)
                : 0;

              return (
                <div
                  key={team.id}
                  onClick={() => onViewTeam(team.id)}
                  className={`rounded-xl p-4 border transition-all cursor-pointer active:scale-98 ${
                    isMyTeam
                      ? 'bg-gradient-to-r from-[#00FF57]/20 to-transparent border-[#00FF57]'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isMyTeam
                          ? 'bg-gradient-to-br from-[#00FF57] to-[#00cc44]'
                          : 'bg-gradient-to-br from-zinc-700 to-zinc-800'
                      }`}>
                        <Users className={`w-6 h-6 ${isMyTeam ? 'text-black' : 'text-white'}`} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold truncate ${isMyTeam ? 'text-[#00FF57]' : 'text-white'}`}>
                          {team.name}
                        </h3>
                        {isMyTeam && (
                          <span className="bg-[#00FF57] text-black px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                            Your Team
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {team.wins || 0}W - {team.losses || 0}L
                        </span>
                        <span>{team.age_group}</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-semibold mb-0.5 ${isMyTeam ? 'text-[#00FF57]' : 'text-white'}`}>
                        {team.rating?.toFixed(1) || '5.0'}
                      </div>
                      <div className="text-xs text-zinc-500">Rating</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
