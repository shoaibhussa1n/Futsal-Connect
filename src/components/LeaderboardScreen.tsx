import { useEffect, useState } from 'react';
import { ChevronLeft, Trophy, TrendingUp, Award, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [userTeam, setUserTeam] = useState<any>(null);

  useEffect(() => {
    loadLeaderboard();
    
    // Set up realtime subscription for live updates
    const subscription = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await getLeaderboard(50);
      
      if (error) {
        console.error('Error loading leaderboard:', error);
      } else {
        const sortedTeams = (data || []).map((team, index) => ({
          ...team,
          rank: index + 1,
        }));
        setTeams(sortedTeams);

        // Find user's team if they have one
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            const { data: team } = await supabase
              .from('teams')
              .select('*')
              .eq('captain_id', profile.id)
              .single();

            if (team) {
              const teamWithRank = sortedTeams.find(t => t.id === team.id);
              if (teamWithRank) {
                setUserTeam({ ...team, rank: teamWithRank.rank });
              } else {
                setUserTeam({ ...team, rank: sortedTeams.length + 1 });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
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

  const topThree = teams.slice(0, 3);
  const rest = teams.slice(3);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6 sticky top-0 z-10">
        <button onClick={onBack} className="text-[#00FF57] mb-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl mb-2">
          <span className="text-[#00FF57]">Leaderboard</span>
        </h1>
        <p className="text-zinc-500">Top teams in Karachi</p>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3 mb-8">
            {/* 2nd Place */}
            <div className="pt-8">
              <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-2xl p-4 text-center border-2 border-zinc-600">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-zinc-400 to-zinc-500 rounded-full flex items-center justify-center">
                  <span className="text-xl">2</span>
                </div>
                <p className="text-xs mb-1 truncate">{topThree[1].name}</p>
                <p className="text-[#00FF57]">{topThree[1].rating?.toFixed(1) || '5.0'}</p>
              </div>
            </div>

            {/* 1st Place */}
            <div>
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-4 text-center border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-200" />
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-xl text-black">1</span>
                </div>
                <p className="text-xs mb-1 truncate text-yellow-100">{topThree[0].name}</p>
                <p className="text-yellow-50">{topThree[0].rating?.toFixed(1) || '5.0'}</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="pt-12">
              <div className="bg-gradient-to-br from-orange-700 to-orange-800 rounded-2xl p-4 text-center border-2 border-orange-600">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-xl">3</span>
                </div>
                <p className="text-xs mb-1 truncate">{topThree[2].name}</p>
                <p className="text-[#00FF57]">{topThree[2].rating?.toFixed(1) || '5.0'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings List */}
      <div className="px-6 pb-6">
        <div className="space-y-2">
          {teams.map((team) => {
            const isCurrentUser = userTeam && team.id === userTeam.id;
            return (
              <div
                key={team.id}
                className={`rounded-xl p-4 border transition-all ${
                  isCurrentUser
                    ? 'bg-gradient-to-r from-[#00FF57]/20 to-transparent border-[#00FF57] shadow-[0_0_20px_rgba(0,255,87,0.2)]'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      team.rank === 1
                        ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                        : team.rank === 2
                        ? 'bg-gradient-to-br from-zinc-400 to-zinc-500'
                        : team.rank === 3
                        ? 'bg-gradient-to-br from-orange-600 to-orange-700'
                        : isCurrentUser
                        ? 'bg-gradient-to-br from-[#00FF57] to-[#00cc44]'
                        : 'bg-zinc-800'
                    }`}
                  >
                    <span className={team.rank <= 3 || isCurrentUser ? 'text-black' : 'text-white'}>
                      {team.rank}
                    </span>
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`mb-1 truncate ${isCurrentUser ? 'text-[#00FF57]' : ''}`}>
                      {team.name}
                      {isCurrentUser && <span className="ml-2 text-xs text-[#00FF57]">(You)</span>}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {team.wins || 0}W - {team.losses || 0}L
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {team.total_mvps || 0} MVPs
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-right">
                    <div className={`text-2xl mb-1 ${isCurrentUser ? 'text-[#00FF57]' : 'text-white'}`}>
                      {team.rating?.toFixed(1) || '5.0'}
                    </div>
                    <div className="text-xs text-zinc-500">Rating</div>
                  </div>
                </div>
              </div>
            );
          })}

          {teams.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No teams yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
