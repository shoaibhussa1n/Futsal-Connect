import { useState, useEffect } from 'react';
import { Bell, Users, Clock, Check, X, Trophy, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayerInvitations, updatePlayerInvitation } from '../lib/api';
import { supabase } from '../lib/supabase';

interface PlayerNotificationsProps {
  onBack: () => void;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export default function PlayerNotifications({ onBack, onAccept, onReject }: PlayerNotificationsProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'team' | 'match'>('team');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [matchRequests, setMatchRequests] = useState<any[]>([]);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get player profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: playerData } = await supabase
          .from('players')
          .select('*')
          .eq('profile_id', profile.id)
          .single();

        if (playerData) {
          setPlayer(playerData);

          // Get invitations
          const { data: invitations, error } = await getPlayerInvitations(playerData.id);
          if (!error && invitations) {
            const team = invitations.filter(inv => inv.invitation_type === 'team' && inv.status === 'pending');
            const match = invitations.filter(inv => inv.invitation_type === 'match' && inv.status === 'pending');
            setTeamRequests(team);
            setMatchRequests(match);
          }
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    setProcessing(invitationId);

    try {
      // First, get the invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('player_invitations')
        .select('*, team:teams(*)')
        .eq('id', invitationId)
        .single();

      if (inviteError || !invitation) {
        alert('Failed to load invitation details');
        return;
      }

      // Update invitation status
      const { error: updateError } = await updatePlayerInvitation(invitationId, 'accepted');
      if (updateError) {
        alert(updateError.message || 'Failed to accept invitation');
        return;
      }

      // If it's a team invitation, add the player to the team
      if (invitation.invitation_type === 'team' && invitation.team_id && player) {
        // Check if player is already a member
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', invitation.team_id)
          .eq('player_id', player.id)
          .single();

        if (!existingMember) {
          // Add player to team
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: invitation.team_id,
              player_id: player.id,
              role: 'member',
            });

          if (memberError) {
            console.error('Error adding player to team:', memberError);
            // Still show success since invitation was accepted
          }
        }
      }

      alert('Invitation accepted!');
      loadNotifications();
      if (onAccept) {
        onAccept(invitationId);
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    setProcessing(invitationId);

    try {
      const { error } = await updatePlayerInvitation(invitationId, 'rejected');
      if (error) {
        alert(error.message || 'Failed to reject invitation');
      } else {
        alert('Invitation rejected');
        loadNotifications();
        if (onReject) {
          onReject(invitationId);
        }
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return '1 day ago';
    } else {
      return `${diffDays} days ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
          <button onClick={onBack} className="text-[#00FF57] mb-4">← Back</button>
          <h1 className="text-3xl mb-2"><span className="text-[#00FF57]">Notifications</span></h1>
        </div>
        <div className="px-6 py-12 text-center">
          <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">Please register as a player first to receive invitations</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  const currentRequests = selectedTab === 'team' ? teamRequests : matchRequests;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">
              <span className="text-[#00FF57]">Notifications</span>
            </h1>
            <p className="text-zinc-500">Team requests & invitations</p>
          </div>
          <div className="relative">
            <Bell className="w-8 h-8 text-[#00FF57]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
              {currentRequests.length}
            </span>
          </div>
        </div>
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
              <span>Team Invites</span>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                selectedTab === 'team' ? 'bg-black text-[#00FF57]' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {teamRequests.length}
              </span>
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
              <span>Match Offers</span>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                selectedTab === 'match' ? 'bg-black text-[#00FF57]' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {matchRequests.length}
              </span>
            </div>
          </button>
        </div>

        {/* Notification Cards */}
        <div className="space-y-4">
          {currentRequests.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No notifications yet</p>
            </div>
          ) : (
            currentRequests.map((request) => {
              const team = request.team;
              const match = request.match;

              return (
                <div
                  key={request.id}
                  className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-5 border border-zinc-800"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg">{team?.name || 'Unknown Team'}</h3>
                        {request.invitation_type === 'team' && (
                          <span className="bg-[#00FF57]/20 text-[#00FF57] px-2 py-0.5 rounded-md text-xs">
                            Team
                          </span>
                        )}
                        {request.invitation_type === 'match' && (
                          <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-md text-xs">
                            Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">Team Rating: {team?.rating?.toFixed(1) || '5.0'}</p>
                    </div>
                    <span className="text-xs text-zinc-600">{formatTime(request.created_at)}</span>
                  </div>

                  {/* Team Info (for team requests) */}
                  {request.invitation_type === 'team' && (
                    <div className="flex gap-3 mb-4 p-3 bg-black/50 rounded-lg">
                      <div className="flex-1 text-center">
                        <div className="text-lg text-[#00FF57] mb-1">{team?.rating?.toFixed(1) || '5.0'}</div>
                        <div className="text-xs text-zinc-500">Rating</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-lg text-white mb-1">{team?.wins || 0}</div>
                        <div className="text-xs text-zinc-500">Wins</div>
                      </div>
                      <div className="flex-1 text-center">
                        <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                        <div className="text-xs text-zinc-500">Active</div>
                      </div>
                    </div>
                  )}

                  {/* Match Info (for match requests) */}
                  {request.invitation_type === 'match' && match && (
                    <div className="mb-4 space-y-2">
                      {match.scheduled_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[#00FF57]" />
                          <span className="text-zinc-400">
                            {new Date(match.scheduled_date).toLocaleDateString()} {match.scheduled_time || ''}
                          </span>
                        </div>
                      )}
                      {match.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-lg">📍</span>
                          <span className="text-zinc-400">{match.location}</span>
                        </div>
                      )}
                      {request.match_fee && (
                        <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                          <p className="text-sm text-orange-400">
                            Match Fee: <span className="text-orange-300 font-medium">Rs. {request.match_fee}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  {request.message && (
                    <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-300 leading-relaxed">{request.message}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 bg-zinc-800 border border-red-500/30 rounded-lg py-3 text-red-500 font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-5 h-5" />
                          Reject
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-lg py-3 text-black font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Accept
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-400 leading-relaxed">
            💡 {selectedTab === 'team' 
              ? 'Team invitations are for permanent team membership. You\'ll be part of the team roster.'
              : 'Match offers are for single game participation. Perfect for trying out different teams.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
