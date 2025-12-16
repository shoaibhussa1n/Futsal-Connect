import { useEffect, useState } from 'react';
import { ChevronLeft, Trophy, Users, Calendar, MapPin, Clock, Loader2, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamMatchHistory } from '../lib/api';
import { supabase } from '../lib/supabase';
import logo from 'figma:asset/a9109d0003972ab9d286aab63c38b1a2b2dbb9dc.png';

interface MatchHistoryScreenProps {
  onBack: () => void;
  teamId?: string;
}

export default function MatchHistoryScreen({ onBack, teamId }: MatchHistoryScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user, teamId]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Get user's team
        const teamIdToUse = teamId || (await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', profile.id)
          .single()).data?.id;

        if (teamIdToUse) {
          const { data: team } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamIdToUse)
            .single();

          if (team) {
            setUserTeam(team);
            await loadMatchHistory(team.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchHistory = async (teamId: string) => {
    try {
      const { data, error } = await getTeamMatchHistory(teamId);
      if (error) {
        console.error('Error loading match history:', error);
        return;
      }
      setMatchHistory(data || []);
    } catch (error) {
      console.error('Error loading match history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#00FF57] blur-2xl opacity-30 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto">
              <img 
                src={logo} 
                alt="Futsal Connect" 
                className="w-full h-full object-contain animate-pulse"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>
          <p className="text-zinc-400 text-sm">Loading match history...</p>
        </div>
      </div>
    );
  }

  if (!userTeam) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
          <button onClick={onBack} className="text-[#00FF57] mb-4 flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl mb-2">Match <span className="text-[#00FF57]">History</span></h1>
        </div>
        <div className="px-6 py-12 text-center">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">You need to be a team captain to view match history</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <button onClick={onBack} className="text-[#00FF57] mb-4 flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl mb-2">Match <span className="text-[#00FF57]">History</span></h1>
        <p className="text-zinc-500">{userTeam.name}</p>
      </div>

      {/* Match History List */}
      <div className="px-6 py-4">
        {matchHistory.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2">No match history yet</p>
            <p className="text-zinc-600 text-sm">Completed matches will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchHistory.map((match) => {
              const isTeamA = match.team_a_id === userTeam.id;
              const opponent = isTeamA ? match.team_b : match.team_a;
              const userScore = isTeamA ? match.team_a_score : match.team_b_score;
              const opponentScore = isTeamA ? match.team_b_score : match.team_a_score;
              const won = userScore > opponentScore;
              const lost = userScore < opponentScore;
              const isDraw = userScore === opponentScore;

              return (
                <div key={match.id} className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
                  {/* Date and Result */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDate(match.scheduled_date || '')}
                      </span>
                      {match.scheduled_time && (
                        <>
                          <Clock className="w-4 h-4 ml-2" />
                          <span className="text-sm">
                            {formatTime(match.scheduled_time)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      won ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                      lost ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    }`}>
                      {won ? 'Won' : lost ? 'Lost' : 'Draw'}
                    </div>
                  </div>

                  {/* Teams and Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {userTeam.logo_url ? (
                        <img src={userTeam.logo_url} alt={userTeam.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-black" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{userTeam.name}</p>
                        <p className="text-xs text-zinc-400">Rating: {userTeam.rating?.toFixed(1) || '5.0'}</p>
                      </div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="text-2xl font-bold text-white">
                        {userScore} - {opponentScore}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="min-w-0 text-right">
                        <p className="text-sm font-semibold text-white truncate">{opponent?.name || 'Opponent'}</p>
                        <p className="text-xs text-zinc-400">Rating: {opponent?.rating?.toFixed(1) || '5.0'}</p>
                      </div>
                      {opponent?.logo_url ? (
                        <img src={opponent.logo_url} alt={opponent.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#007BFF] to-[#0056b3] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {match.location && (
                    <div className="flex items-center gap-2 text-zinc-400 pt-3 border-t border-zinc-800 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">{match.location}</span>
                    </div>
                  )}

                  {/* Goal Scorers */}
                  {match.goal_scorers && match.goal_scorers.length > 0 && (
                    <div className="pt-3 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-2">Goal Scorers:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.goal_scorers.map((scorer: any) => (
                          <div key={scorer.id} className="text-xs bg-zinc-800 px-2 py-1 rounded">
                            {scorer.players?.profiles?.full_name || 'Unknown'} ({scorer.goals})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MVP */}
                  {match.mvp_player_id && (
                    <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#FF6600]" />
                      <span className="text-xs text-zinc-400">MVP: {
                        match.goal_scorers?.find((gs: any) => gs.player_id === match.mvp_player_id)?.players?.profiles?.full_name || 'Unknown'
                      }</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

