import { useEffect, useState } from 'react';
import { Plus, TrendingUp, Trophy, Users, Target, Award, Loader2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTeams, getMatches, getLeaderboard, getMatchRequests } from '../lib/api';
import { supabase } from '../lib/supabase';
import logo from 'figma:asset/a9109d0003972ab9d286aab63c38b1a2b2dbb9dc.png';

interface HomeScreenProps {
  onCreateTeam?: () => void;
  onCreateMatch?: () => void;
  onUpdateResult?: () => void;
  onViewLeaderboard?: () => void;
  onViewTeamProfile?: () => void;
  onTeamNotifications?: () => void;
}

export default function HomeScreen({ 
  onCreateTeam, 
  onCreateMatch, 
  onUpdateResult,
  onViewLeaderboard,
  onViewTeamProfile,
  onTeamNotifications
}: HomeScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [topTeams, setTopTeams] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [user]);

  // Refresh match requests count when component comes into focus or becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (userTeam) {
        loadMatchRequestsCount();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && userTeam) {
        loadMatchRequestsCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userTeam]);

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
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);

        // Get user's team (if captain)
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', profile.id)
          .single();

        if (team) {
          setUserTeam(team);

          // Get upcoming matches for user's team
          const { data: matches } = await getMatches({
            teamId: team.id,
            upcoming: true,
          });
          setUpcomingMatches(matches || []);

          // Get pending match requests count
          await loadMatchRequestsCount(team.id);
        }
      }

      // Get top teams for leaderboard
      const { data: leaderboard } = await getLeaderboard(3);
      setTopTeams(leaderboard || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchRequestsCount = async (teamId?: string) => {
    const teamIdToUse = teamId || userTeam?.id;
    if (!teamIdToUse) return;

    try {
      const { data: requests } = await getMatchRequests(teamIdToUse);
      if (requests) {
        const pendingCount = requests.filter(
          (req: any) => req.requested_team_id === teamIdToUse && req.status === 'pending'
        ).length;
        setPendingRequestsCount(pendingCount);
      } else {
        setPendingRequestsCount(0);
      }
    } catch (error) {
      console.error('Error loading match requests count:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
          <Loader2 className="w-8 h-8 animate-spin text-[#00FF57] mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-8 relative">
        <h1 className="text-3xl mb-2">
          Welcome, <span className="text-[#00FF57]">{userProfile?.full_name || 'Player'}!</span>
        </h1>
        <p className="text-zinc-500">Ready to dominate the court?</p>
        
        {/* Logo in top-right corner */}
        <div className="absolute top-12 right-6">
          <img 
            src={logo} 
            alt="Futsal Hub Karachi" 
            className="w-12 h-12 object-contain"
          />
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-zinc-400">Quick Actions</h2>
            {onTeamNotifications && userTeam && (
              <button
                onClick={onTeamNotifications}
                className="relative p-2 text-zinc-400 hover:text-[#00FF57] transition-colors active:scale-95"
              >
                <Bell className="w-6 h-6" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onCreateMatch}
              className="bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,255,87,0.2)]"
            >
              <Plus className="w-6 h-6 text-black" />
              <span className="text-xs text-black">Create Match</span>
            </button>

            <button
              onClick={onUpdateResult}
              className="bg-zinc-900 border-2 border-[#00FF57]/30 rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <Target className="w-6 h-6 text-[#00FF57]" />
              <span className="text-xs text-zinc-300">Update Result</span>
            </button>

            <button
              onClick={onViewLeaderboard}
              className="bg-zinc-900 border-2 border-[#FF6600]/30 rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <Trophy className="w-6 h-6 text-[#FF6600]" />
              <span className="text-xs text-zinc-300">Join Cup</span>
            </button>
          </div>
        </div>

        {/* Team Stats Preview */}
        {userTeam ? (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 mb-8 border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div 
                onClick={onViewTeamProfile}
                className="flex-1 cursor-pointer active:scale-98 transition-transform"
              >
                <h3 className="text-xl mb-1">{userTeam.name}</h3>
                <p className="text-zinc-500 text-sm">Your Team</p>
              </div>
              <div className="text-right">
                <div className="text-3xl text-[#00FF57] mb-1">{userTeam.rating?.toFixed(1) || '5.0'}</div>
                <p className="text-zinc-500 text-xs">Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl text-white mb-1">{userTeam.wins || 0}</div>
                <p className="text-zinc-500 text-xs">Wins</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-zinc-400 mb-1">{userTeam.losses || 0}</div>
                <p className="text-zinc-500 text-xs">Losses</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-[#FF6600] mb-1">#{userTeam.rank || '-'}</div>
                <p className="text-zinc-500 text-xs">Rank</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-[#00FF57] mb-1">{userTeam.total_mvps || 0}</div>
                <p className="text-zinc-500 text-xs">MVPs</p>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={onCreateTeam}
            className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-6 mb-8 border-2 border-dashed border-[#00FF57]/30 cursor-pointer active:scale-98 transition-transform text-center"
          >
            <Users className="w-12 h-12 text-[#00FF57] mx-auto mb-3 opacity-50" />
            <p className="text-zinc-400 mb-2">You don't have a team yet</p>
            <p className="text-[#00FF57] text-sm">Tap to create your team</p>
          </div>
        )}

        {/* Upcoming Matches */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-zinc-400">Upcoming Matches</h2>
            {upcomingMatches.length > 0 && (
              <button className="text-[#00FF57] text-sm">View All</button>
            )}
          </div>

          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.slice(0, 2).map((match) => {
                const isTeamA = match.team_a_id === userTeam?.id;
                const opponent = isTeamA ? match.team_b : match.team_a;
                const statusColor = match.status === 'confirmed' ? 'bg-[#FF6600]/20 text-[#FF6600]' : 'bg-yellow-500/20 text-yellow-500';
                const statusText = match.status === 'confirmed' ? 'Confirmed' : 'Pending';

                return (
                  <div key={match.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-zinc-500">
                        {match.scheduled_date ? formatDate(match.scheduled_date) : 'TBD'}, {match.scheduled_time ? formatTime(match.scheduled_time) : ''}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-black" />
                        </div>
                        <div>
                          <p className="text-sm">{userTeam?.name || 'Your Team'}</p>
                          <p className="text-xs text-zinc-500">Rating: {userTeam?.rating?.toFixed(1) || '5.0'}</p>
                        </div>
                      </div>
                      <div className="text-zinc-500">VS</div>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm text-right">{opponent?.name || 'Opponent'}</p>
                          <p className="text-xs text-zinc-500 text-right">Rating: {opponent?.rating?.toFixed(1) || '5.0'}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#007BFF] to-[#0056b3] rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    {match.location && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500">📍 {match.location}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 text-center">
              <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No upcoming matches</p>
              <button
                onClick={onCreateMatch}
                className="text-[#00FF57] text-sm mt-2"
              >
                Create a match
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard Teaser */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-[#00FF57]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00FF57]" />
              <h2 className="text-lg">Top Teams</h2>
            </div>
            <button 
              onClick={onViewLeaderboard}
              className="text-[#00FF57] text-sm"
            >
              View All
            </button>
          </div>

          {topTeams.length > 0 ? (
            <div className="space-y-3">
              {topTeams.map((team, index) => (
                <div key={team.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-br from-zinc-400 to-zinc-500' :
                    'bg-gradient-to-br from-orange-600 to-orange-700'
                  }`}>
                    <span className="text-sm text-black">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{team.name}</p>
                    <p className="text-xs text-zinc-500">{team.wins || 0} wins</p>
                  </div>
                  <div className="text-[#00FF57]">{team.rating?.toFixed(1) || '5.0'}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-4">No teams yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
