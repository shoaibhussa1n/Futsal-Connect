import { useEffect, useState } from 'react';
import { Users, TrendingUp, Search, UserPlus, Loader2, Bell } from 'lucide-react';
import { getTeams } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <h1 className="text-3xl mb-2">
          <span className="text-[#00FF57]">Teams</span>
        </h1>
        <p className="text-zinc-500">Discover futsal teams in Karachi</p>
      </div>

      {/* Action Buttons */}
      {userTeamId && (
        <div className="px-6 pb-4 space-y-3">
          <button
            onClick={onInvitePlayers}
            className="w-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl py-3 text-black font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-[0_0_20px_rgba(0,255,87,0.2)]"
          >
            <UserPlus className="w-5 h-5" />
            Invite Players to Team
          </button>
          {onTeamNotifications && (
            <button
              onClick={onTeamNotifications}
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl py-3 text-[#00FF57] font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <Bell className="w-5 h-5" />
              Match Requests
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="px-6 pb-6">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2">
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
                  onClick={isMyTeam ? () => onViewTeam(team.id) : undefined}
                  className={`rounded-2xl p-5 border transition-all ${
                    isMyTeam
                      ? 'bg-gradient-to-r from-[#00FF57]/20 to-transparent border-[#00FF57] cursor-pointer active:scale-98'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isMyTeam
                          ? 'bg-gradient-to-br from-[#00FF57] to-[#00cc44]'
                          : 'bg-gradient-to-br from-zinc-700 to-zinc-800'
                      }`}>
                        <Users className={`w-7 h-7 ${isMyTeam ? 'text-black' : 'text-white'}`} />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={isMyTeam ? 'text-[#00FF57]' : ''}>
                          {team.name}
                        </h3>
                        {isMyTeam && (
                          <span className="bg-[#00FF57] text-black px-2 py-0.5 rounded-full text-xs">
                            Your Team
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {team.wins || 0}W - {team.losses || 0}L
                        </span>
                        <span>{team.age_group}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl mb-1 ${isMyTeam ? 'text-[#00FF57]' : 'text-white'}`}>
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
