import { useState, useEffect } from 'react';
import { User, UserPlus, Clock, Users, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, createPlayerInvitation } from '../lib/api';
import { supabase } from '../lib/supabase';

interface TeamInvitationSystemProps {
  onBack: () => void;
  onInvitePlayer?: (playerId: string, type: 'team' | 'match') => void;
}

export default function TeamInvitationSystem({ onBack, onInvitePlayer }: TeamInvitationSystemProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'team' | 'match'>('team');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [userTeam, setUserTeam] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's team
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

          // Get team members to exclude them
          const { data: members } = await supabase
            .from('team_members')
            .select('player_id')
            .eq('team_id', team.id);

          const memberIds = members?.map(m => m.player_id) || [];

          // Get available players (not in this team)
          const { data: players, error } = await getPlayers();
          if (!error && players) {
            const available = players.filter(p => !memberIds.includes(p.id));
            setAvailablePlayers(available);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (playerId: string, type: 'team' | 'match') => {
    if (!userTeam) {
      alert('You need to create a team first');
      return;
    }

    setInviting(playerId);

    try {
      const { data, error } = await createPlayerInvitation({
        team_id: userTeam.id,
        player_id: playerId,
        invitation_type: type,
        match_id: null,
        match_fee: type === 'match' ? 500 : null,
        status: 'pending',
        message: type === 'team' 
          ? `Join ${userTeam.name} as a permanent team member!`
          : `We need you for an upcoming match. Match fee: Rs. 500`,
      });

      if (error) {
        alert(error.message || 'Failed to send invitation');
      } else {
        alert(`Invitation sent successfully!`);
        if (onInvitePlayer) {
          onInvitePlayer(playerId, type);
        }
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setInviting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  if (!userTeam) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
          <button onClick={onBack} className="text-[#00FF57] mb-4">← Back</button>
          <h1 className="text-3xl mb-2">Team <span className="text-[#00FF57]">Invitations</span></h1>
        </div>
        <div className="px-6 py-12 text-center">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">You need to create a team first to invite players</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
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
          Team <span className="text-[#00FF57]">Invitations</span>
        </h1>
        <p className="text-zinc-500">Invite players to join your team</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Tab Selector */}
        <div className="bg-zinc-900 rounded-xl p-1.5 grid grid-cols-2 gap-1">
          <button
            onClick={() => setSelectedTab('team')}
            className={`py-3 rounded-lg transition-all ${
              selectedTab === 'team'
                ? 'bg-[#00FF57] text-black'
                : 'bg-transparent text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>Lifetime Team</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('match')}
            className={`py-3 rounded-lg transition-all ${
              selectedTab === 'match'
                ? 'bg-[#00FF57] text-black'
                : 'bg-transparent text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Per Match</span>
            </div>
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-400">
            {selectedTab === 'team' 
              ? '💡 Invite players to permanently join your team roster. They will be part of all future matches.'
              : '💡 Hire players for a single match. Perfect for filling in missing positions or trying out new players.'
            }
          </p>
        </div>

        {/* Available Players List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-zinc-400">
              {selectedTab === 'team' ? 'Available for Teams' : 'Available for Hire'}
            </h2>
            <span className="text-sm text-zinc-600">{availablePlayers.length} players</span>
          </div>

          {availablePlayers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No available players found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availablePlayers.map((player) => (
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
                      <p className="text-sm text-zinc-500 mb-2">{player.position || 'Any Position'}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-[#00FF57]/20 text-[#00FF57] px-2 py-1 rounded-md text-xs">
                          Skill: {player.skill_level || 5}/10
                        </span>
                        <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md text-xs">
                          {player.matches_played || 0} matches
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fee (for per-match) */}
                  {selectedTab === 'match' && (
                    <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <p className="text-sm text-orange-400">
                        Match Fee: <span className="text-orange-300 font-medium">Rs. 500</span>
                      </p>
                    </div>
                  )}

                  {/* Stats Bar */}
                  <div className="flex gap-4 mb-4 p-3 bg-black/50 rounded-lg">
                    <div className="flex-1 text-center">
                      <div className="text-xl text-white mb-1">{player.matches_played || 0}</div>
                      <div className="text-xs text-zinc-500">Matches</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xl text-[#00FF57] mb-1">{player.rating?.toFixed(1) || '5.0'}</div>
                      <div className="text-xs text-zinc-500">Rating</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xl text-[#00A3FF] mb-1">
                        {selectedTab === 'team' ? '✓' : '500'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {selectedTab === 'team' ? 'Available' : 'Fee'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 text-white text-sm active:scale-95 transition-transform">
                      View Profile
                    </button>
                    <button
                      onClick={() => handleInvite(player.id, selectedTab)}
                      disabled={inviting === player.id}
                      className="flex-1 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg py-2.5 text-black text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviting === player.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          {selectedTab === 'team' ? 'Invite to Team' : 'Hire for Match'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Info Section (only for lifetime team) */}
        {selectedTab === 'team' && userTeam && (
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-6 border border-[#00FF57]/20">
            <h3 className="text-lg mb-4">Your Team: <span className="text-[#00FF57]">{userTeam.name}</span></h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-black/50 rounded-lg">
                <div className="text-2xl text-white mb-1">-</div>
                <div className="text-xs text-zinc-500">Players</div>
              </div>
              <div className="text-center p-3 bg-black/50 rounded-lg">
                <div className="text-2xl text-[#00FF57] mb-1">-</div>
                <div className="text-xs text-zinc-500">Slots Left</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
