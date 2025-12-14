import { useState, useEffect } from 'react';
import { Search, Filter, User, Target, TrendingUp, Send, Loader2 } from 'lucide-react';
import { getPlayers, createPlayerInvitation } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PlayerMarketplaceProps {
  onBack: () => void;
  onViewPlayer?: (playerId: string) => void;
  onSendRequest?: (playerId: string) => void;
}

export default function PlayerMarketplace({ onBack, onViewPlayer, onSendRequest }: PlayerMarketplaceProps) {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ageRange, setAgeRange] = useState([15, 30]);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [skillRange, setSkillRange] = useState([1, 10]);
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [userTeam, setUserTeam] = useState<any>(null);

  const positions = ['all', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger'];

  useEffect(() => {
    loadPlayers();
    loadUserTeam();
  }, [user]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchQuery, ageRange, selectedPosition, skillRange, availabilityFilter]);

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
          .select('*')
          .eq('captain_id', profile.id)
          .single();

        if (team) {
          setUserTeam(team);
        }
      }
    } catch (error) {
      console.error('Error loading user team:', error);
    }
  };

  const handleSendRequest = async (playerId: string) => {
    if (!userTeam) {
      alert('You need to create a team first to send requests to players');
      return;
    }

    if (!playerId) {
      alert('Invalid player ID');
      return;
    }

    setSendingRequest(playerId);

    try {
      console.log('Sending invitation:', {
        team_id: userTeam.id,
        player_id: playerId,
        invitation_type: 'team'
      });

      // Create a player invitation (team inviting player to join)
      const { data, error } = await createPlayerInvitation({
        team_id: userTeam.id,
        player_id: playerId,
        invitation_type: 'team',
        match_id: null,
        match_fee: null,
        status: 'pending',
        message: `Join ${userTeam.name}! We'd love to have you on our team.`,
      });

      if (error) {
        console.error('Error sending invitation:', error);
        alert(error.message || 'Failed to send request. Please check console for details.');
      } else {
        console.log('Invitation sent successfully:', data);
        alert('Request sent successfully!');
        if (onSendRequest) {
          onSendRequest(playerId);
        }
      }
    } catch (err: any) {
      console.error('Exception sending invitation:', err);
      alert(err.message || 'An error occurred. Please check console for details.');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleViewPlayer = (playerId: string) => {
    console.log('Viewing player with ID:', playerId);
    sessionStorage.setItem('playerId', playerId);
    if (onViewPlayer) {
      onViewPlayer(playerId);
    }
  };

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (selectedPosition !== 'all') {
        filters.position = selectedPosition;
      }
      if (skillRange[0] > 1) {
        filters.minSkill = skillRange[0];
      }
      if (skillRange[1] < 10) {
        filters.maxSkill = skillRange[1];
      }
      
      const { data, error } = await getPlayers(filters);
      if (error) {
        console.error('Error loading players:', error);
      } else {
        setPlayers(data || []);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(player => {
        const name = player.profiles?.full_name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Age filter
    filtered = filtered.filter(player => {
      const age = player.age || 0;
      return age >= ageRange[0] && age <= ageRange[1];
    });

    // Position filter (already done in API, but double check)
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    // Skill filter (already done in API, but double check)
    filtered = filtered.filter(player => {
      const skill = player.skill_level || 1;
      return skill >= skillRange[0] && skill <= skillRange[1];
    });

    // Availability filter
    if (availabilityFilter !== 'All') {
      // This would need availability status in the database
      // For now, we'll skip this filter
    }

    setFilteredPlayers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <button 
          onClick={onBack}
          className="text-[#00FF57] mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl mb-2">
          Player <span className="text-[#00FF57]">Marketplace</span>
        </h1>
        <p className="text-zinc-500">Find and recruit talented players</p>
      </div>

      <div className="px-6 py-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00FF57]/50 focus:ring-1 focus:ring-[#00FF57]/20 transition-all"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-4 flex items-center justify-between text-zinc-400 active:scale-98 transition-transform text-sm"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </div>
          <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-4">
            {/* Age Range */}
            <div>
              <label className="text-sm text-zinc-400 mb-3 block">
                Age Range: {ageRange[0]} - {ageRange[1]} years
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={ageRange[0]}
                  onChange={(e) => setAgeRange([parseInt(e.target.value) || 15, ageRange[1]])}
                  min="10"
                  max="100"
                  className="w-20 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-center"
                />
                <div className="flex-1 flex items-center">
                  <div className="h-1 bg-zinc-700 flex-1 rounded" />
                </div>
                <input
                  type="number"
                  value={ageRange[1]}
                  onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value) || 30])}
                  min="10"
                  max="100"
                  className="w-20 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-center"
                />
              </div>
            </div>

            {/* Position Filter */}
            <div>
              <label className="text-sm text-zinc-400 mb-3 block">Position</label>
              <div className="grid grid-cols-2 gap-2">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setSelectedPosition(pos)}
                    className={`py-2 px-3 rounded-lg text-sm transition-all ${
                      selectedPosition === pos
                        ? 'bg-[#00FF57] text-black'
                        : 'bg-black border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {pos === 'all' ? 'All Positions' : pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Level Range */}
            <div>
              <label className="text-sm text-zinc-400 mb-3 block">
                Skill Level: {skillRange[0]} - {skillRange[1]}
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={skillRange[0]}
                  onChange={(e) => setSkillRange([parseInt(e.target.value) || 1, skillRange[1]])}
                  className="w-16 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-center"
                />
                <div className="flex-1 flex items-center">
                  <div className="h-1 bg-gradient-to-r from-[#00FF57] to-[#00cc44] flex-1 rounded" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={skillRange[1]}
                  onChange={(e) => setSkillRange([skillRange[0], parseInt(e.target.value) || 10])}
                  className="w-16 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-center"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="text-sm text-zinc-400 mb-3 block">Availability</label>
              <div className="flex gap-2">
                {['All', 'Available', 'Busy'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setAvailabilityFilter(status)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                      status === availabilityFilter
                        ? 'bg-[#00FF57] text-black'
                        : 'bg-black border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={loadPlayers}
              className="w-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg py-3 text-black font-medium"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-500">{filteredPlayers.length} players found</p>
          <button className="text-xs text-[#00FF57]">Sort by Rating</button>
        </div>

        {/* Player Cards */}
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No players found matching your criteria</p>
          </div>
        ) : (
        <div className="space-y-3">
            {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-3 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex gap-3 mb-3">
                {/* Player Photo */}
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.profiles?.full_name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-black" />
                </div>
                  )}

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold mb-0.5 truncate text-white">{player.profiles?.full_name || 'Unknown Player'}</h3>
                    <p className="text-xs text-zinc-400 mb-2">
                      {player.age || 'N/A'} years • {player.position || 'Any Position'}
                    </p>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="bg-[#00FF57]/20 text-[#00FF57] px-2 py-0.5 rounded text-xs font-medium">
                        Skill: {player.skill_level || 5}/10
                    </span>
                      <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-xs">
                        Rating: {player.rating?.toFixed(1) || '5.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-2.5 mb-3 p-2.5 bg-black/50 rounded-lg border border-zinc-800/50">
                <div className="flex-1 text-center">
                    <div className="text-base font-semibold text-white mb-0.5">{player.matches_played || 0}</div>
                  <div className="text-xs text-zinc-500">Matches</div>
                </div>
                <div className="flex-1 text-center">
                    <div className="text-base font-semibold text-[#00FF57] mb-0.5">{player.goals || 0}</div>
                    <div className="text-xs text-zinc-500">Goals</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-base font-semibold text-[#FF6600] mb-0.5">{player.mvps || 0}</div>
                    <div className="text-xs text-zinc-500">MVPs</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                    onClick={() => handleViewPlayer(player.id)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2 text-white text-xs font-medium active:scale-95 transition-transform hover:bg-zinc-750"
                >
                  View Profile
                </button>
                <button
                    onClick={() => handleSendRequest(player.id)}
                    disabled={sendingRequest === player.id || !userTeam}
                    className="flex-1 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg py-2 text-black text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#00cc44] hover:to-[#00aa33]"
                >
                    {sendingRequest === player.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                  <Send className="w-3.5 h-3.5" />
                  Send Request
                      </>
                    )}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
