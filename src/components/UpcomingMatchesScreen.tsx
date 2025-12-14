import { useEffect, useState } from 'react';
import { ChevronLeft, Users, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMatches } from '../lib/api';
import { supabase } from '../lib/supabase';
import logo from 'figma:asset/a9109d0003972ab9d286aab63c38b1a2b2dbb9dc.png';

interface UpcomingMatchesScreenProps {
  onBack: () => void;
}

export default function UpcomingMatchesScreen({ onBack }: UpcomingMatchesScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    
    // Refresh data when window comes into focus
    const handleFocus = () => {
      if (userTeam) {
        loadMatches();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

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
        // Get user's team (if captain)
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', profile.id)
          .single();

        if (team) {
          setUserTeam(team);
          await loadMatches(team.id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (teamId?: string) => {
    const teamIdToUse = teamId || userTeam?.id;
    if (!teamIdToUse) return;

    try {
      const { data: matches } = await getMatches({
        teamId: teamIdToUse,
        upcoming: true,
      });
      setUpcomingMatches(matches || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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
          <p className="text-zinc-400 text-sm">Loading matches...</p>
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
          <h1 className="text-3xl mb-2">Upcoming <span className="text-[#00FF57]">Matches</span></h1>
        </div>
        <div className="px-6 py-12 text-center">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">You need to create a team first to view matches</p>
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
        <h1 className="text-3xl mb-2">Upcoming <span className="text-[#00FF57]">Matches</span></h1>
        <p className="text-zinc-500">All your scheduled matches</p>
      </div>

      {/* Matches List */}
      <div className="px-6 py-4">
        {upcomingMatches.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-2">No upcoming matches</p>
            <p className="text-zinc-600 text-sm">Schedule a match to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match) => {
              const isTeamA = match.team_a_id === userTeam.id;
              const opponent = isTeamA ? match.team_b : match.team_a;
              const statusColor = match.status === 'confirmed' 
                ? 'bg-[#FF6600]/20 text-[#FF6600] border-[#FF6600]/30' 
                : match.status === 'completed'
                ? 'bg-green-500/20 text-green-500 border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
              const statusText = match.status === 'confirmed' 
                ? 'Confirmed' 
                : match.status === 'completed'
                ? 'Completed'
                : 'Pending';

              return (
                <div key={match.id} className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  {/* Date and Status */}
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
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor} font-medium`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Teams */}
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
                    <div className="text-zinc-500 mx-3 font-semibold">VS</div>
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
                    <div className="flex items-center gap-2 text-zinc-400 pt-3 border-t border-zinc-800">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">{match.location}</span>
                    </div>
                  )}

                  {/* Score (if completed) */}
                  {match.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{isTeamA ? match.team_a_score : match.team_b_score}</div>
                          <div className="text-xs text-zinc-500">{userTeam.name}</div>
                        </div>
                        <div className="text-zinc-500">-</div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{isTeamA ? match.team_b_score : match.team_a_score}</div>
                          <div className="text-xs text-zinc-500">{opponent?.name || 'Opponent'}</div>
                        </div>
                      </div>
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

