import { useEffect, useState } from 'react';
import { Trophy, Calendar, Users, Loader2 } from 'lucide-react';
import { getTournaments, registerForTournament } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function TournamentsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [registering, setRegistering] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (filter === 'Open') {
        filters.status = 'open';
      } else if (filter === 'Starting Soon') {
        // Filter by start date
      }
      
      const { data, error } = await getTournaments(filters);
      if (error) {
        console.error('Error loading tournaments:', error);
      } else {
        setTournaments(data || []);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      alert('Please log in to join tournaments');
      return;
    }

    setRegistering(tournamentId);

    try {
      // Get user's profile and team
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        alert('Profile not found');
        setRegistering(null);
        return;
      }

      // Check if user has a team
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('captain_id', profile.id)
        .single();

      if (team) {
        const { error } = await registerForTournament(tournamentId, team.id, undefined);
        if (error) {
          alert(error.message || 'Failed to register');
        } else {
          alert('Registration request sent!');
          loadTournaments();
        }
      } else {
        // Register as individual player
        const { data: player } = await supabase
          .from('players')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (player) {
          const { error } = await registerForTournament(tournamentId, undefined, player.id);
          if (error) {
            alert(error.message || 'Failed to register');
          } else {
            alert('Registration request sent!');
            loadTournaments();
          }
        } else {
          alert('Please create a team or register as a player first');
        }
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (filter === 'All') return true;
    if (filter === 'Free') return tournament.fee === 0;
    if (filter === 'Paid') return tournament.fee > 0;
    if (filter === 'Open') return tournament.status === 'open';
    if (filter === 'Starting Soon') {
      const startDate = new Date(tournament.start_date);
      const today = new Date();
      const daysDiff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7 && daysDiff > 0;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <h1 className="text-3xl mb-2">
          <span className="text-[#FF6600]">Tournaments</span>
        </h1>
        <p className="text-zinc-500">Join competitive cups in Karachi</p>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Free', 'Paid', 'Open', 'Starting Soon'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => {
                setFilter(filterOption);
                loadTournaments();
              }}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                filter === filterOption
                  ? 'bg-[#FF6600] text-black'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments List */}
      <div className="px-6 pb-6 space-y-4">
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No tournaments found</p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => {
            const slotsFilled = tournament.current_teams || 0;
            const slotsTotal = tournament.max_teams || 0;
            const progressPercent = (slotsFilled / slotsTotal) * 100;
            const isFilling = progressPercent >= 75;

            return (
          <div
            key={tournament.id}
            className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl overflow-hidden border border-zinc-800"
          >
            {/* Tournament Header */}
            <div className="p-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg mb-2">{tournament.name}</h3>
                  <div className="flex items-center gap-2">
                        {tournament.fee === 0 ? (
                      <span className="bg-[#00FF57] text-black px-3 py-1 rounded-full text-xs">
                        FREE
                      </span>
                    ) : (
                      <span className="bg-[#FF6600] text-black px-3 py-1 rounded-full text-xs">
                            {tournament.fee} PKR
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      tournament.status === 'open'
                        ? 'bg-green-500/20 text-green-500'
                            : isFilling
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-zinc-500/20 text-zinc-500'
                    }`}>
                          {tournament.status === 'open' ? 'Open' : isFilling ? 'Filling Fast' : tournament.status}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6600] to-[#cc5200] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Tournament Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    Start Date
                  </div>
                      <div className="text-sm text-white">{formatDate(tournament.start_date)}</div>
                </div>

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <Users className="w-3 h-3" />
                    Teams Joined
                  </div>
                      <div className="text-sm text-white">{slotsFilled}/{slotsTotal}</div>
                </div>

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <Trophy className="w-3 h-3" />
                    Prize
                  </div>
                  <div className="text-sm text-[#FF6600]">{tournament.prize}</div>
                </div>

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                    <Users className="w-3 h-3" />
                    Format
                  </div>
                      <div className="text-sm text-white">{tournament.format || '5v5'}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                  <span>Registration Progress</span>
                      <span>{slotsFilled}/{slotsTotal}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#FF6600] to-[#cc5200] h-full rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
                  <button
                    onClick={() => handleJoinTournament(tournament.id)}
                    disabled={registering === tournament.id || tournament.status !== 'open'}
                    className="w-full bg-gradient-to-r from-[#FF6600] to-[#cc5200] text-white py-3 rounded-xl active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,102,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {registering === tournament.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <span>Join Tournament</span>
                    )}
              </button>
            </div>

            {/* Additional Info Footer */}
            <div className="bg-black/30 px-5 py-3 border-t border-zinc-800">
              <button className="text-sm text-[#FF6600] flex items-center gap-2">
                View Brackets & Details →
              </button>
            </div>
          </div>
            );
          })
        )}
      </div>
    </div>
  );
}
