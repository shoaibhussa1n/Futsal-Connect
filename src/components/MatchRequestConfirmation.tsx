import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createMatchRequest, getTeamById } from '../lib/api';
import { supabase } from '../lib/supabase';

interface MatchRequestConfirmationProps {
  onBack: () => void;
  opponentTeamId?: string;
}

export default function MatchRequestConfirmation({ onBack, opponentTeamId }: MatchRequestConfirmationProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userTeam, setUserTeam] = useState<any>(null);
  const [opponentTeam, setOpponentTeam] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTeams();
  }, [user, opponentTeamId]);

  const loadTeams = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
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
        }
      }

      // Get opponent team
      if (opponentTeamId) {
        const { data: opponent, error } = await getTeamById(opponentTeamId);
        if (error) {
          setError('Failed to load opponent team');
        } else {
          setOpponentTeam(opponent);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userTeam || !opponentTeam) {
      setError('Team information missing');
      return;
    }

    if (!selectedDate || !selectedTime || !selectedCourt) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: requestError } = await createMatchRequest({
        requester_team_id: userTeam.id,
        requested_team_id: opponentTeam.id,
        status: 'pending',
        proposed_date: selectedDate,
        proposed_time: selectedTime,
        proposed_location: selectedCourt,
        notes: notes || null,
      });

      if (requestError) {
        setError(requestError.message || 'Failed to send match request');
      } else {
        // Success - go back
        onBack();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
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
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Match Request</h1>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-zinc-500 mb-4">You need to create a team first to request matches</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="text-[#00FF57]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl">Match Request</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Matchup Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 mb-6 border border-[#00FF57]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {userTeam.logo_url ? (
                  <img src={userTeam.logo_url} alt={userTeam.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-black" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-zinc-500">Your Team</p>
                  <h3 className="text-lg">{userTeam.name}</h3>
                  <p className="text-sm text-[#00FF57]">Rating: {userTeam.rating?.toFixed(1) || '5.0'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center my-4">
              <div className="bg-zinc-800 text-zinc-400 px-6 py-2 rounded-full">VS</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {opponentTeam?.logo_url ? (
                  <img src={opponentTeam.logo_url} alt={opponentTeam.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-[#007BFF] to-[#0056b3] rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-zinc-500">Opponent</p>
                  <h3 className="text-lg">{opponentTeam?.name || 'Loading...'}</h3>
                  <p className="text-sm text-[#007BFF]">Rating: {opponentTeam?.rating?.toFixed(1) || '5.0'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Match Details Form */}
          <div className="space-y-4">
            <h2 className="text-lg mb-4">Match Details</h2>

            {/* Date Selection */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white focus:border-[#00FF57] focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Select Time *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white focus:border-[#00FF57] focus:outline-none transition-colors"
                required
              >
                <option value="">Choose time slot</option>
                <option value="17:00">5:00 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="21:00">9:00 PM</option>
              </select>
            </div>

            {/* Court Location */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Court Location *
              </label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white focus:border-[#00FF57] focus:outline-none transition-colors"
                required
              >
                <option value="">Choose court</option>
                <option>DHA Sports Complex</option>
                <option>Clifton Futsal Arena</option>
                <option>Gulshan Turf</option>
                <option>North Nazimabad Sports Club</option>
                <option>Askari Sports Complex</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special requests or notes..."
                className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 my-6">
            <p className="text-sm text-zinc-400">
              ℹ️ The opponent will be notified of your match request and can accept or propose a different time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Match Request</span>
              )}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 py-4 rounded-xl active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
