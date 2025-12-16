import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, X, Award, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitMatchResult, getTeamById } from '../lib/api';
import { supabase } from '../lib/supabase';

interface GoalScorer {
  id: number;
  player: string;
  player_id: string;
  team_id: string;
  goals: number;
}

interface MatchResultSubmissionProps {
  onBack: () => void;
  matchId?: string;
}

export default function MatchResultSubmission({ onBack, matchId }: MatchResultSubmissionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [match, setMatch] = useState<any>(null);
  const [teamA, setTeamA] = useState<any>(null);
  const [teamB, setTeamB] = useState<any>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<any[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<any[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [goalScorers, setGoalScorers] = useState<GoalScorer[]>([]);
  const [mvp, setMvp] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (matchId) {
      loadMatch();
    }
  }, [matchId, user]);

  const loadMatch = async () => {
    if (!user || !matchId) return;

    try {
      setLoading(true);

      // Get match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          team_a:teams!matches_team_a_id_fkey(*),
          team_b:teams!matches_team_b_id_fkey(*)
        `)
        .eq('id', matchId)
        .single();

      if (matchError || !matchData) {
        setError('Match not found');
        setLoading(false);
        return;
      }

      setMatch(matchData);
      setTeamA(matchData.team_a);
      setTeamB(matchData.team_b);
      setTeamAScore(matchData.team_a_score?.toString() || '');
      setTeamBScore(matchData.team_b_score?.toString() || '');
      setMvp(matchData.mvp_player_id || '');

      // Get user's team ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: userTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('captain_id', profile.id)
          .single();

        if (userTeam) {
          setUserTeamId(userTeam.id);
        }
      }

      // Get team members
      const { data: membersA } = await supabase
        .from('team_members')
        .select(`
          *,
          players (
            *,
            profiles (full_name)
          )
        `)
        .eq('team_id', matchData.team_a_id);

      const { data: membersB } = await supabase
        .from('team_members')
        .select(`
          *,
          players (
            *,
            profiles (full_name)
          )
        `)
        .eq('team_id', matchData.team_b_id);

      setTeamAPlayers(membersA || []);
      setTeamBPlayers(membersB || []);

      // Load existing goal scorers if match is completed
      if (matchData.status === 'completed') {
        const { data: existingGoalScorers } = await supabase
          .from('goal_scorers')
          .select(`
            *,
            players (
              *,
              profiles (full_name)
            )
          `)
          .eq('match_id', matchId);

        if (existingGoalScorers && existingGoalScorers.length > 0) {
          const loadedScorers: GoalScorer[] = existingGoalScorers.map((gs: any, index: number) => ({
            id: Date.now() + index,
            player: gs.players?.profiles?.full_name || '',
            player_id: gs.player_id,
            team_id: gs.team_id,
            goals: gs.goals,
          }));
          setGoalScorers(loadedScorers);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const addGoalScorer = () => {
    setGoalScorers([...goalScorers, { 
      id: Date.now(), 
      player: '', 
      player_id: '',
      team_id: '',
      goals: 1 
    }]);
  };

  const removeGoalScorer = (id: number) => {
    setGoalScorers(goalScorers.filter(g => g.id !== id));
  };

  const updateGoalScorer = (id: number, field: keyof GoalScorer, value: any) => {
    setGoalScorers(goalScorers.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!match || !teamA || !teamB) {
      setError('Match information missing');
      return;
    }

    if (!teamAScore || !teamBScore) {
      setError('Please enter scores for both teams');
      return;
    }

    const scoreA = parseInt(teamAScore);
    const scoreB = parseInt(teamBScore);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      setError('Please enter valid scores');
      return;
    }

    // Validate goal scorers
    const validGoalScorers = goalScorers.filter(gs => gs.player_id && gs.team_id && gs.goals > 0);
    const totalGoals = validGoalScorers.reduce((sum, gs) => sum + gs.goals, 0);
    
    if (totalGoals !== scoreA + scoreB) {
      setError(`Total goals from scorers (${totalGoals}) doesn't match total score (${scoreA + scoreB})`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: submitError } = await submitMatchResult(
        match.id,
        scoreA,
        scoreB,
        validGoalScorers.map(gs => ({
          player_id: gs.player_id,
          team_id: gs.team_id,
          goals: gs.goals,
        })),
        mvp || undefined,
        userTeamId || undefined
      );

      if (submitError) {
        setError(submitError.message || 'Failed to submit result');
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

  if (!match) {
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-zinc-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={onBack} className="text-[#00FF57]">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Submit Result</h1>
        </div>
        <div className="px-6 py-12 text-center">
          <p className="text-zinc-500 mb-4">Match not found</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  const allPlayers = [
    ...teamAPlayers.map(m => ({ ...m.player, team_id: teamA.id, team_name: teamA.name })),
    ...teamBPlayers.map(m => ({ ...m.player, team_id: teamB.id, team_name: teamB.name })),
  ].filter(p => p && p.id);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="text-[#00FF57]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl">{match.status === 'completed' ? 'Update Result' : 'Submit Result'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Match Title */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 mb-6 border border-zinc-800">
            <p className="text-sm text-zinc-500 mb-2">Match Details</p>
            <h2 className="text-xl mb-1">{teamA?.name} vs {teamB?.name}</h2>
            <p className="text-sm text-zinc-500">
              {match.scheduled_date ? new Date(match.scheduled_date).toLocaleDateString() : 'TBD'} • 
              {match.scheduled_time ? ` ${match.scheduled_time}` : ''} • 
              {match.location ? ` ${match.location}` : ''}
            </p>
            {/* Verification Status */}
            {match.team_a_result_submitted && match.team_b_result_submitted && match.verified_result ? (
              <div className="mt-3 p-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                <p className="text-xs text-green-400">✓ Result verified by both teams</p>
              </div>
            ) : (match.team_a_result_submitted || match.team_b_result_submitted) && !match.verified_result ? (
              <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <p className="text-xs text-yellow-400">
                  ⏳ Waiting for opponent to verify result
                </p>
              </div>
            ) : null}
          </div>

          {/* Final Score */}
          <div className="mb-6">
            <h3 className="text-lg mb-4">Final Score</h3>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">{teamA?.name}</label>
                <input
                  type="number"
                  value={teamAScore}
                  onChange={(e) => setTeamAScore(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-4 text-white text-center text-2xl focus:border-[#00FF57] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="text-center text-zinc-500 text-xl">-</div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">{teamB?.name}</label>
                <input
                  type="number"
                  value={teamBScore}
                  onChange={(e) => setTeamBScore(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full bg-zinc-900 border-2 border-[#007BFF]/30 rounded-xl px-4 py-4 text-white text-center text-2xl focus:border-[#007BFF] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Goal Scorers */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">Goal Scorers</h3>
              <button
                type="button"
                onClick={addGoalScorer}
                className="flex items-center gap-2 bg-[#00FF57] text-black px-3 py-2 rounded-lg text-sm active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {goalScorers.map((scorer) => (
                <div key={scorer.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={scorer.player_id}
                      onChange={(e) => {
                        const player = allPlayers.find(p => p.id === e.target.value);
                        updateGoalScorer(scorer.id, 'player_id', e.target.value);
                        updateGoalScorer(scorer.id, 'team_id', player?.team_id || '');
                        updateGoalScorer(scorer.id, 'player', player?.profiles?.full_name || '');
                      }}
                      className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00FF57] focus:outline-none"
                      required
                    >
                      <option value="">Select player</option>
                      {allPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.profiles?.full_name || 'Unknown'} ({player.team_name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={scorer.goals}
                      onChange={(e) => updateGoalScorer(scorer.id, 'goals', parseInt(e.target.value) || 1)}
                      placeholder="Goals"
                      min="1"
                      className="w-20 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#00FF57] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeGoalScorer(scorer.id)}
                      className="text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {goalScorers.length === 0 && (
                <div className="text-center py-6 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  No goal scorers added yet. Click "Add" to add goal scorers.
                </div>
              )}
            </div>
          </div>

          {/* MVP Selection */}
          <div className="mb-6">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF6600]" />
              Man of the Match (MVP)
            </h3>
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-[#FF6600]/30">
              <select
                value={mvp}
                onChange={(e) => setMvp(e.target.value)}
                className="w-full bg-black border-2 border-[#FF6600]/30 rounded-lg px-4 py-3 text-white focus:border-[#FF6600] focus:outline-none transition-colors"
              >
                <option value="">Auto-select (Top Goal Scorer)</option>
                {allPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.profiles?.full_name || 'Unknown'} ({player.team_name})
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-2">
                💡 Leave empty to auto-select the top goal scorer, or manually choose the MVP
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="text-sm text-zinc-400 mb-2 block">
              Match Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any highlights, incidents, or notes from the match..."
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{match.status === 'completed' ? 'Updating...' : 'Submitting...'}</span>
              </>
            ) : (
              <span>{match.status === 'completed' ? 'Update Result' : 'Submit Result'}</span>
            )}
          </button>

          <p className="text-xs text-center text-zinc-500">
            {match.verified_result 
              ? 'Result has been verified and ratings updated'
              : match.team_a_result_submitted && match.team_b_result_submitted
              ? 'Waiting for verification. The opponent will be notified to confirm.'
              : 'The opponent will be notified to verify the result once you submit'}
          </p>
        </div>
      </form>
    </div>
  );
}
