import { useEffect, useState } from 'react';
import { ChevronLeft, Edit, Users, Trophy, Target, Award, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamById, getTeamMembers } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function TeamProfile({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    loadTeamData();
  }, [user]);

  const loadTeamData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Get user's team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', profile.id)
          .single();

        if (teamData && !teamError) {
          setTeam(teamData);

          // Get team members
          const { data: membersData, error: membersError } = await getTeamMembers(teamData.id);
          if (!membersError && membersData) {
            setMembers(membersData);
          }

          // Get team rank
          const { data: leaderboard } = await supabase
            .from('teams')
            .select('id')
            .order('rating', { ascending: false })
            .order('wins', { ascending: false });

          if (leaderboard) {
            const teamIndex = leaderboard.findIndex(t => t.id === teamData.id);
            setRank(teamIndex >= 0 ? teamIndex + 1 : null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black pb-20">
        <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
          <button onClick={onBack} className="text-[#00FF57] mb-4">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl mb-2 text-white">Team Profile</h1>
        </div>
        <div className="px-6 py-12 text-center">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">You don't have a team yet</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  const winRate = team.wins + team.losses > 0
    ? Math.round((team.wins / (team.wins + team.losses + team.draws)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <button onClick={onBack} className="text-[#00FF57] mb-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2 text-white">{team.name}</h1>
            <p className="text-zinc-500">Your Team Profile</p>
          </div>
          <button className="bg-zinc-900 border-2 border-[#00FF57] text-[#00FF57] p-3 rounded-xl active:scale-95 transition-transform">
            <Edit className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6">
        {/* Team Logo & Rating */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 mb-6 border border-[#00FF57]/20 text-center">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-24 h-24 mx-auto mb-4 rounded-2xl object-cover" />
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(0,255,87,0.3)]">
              <Users className="w-12 h-12 text-black" />
            </div>
          )}
          <div className="text-5xl text-[#00FF57] mb-2">{team.rating?.toFixed(1) || '5.0'}</div>
          <p className="text-zinc-500">Team Rating</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-[#00FF57] mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Wins</span>
            </div>
            <div className="text-3xl text-white">{team.wins || 0}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Losses</span>
            </div>
            <div className="text-3xl text-zinc-400">{team.losses || 0}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-[#FF6600] mb-2">
              <Target className="w-5 h-5" />
              <span className="text-xs text-zinc-400">Total Goals</span>
            </div>
            <div className="text-3xl text-white">{team.total_goals || 0}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 text-[#007BFF] mb-2">
              <Award className="w-5 h-5" />
              <span className="text-xs text-zinc-400">MVPs</span>
            </div>
            <div className="text-3xl text-white">{team.total_mvps || 0}</div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="bg-zinc-900 rounded-xl p-5 mb-6 border border-zinc-800">
          <h3 className="text-lg mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-400">Win Rate</span>
                <span className="text-[#00FF57]">{winRate}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00FF57] to-[#00cc44] h-full rounded-full" style={{ width: `${winRate}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-400">Total Matches</span>
                <span className="text-white">{team.wins + team.losses + team.draws || 0}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF6600] to-[#cc5200] h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Rank Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-5 mb-6 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm mb-1">Current Rank</p>
              <h3 className="text-3xl text-[#FF6600]">{rank ? `#${rank}` : 'N/A'}</h3>
              <p className="text-zinc-500 text-sm mt-1">in Karachi</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF6600] to-[#cc5200] rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Team Players</h2>
            <button className="text-[#00FF57] text-sm">+ Add Player</button>
          </div>

          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => {
                const player = member.players;
                const profile = player?.profiles;
                return (
                  <div key={member.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg flex items-center justify-center">
                            <span className="text-black">{profile?.full_name?.charAt(0) || 'P'}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm mb-1">{profile?.full_name || 'Unknown Player'}</p>
                          <p className="text-xs text-zinc-500">{player?.position || 'N/A'} {member.role === 'captain' && '• Captain'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-sm text-white">{player?.goals || 0}</p>
                            <p className="text-xs text-zinc-500">Goals</p>
                          </div>
                          {player?.mvps > 0 && (
                            <div className="text-center">
                              <div className="flex items-center gap-1">
                                <Award className="w-4 h-4 text-[#FF6600]" />
                                <span className="text-sm text-[#FF6600]">{player.mvps}</span>
                              </div>
                              <p className="text-xs text-zinc-500">MVP</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
              No players added yet. Invite players through the Player Marketplace.
            </div>
          )}
        </div>

        {/* Edit Team Button */}
        <button className="w-full bg-zinc-900 border-2 border-[#00FF57] text-[#00FF57] py-4 rounded-xl active:scale-95 transition-transform mb-6">
          Edit Team Details
        </button>
      </div>
    </div>
  );
}
