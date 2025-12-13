import { useState, useEffect } from 'react';
import { Bell, Users, Calendar, MapPin, Clock, Check, X, Loader2, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMatchRequests, updateMatchRequest, createMatch } from '../lib/api';
import { supabase } from '../lib/supabase';

interface TeamNotificationsProps {
  onBack: () => void;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export default function TeamNotifications({ onBack, onAccept, onReject }: TeamNotificationsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [matchRequests, setMatchRequests] = useState<any[]>([]);
  const [userTeam, setUserTeam] = useState<any>(null);

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

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Get user's team
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', profile.id)
          .single();

        if (team) {
          setUserTeam(team);

          // Get match requests where this team is the requested team (incoming requests)
          const { data: requests, error } = await getMatchRequests(team.id);
          
          if (error) {
            console.error('Error loading match requests:', error);
          } else if (requests) {
            // Filter to only show pending requests where this team is the requested team
            const incomingRequests = requests.filter(
              (req: any) => req.requested_team_id === team.id && req.status === 'pending'
            );
            setMatchRequests(incomingRequests);
          } else {
            setMatchRequests([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleAccept = async (requestId: string, request: any) => {
    if (!userTeam) {
      alert('Team information missing');
      return;
    }

    setProcessing(requestId);
    try {
      // Update match request status to accepted
      const { data: updatedRequest, error: updateError } = await updateMatchRequest(requestId, 'accepted');
      
      if (updateError) {
        alert(updateError.message || 'Failed to accept match request');
        return;
      }

      // Create a match from the accepted request
      const { data: match, error: matchError } = await createMatch({
        team_a_id: request.requester_team_id,
        team_b_id: request.requested_team_id,
        scheduled_date: request.proposed_date,
        scheduled_time: request.proposed_time,
        location: request.proposed_location,
        status: 'confirmed',
        team_a_score: null,
        team_b_score: null,
        mvp_player_id: null,
      });

      if (matchError) {
        console.error('Error creating match:', matchError);
        alert('Match request accepted, but failed to create match. Please contact support.');
      } else {
        alert('Match request accepted! Match has been scheduled.');
        if (onAccept) {
          onAccept(requestId);
        }
        // Reload notifications to remove accepted request
        loadNotifications();
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await updateMatchRequest(requestId, 'rejected');
      
      if (error) {
        alert(error.message || 'Failed to reject match request');
      } else {
        alert('Match request rejected');
        if (onReject) {
          onReject(requestId);
        }
        // Reload notifications to remove rejected request
        loadNotifications();
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setProcessing(null);
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
      <div className="min-h-screen bg-black">
        <div className="bg-zinc-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={onBack} className="text-[#00FF57]">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Match Requests</h1>
        </div>
        <div className="px-6 py-12 text-center">
          <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">You need to create a team first to receive match requests</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onBack} className="text-[#00FF57]">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-3xl">
            Match <span className="text-[#00FF57]">Requests</span>
          </h1>
        </div>
        <p className="text-zinc-500">Incoming match requests for {userTeam.name}</p>
      </div>

      {/* Notifications List */}
      <div className="px-6 pb-6">
        {matchRequests.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No match requests yet</p>
            <p className="text-zinc-600 text-sm mt-2">Teams will appear here when they request a match</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matchRequests.map((request) => {
              const requesterTeam = request.requester_team;

              return (
                <div
                  key={request.id}
                  className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-5 border border-zinc-800"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {requesterTeam?.logo_url ? (
                        <img 
                          src={requesterTeam.logo_url} 
                          alt={requesterTeam.name} 
                          className="w-12 h-12 rounded-xl object-cover" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#007BFF] to-[#0056b3] rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg">{requesterTeam?.name || 'Unknown Team'}</h3>
                          <span className="bg-[#00FF57]/20 text-[#00FF57] px-2 py-0.5 rounded-md text-xs">
                            Match Request
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500">Rating: {requesterTeam?.rating?.toFixed(1) || '5.0'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600">{formatTime(request.created_at)}</span>
                  </div>

                  {/* Match Details */}
                  <div className="mb-4 space-y-2">
                    {request.proposed_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-[#00FF57]" />
                        <span className="text-zinc-400">
                          {new Date(request.proposed_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {request.proposed_time && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-[#00FF57]" />
                        <span className="text-zinc-400">
                          {(() => {
                            const [hours, minutes] = request.proposed_time.split(':');
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return `${displayHour}:${minutes} ${ampm}`;
                          })()}
                        </span>
                      </div>
                    )}
                    {request.proposed_location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-[#00FF57]" />
                        <span className="text-zinc-400">{request.proposed_location}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
                      <p className="text-sm text-zinc-300 leading-relaxed">{request.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(request.id, request)}
                      disabled={processing === request.id}
                      className="flex-1 bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,87,0.2)]"
                    >
                      {processing === request.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processing === request.id}
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-400 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

