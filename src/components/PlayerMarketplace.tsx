import { useState, useEffect } from 'react';
import { Search, Filter, User, Target, TrendingUp, Send, Loader2 } from 'lucide-react';
import { getPlayers } from '../lib/api';

interface PlayerMarketplaceProps {
  onBack: () => void;
  onViewPlayer?: (playerId: string) => void;
  onSendRequest?: (playerId: string) => void;
}

export default function PlayerMarketplace({ onBack, onViewPlayer, onSendRequest }: PlayerMarketplaceProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ageRange, setAgeRange] = useState([15, 30]);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [skillRange, setSkillRange] = useState([1, 10]);
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);

  const positions = ['all', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger'];

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchQuery, ageRange, selectedPosition, skillRange, availabilityFilter]);

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

      <div className="px-6 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 flex items-center justify-between text-zinc-400 active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </div>
          <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-6">
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{filteredPlayers.length} players found</p>
          <button className="text-sm text-[#00FF57]">Sort by Rating</button>
        </div>

        {/* Player Cards */}
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No players found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-5 border border-zinc-800"
              >
                <div className="flex gap-4 mb-4">
                  {/* Player Photo */}
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.profiles?.full_name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-black" />
                    </div>
                  )}

                  {/* Player Info */}
                  <div className="flex-1">
                    <h3 className="text-lg mb-1">{player.profiles?.full_name || 'Unknown Player'}</h3>
                    <p className="text-sm text-zinc-500 mb-2">
                      {player.age || 'N/A'} years • {player.position || 'Any Position'}
                    </p>
                    <div className="flex gap-2">
                      <span className="bg-[#00FF57]/20 text-[#00FF57] px-2 py-1 rounded-md text-xs">
                        Skill: {player.skill_level || 5}/10
                      </span>
                      <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md text-xs">
                        Rating: {player.rating?.toFixed(1) || '5.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-4 p-3 bg-black/50 rounded-lg">
                  <div className="flex-1 text-center">
                    <div className="text-xl text-white mb-1">{player.matches_played || 0}</div>
                    <div className="text-xs text-zinc-500">Matches</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xl text-[#00FF57] mb-1">{player.goals || 0}</div>
                    <div className="text-xs text-zinc-500">Goals</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-xl text-[#FF6600] mb-1">{player.mvps || 0}</div>
                    <div className="text-xs text-zinc-500">MVPs</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onViewPlayer?.(player.id)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 text-white text-sm active:scale-95 transition-transform"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => onSendRequest?.(player.id)}
                    className="flex-1 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg py-2.5 text-black text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Send className="w-4 h-4" />
                    Send Request
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
