import { useState, useEffect } from 'react';
import { Users, Target, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { getTeams } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function MatchmakingScreen({ onRequestMatch }: { onRequestMatch: (teamId: string) => void }) {
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [ratingRange, setRatingRange] = useState([5, 8]);
  const [ageGroup, setAgeGroup] = useState('All');
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<any[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  useEffect(() => {
    loadUserTeam();
    loadTeams();
  }, [user]);

  useEffect(() => {
    filterTeams();
  }, [teams, selectedArea, ratingRange, ageGroup, userTeamId]);

  const loadUserTeam = async () => {
    if (!user) return;
    
    try {
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
    } catch (error) {
      console.error('Error loading user team:', error);
    }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (ageGroup !== 'All') {
        filters.ageGroup = ageGroup;
      }
      if (ratingRange[0] > 1) {
        filters.minRating = ratingRange[0];
      }
      if (ratingRange[1] < 10) {
        filters.maxRating = ratingRange[1];
      }
      
      const { data, error } = await getTeams(filters);
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

  const filterTeams = () => {
    let filtered = [...teams];

    // Exclude user's own team
    if (userTeamId) {
      filtered = filtered.filter(team => team.id !== userTeamId);
    }

    // Filter by area
    if (selectedArea !== 'All Areas') {
      filtered = filtered.filter(team => {
        // Check if team has area field, otherwise show all
        return team.area === selectedArea || !team.area;
      });
    }

    // Filter by rating range
    filtered = filtered.filter(team => {
      const rating = team.rating || 5.0;
      return rating >= ratingRange[0] && rating <= ratingRange[1];
    });

    // Filter by age group
    if (ageGroup !== 'All') {
      filtered = filtered.filter(team => team.age_group === ageGroup);
    }

    setFilteredTeams(filtered);
  };

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
        <h1 className="text-3xl mb-2">Find <span className="text-[#00FF57]">Opponents</span></h1>
        <p className="text-zinc-500">Discover teams that match your level</p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 space-y-4">
        {/* Area Selector */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Location</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white focus:border-[#00FF57] focus:outline-none"
          >
            <option>All Areas</option>
            <option>DHA</option>
            <option>Clifton</option>
            <option>Gulshan-e-Iqbal</option>
            <option>Gulistan-e-Johar</option>
            <option>North Nazimabad</option>
            <option>Malir</option>
            <option>Lyari</option>
            <option>Saddar</option>
            <option>PECHS</option>
            <option>Bahadurabad</option>
            <option>Shahrah-e-Faisal</option>
            <option>Korangi</option>
            <option>Landhi</option>
            <option>Gulshan-e-Maymar</option>
            <option>Scheme 33</option>
            <option>Defence</option>
            <option>Karimabad</option>
            <option>Federal B Area</option>
            <option>Garden</option>
            <option>Kemari</option>
          </select>
        </div>

        {/* Age Group */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Age Group</label>
          <div className="flex gap-2">
            {['All', 'U16', 'U18', 'U21', 'Open'].map((age) => (
              <button
                key={age}
                onClick={() => setAgeGroup(age)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  age === ageGroup
                    ? 'bg-[#00FF57] text-black'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Range */}
        <div>
          <label className="text-sm text-zinc-400 mb-3 block">
            Team Rating: <span className="text-[#00FF57]">{ratingRange[0]} - {ratingRange[1]}</span>
          </label>
          <div className="flex gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={ratingRange[0]}
              onChange={(e) => setRatingRange([Number(e.target.value), ratingRange[1]])}
              className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min="1"
              max="10"
              value={ratingRange[1]}
              onChange={(e) => setRatingRange([ratingRange[0], Number(e.target.value)])}
              className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-zinc-400">{filteredTeams.length} Teams Available</h2>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No teams found matching your criteria</p>
            <button
              onClick={() => {
                setSelectedArea('All Areas');
                setAgeGroup('All');
                setRatingRange([1, 10]);
              }}
              className="text-[#00FF57] text-sm mt-4"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map((team) => {
              const winRate = team.wins + team.losses > 0
                ? Math.round((team.wins / (team.wins + team.losses)) * 100)
                : 0;

              return (
                <div
                  key={team.id}
                  className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-5 border border-zinc-800"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#007BFF] to-[#0056b3] rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="mb-1">{team.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <MapPin className="w-3 h-3" />
                          {team.area || 'Karachi'} • {team.age_group}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl text-[#00FF57] mb-1">{team.rating?.toFixed(1) || '5.0'}</div>
                      <div className="text-xs text-zinc-500">Rating</div>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-zinc-800">
                    <div>
                      <div className="flex items-center gap-1 text-zinc-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Win Rate
                      </div>
                      <div className="text-white">{winRate}%</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-zinc-400 text-xs mb-1">
                        <Target className="w-3 h-3" />
                        Wins
                      </div>
                      <div className="text-white">{team.wins || 0}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 text-xs mb-1">Level</div>
                      <div className="text-white">{team.team_level || 5}/10</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      // Store opponent team ID and navigate
                      sessionStorage.setItem('opponentTeamId', team.id);
                      onRequestMatch(team.id);
                    }}
                    className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-3 rounded-xl active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,255,87,0.2)]"
                  >
                    Request Match
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
