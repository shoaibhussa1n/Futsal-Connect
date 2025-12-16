import { supabase } from './supabase';
import type { Database } from './supabase';

// Type helpers
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// ==================== TEAMS ====================

export async function getTeams(filters?: {
  ageGroup?: string;
  minRating?: number;
  maxRating?: number;
  area?: string;
}) {
  let query = supabase
    .from('teams')
    .select('*')
    .order('rating', { ascending: false });

  if (filters?.ageGroup) {
    query = query.eq('age_group', filters.ageGroup);
  }
  if (filters?.minRating) {
    query = query.gte('rating', filters.minRating);
  }
  if (filters?.maxRating) {
    query = query.lte('rating', filters.maxRating);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getTeamById(teamId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  return { data, error };
}

export async function createTeam(team: Inserts<'teams'>) {
  const { data, error } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single();

  return { data, error };
}

export async function updateTeam(teamId: string, updates: Updates<'teams'>) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single();

  return { data, error };
}

export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      players (
        *,
        profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('team_id', teamId);

  return { data, error };
}

export async function addTeamMember(member: Inserts<'team_members'>) {
  const { data, error } = await supabase
    .from('team_members')
    .insert(member)
    .select()
    .single();
  return { data, error };
}

export async function removeTeamMember(memberId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId);
  return { error };
}

export async function removeTeamMemberByPlayer(teamId: string, playerId: string) {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('player_id', playerId);
  return { error };
}

// ==================== PLAYERS ====================

export async function getPlayers(filters?: {
  position?: string;
  minSkill?: number;
  maxSkill?: number;
  city?: string;
  availability?: string[];
}) {
  let query = supabase
    .from('players')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url,
        email,
        phone
      )
    `)
    .order('rating', { ascending: false });

  if (filters?.position) {
    query = query.eq('position', filters.position);
  }
  if (filters?.minSkill) {
    query = query.gte('skill_level', filters.minSkill);
  }
  if (filters?.maxSkill) {
    query = query.lte('skill_level', filters.maxSkill);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getPlayerById(playerId: string) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url,
        email,
        phone
      )
    `)
    .eq('id', playerId)
    .single();

  return { data, error };
}

export async function createPlayer(player: Inserts<'players'>) {
  const { data, error } = await supabase
    .from('players')
    .insert(player)
    .select()
    .single();

  return { data, error };
}

export async function updatePlayer(playerId: string, updates: Updates<'players'>) {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select()
    .single();

  return { data, error };
}

// ==================== MATCHES ====================

export async function getMatches(filters?: {
  teamId?: string;
  status?: string;
  upcoming?: boolean;
}) {
  let query = supabase
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(*),
      team_b:teams!matches_team_b_id_fkey(*),
      mvp:players(*)
    `)
    .order('scheduled_date', { ascending: true });

  if (filters?.teamId) {
    query = query.or(`team_a_id.eq.${filters.teamId},team_b_id.eq.${filters.teamId}`);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.upcoming) {
    query = query.gte('scheduled_date', new Date().toISOString().split('T')[0]);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function createMatch(match: Inserts<'matches'>) {
  const { data, error } = await supabase
    .from('matches')
    .insert(match)
    .select()
    .single();

  return { data, error };
}

export async function updateMatch(matchId: string, updates: Updates<'matches'>) {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  return { data, error };
}

export async function submitMatchResult(
  matchId: string,
  teamAScore: number,
  teamBScore: number,
  goalScorers: Array<{ player_id: string; team_id: string; goals: number }>,
  mvpPlayerId?: string,
  submittingTeamId?: string
) {
  // Get current match to check verification status
  const { data: currentMatch, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (fetchError || !currentMatch) {
    return { data: null, error: fetchError || new Error('Match not found') };
  }

  // Determine which team is submitting
  const isTeamA = submittingTeamId === currentMatch.team_a_id;
  const isTeamB = submittingTeamId === currentMatch.team_b_id;
  
  if (!isTeamA && !isTeamB) {
    return { data: null, error: new Error('Invalid team submission') };
  }

  // Check if this is a verification (second team confirming)
  // Handle case where columns might not exist yet (graceful degradation)
  const teamAHasSubmitted = (currentMatch as any).team_a_result_submitted || false;
  const teamBHasSubmitted = (currentMatch as any).team_b_result_submitted || false;
  const isVerification = (isTeamA && teamBHasSubmitted) || (isTeamB && teamAHasSubmitted);

  // If verifying, check if scores match
  if (isVerification) {
    const existingScoreA = currentMatch.team_a_score;
    const existingScoreB = currentMatch.team_b_score;
    
    if (existingScoreA !== teamAScore || existingScoreB !== teamBScore) {
      return { 
        data: null, 
        error: new Error('Scores do not match. Please verify the correct scores with the other team.') 
      };
    }
  }

  // Update match with result submission
  // Note: MVP will be auto-selected when result is verified if not manually provided
  const updateData: any = {
    team_a_score: teamAScore,
    team_b_score: teamBScore,
    // Only set MVP if manually provided, otherwise it will be auto-selected on verification
    ...(mvpPlayerId && { mvp_player_id: mvpPlayerId }),
  };

  // Mark which team submitted
  if (isTeamA) {
    updateData.team_a_result_submitted = true;
    updateData.team_a_submitted_at = new Date().toISOString();
  } else {
    updateData.team_b_result_submitted = true;
    updateData.team_b_submitted_at = new Date().toISOString();
  }

  // If both teams have submitted matching results, mark as verified and completed
  if (isVerification || (isTeamA && teamBHasSubmitted) || (isTeamB && teamAHasSubmitted)) {
    updateData.verified_result = true;
    updateData.status = 'completed';
  } else {
    // Status remains 'confirmed' until both teams verify
    updateData.status = 'confirmed';
  }

  // Try to update with verification columns first
  let { data: match, error: matchError } = await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)
    .select()
    .single();

  // Log the error for debugging
  if (matchError) {
    console.error('Match update error:', {
      message: matchError.message,
      code: matchError.code,
      status: matchError.status,
      details: matchError.details,
      hint: matchError.hint
    });
  }

  // If error is due to missing columns (400 Bad Request from PostgREST), try without verification columns (fallback)
  // Also try fallback for ANY 400 error, as schema cache issues can manifest differently
  if (matchError && (
    matchError.message?.includes('column') || 
    matchError.message?.includes('schema cache') ||
    matchError.message?.includes('team_b_result_submitted') ||
    matchError.message?.includes('team_a_result_submitted') ||
    matchError.message?.includes('42703') || // PostgreSQL error code for undefined column
    matchError.code === '42703' ||
    matchError.status === 400 || // Try fallback for any 400 error
    (matchError.status === 400 && matchError.message?.toLowerCase().includes('column'))
  )) {
    // Fallback: Update without verification columns
    const fallbackUpdateData: any = {
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      status: 'completed', // Mark as completed immediately if columns don't exist
      ...(mvpPlayerId && { mvp_player_id: mvpPlayerId }),
    };

    const fallbackResult = await supabase
      .from('matches')
      .update(fallbackUpdateData)
      .eq('id', matchId)
      .select()
      .single();

    if (fallbackResult.error) {
      return { 
        data: null, 
        error: new Error(
          'Database schema is missing required columns. Please run SIMPLE_FIX.sql in Supabase SQL Editor. ' +
          'The migration adds: team_a_result_submitted, team_b_result_submitted, team_a_submitted_at, team_b_submitted_at, verified_result'
        )
      };
    }

    // Use fallback result
    match = fallbackResult.data;
    matchError = null;
  } else if (matchError) {
    return { data: null, error: matchError };
  }

  // Store goal scorers immediately (even before verification)
  // This allows both teams to submit their goal scorers separately
  // Use the submittingTeamId parameter (already validated above)
  const teamIdForGoalScorers = submittingTeamId!; // Non-null assertion since we validated it exists
  
  // Get existing goal scorers to merge with new ones
  const { data: existingGoalScorers } = await supabase
    .from('goal_scorers')
    .select('*')
    .eq('match_id', matchId);

  // Create a map of existing goal scorers by player_id and team_id
  const existingMap = new Map();
  if (existingGoalScorers) {
    existingGoalScorers.forEach(gs => {
      const key = `${gs.player_id}_${gs.team_id}`;
      existingMap.set(key, gs);
    });
  }

  // Merge goal scorers: keep existing ones from the other team, update/add ones from submitting team
  const goalScorersToInsert = [];
  const goalScorersToUpdate = [];
  
  // Add/update goal scorers from the submitting team
  goalScorers.forEach(scorer => {
    const key = `${scorer.player_id}_${scorer.team_id}`;
    if (existingMap.has(key)) {
      // Update existing goal scorer
      goalScorersToUpdate.push({
        id: existingMap.get(key).id,
        goals: scorer.goals,
      });
    } else {
      // Insert new goal scorer
      goalScorersToInsert.push({
        match_id: matchId,
        player_id: scorer.player_id,
        team_id: scorer.team_id,
        goals: scorer.goals,
      });
    }
  });

  // Delete goal scorers from the submitting team that are no longer in the list
  // (in case they removed some)
  if (existingGoalScorers) {
    const submittingTeamGoalScorers = existingGoalScorers.filter(gs => gs.team_id === teamIdForGoalScorers);
    const currentPlayerIds = new Set(goalScorers.map(gs => gs.player_id));
    const toDelete = submittingTeamGoalScorers.filter(gs => !currentPlayerIds.has(gs.player_id));
    
    if (toDelete.length > 0) {
      await supabase
        .from('goal_scorers')
        .delete()
        .in('id', toDelete.map(gs => gs.id));
    }
  }

  // Update existing goal scorers
  for (const update of goalScorersToUpdate) {
    await supabase
      .from('goal_scorers')
      .update({ goals: update.goals })
      .eq('id', update.id);
  }

  // Insert new goal scorers
  if (goalScorersToInsert.length > 0) {
    const { error: goalsError } = await supabase
      .from('goal_scorers')
      .insert(goalScorersToInsert);

    if (goalsError) {
      return { data: null, error: goalsError };
    }
  }

  // Only update ratings and stats if result is verified (both teams confirmed)
  if (updateData.verified_result) {
    // Get all goal scorers (from both teams) for MVP selection
    const { data: allGoalScorers } = await supabase
      .from('goal_scorers')
      .select('*')
      .eq('match_id', matchId);

    // Auto-select MVP based on top goal scorer if not manually selected
    let finalMvpPlayerId = mvpPlayerId;
    
    if (!finalMvpPlayerId && allGoalScorers && allGoalScorers.length > 0) {
      // Find the player(s) with the most goals
      const maxGoals = Math.max(...allGoalScorers.map(s => s.goals));
      const topScorers = allGoalScorers.filter(s => s.goals === maxGoals);
      
      // If there are multiple players with the same highest goals, pick the first one
      // (In the future, could add tie-breaking logic like assists, team win, etc.)
      const topScorer = topScorers[0];
      finalMvpPlayerId = topScorer.player_id;
      
      // Update the match with the auto-selected MVP
      await supabase
        .from('matches')
        .update({ mvp_player_id: finalMvpPlayerId })
        .eq('id', matchId);
    }

    // Update team stats (wins/losses) and ratings
    const teamAWon = teamAScore > teamBScore;
    const teamBWon = teamBScore > teamAScore;
    const isDraw = teamAScore === teamBScore;

    try {
      // Update wins/losses/draws
      if (teamAWon) {
        const { data: teamA } = await supabase.from('teams').select('wins, rating').eq('id', match.team_a_id).single();
        const { data: teamB } = await supabase.from('teams').select('losses, rating').eq('id', match.team_b_id).single();
        
        if (teamA) {
          await supabase.from('teams').update({ 
            wins: (teamA.wins || 0) + 1,
            rating: Math.min(10.0, Math.max(1.0, (teamA.rating || 5.0) + 0.3))
          }).eq('id', match.team_a_id);
        }
        if (teamB) {
          await supabase.from('teams').update({ 
            losses: (teamB.losses || 0) + 1,
            rating: Math.min(10.0, Math.max(1.0, (teamB.rating || 5.0) - 0.3))
          }).eq('id', match.team_b_id);
        }
      } else if (teamBWon) {
        const { data: teamA } = await supabase.from('teams').select('losses, rating').eq('id', match.team_a_id).single();
        const { data: teamB } = await supabase.from('teams').select('wins, rating').eq('id', match.team_b_id).single();
        
        if (teamA) {
          await supabase.from('teams').update({ 
            losses: (teamA.losses || 0) + 1,
            rating: Math.min(10.0, Math.max(1.0, (teamA.rating || 5.0) - 0.3))
          }).eq('id', match.team_a_id);
        }
        if (teamB) {
          await supabase.from('teams').update({ 
            wins: (teamB.wins || 0) + 1,
            rating: Math.min(10.0, Math.max(1.0, (teamB.rating || 5.0) + 0.3))
          }).eq('id', match.team_b_id);
        }
      } else if (isDraw) {
        const { data: teamA } = await supabase.from('teams').select('draws').eq('id', match.team_a_id).single();
        const { data: teamB } = await supabase.from('teams').select('draws').eq('id', match.team_b_id).single();
        
        if (teamA) {
          await supabase.from('teams').update({ draws: (teamA.draws || 0) + 1 }).eq('id', match.team_a_id);
        }
        if (teamB) {
          await supabase.from('teams').update({ draws: (teamB.draws || 0) + 1 }).eq('id', match.team_b_id);
        }
      }

      // Update player ratings for goal scorers (+0.3 each)
      for (const scorer of goalScorers) {
        const { data: player } = await supabase
          .from('players')
          .select('rating, goals')
          .eq('id', scorer.player_id)
          .single();
        
        if (player) {
          await supabase.from('players').update({
            rating: Math.min(10.0, Math.max(1.0, (player.rating || 5.0) + 0.3)),
            goals: (player.goals || 0) + scorer.goals
          }).eq('id', scorer.player_id);
        }
      }

      // Update MVP player rating (+0.5)
      // Use the final MVP (either manually selected or auto-selected)
      if (finalMvpPlayerId) {
        const { data: mvpPlayer } = await supabase
          .from('players')
          .select('rating, mvps')
          .eq('id', finalMvpPlayerId)
          .single();
        
        if (mvpPlayer) {
          await supabase.from('players').update({
            rating: Math.min(10.0, Math.max(1.0, (mvpPlayer.rating || 5.0) + 0.5)),
            mvps: (mvpPlayer.mvps || 0) + 1
          }).eq('id', finalMvpPlayerId);
        }

        // Also update team MVP count
        const mvpTeamId = goalScorers.find(s => s.player_id === finalMvpPlayerId)?.team_id;
        if (mvpTeamId) {
          const { data: mvpTeam } = await supabase
            .from('teams')
            .select('total_mvps')
            .eq('id', mvpTeamId)
            .single();
          
          if (mvpTeam) {
            await supabase.from('teams').update({
              total_mvps: (mvpTeam.total_mvps || 0) + 1
            }).eq('id', mvpTeamId);
          }
        }
      }
    } catch (error) {
      console.warn('Error updating ratings and stats:', error);
    }
  } else {
    // If not verified yet, just save goal scorers for now
    await supabase.from('goal_scorers').delete().eq('match_id', matchId);
    if (goalScorers.length > 0) {
      await supabase.from('goal_scorers').insert(goalScorers.map(scorer => ({
        match_id: matchId,
        player_id: scorer.player_id,
        team_id: scorer.team_id,
        goals: scorer.goals,
      })));
    }
  }

  return { data: match, error: null };
}

// Get matches that need verification from a team
export async function getMatchesNeedingVerification(teamId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, logo_url),
      team_b:teams!matches_team_b_id_fkey(id, name, logo_url)
    `)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
    .eq('status', 'confirmed')
    .not('team_a_score', 'is', null)
    .not('team_b_score', 'is', null)
    .or(`and(team_a_id.eq.${teamId},team_b_result_submitted.eq.true,team_a_result_submitted.eq.false),and(team_b_id.eq.${teamId},team_a_result_submitted.eq.true,team_b_result_submitted.eq.false)`)
    .order('scheduled_date', { ascending: false });

  return { data, error };
}

// Get match history for a team
export async function getTeamMatchHistory(teamId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      team_a:teams!matches_team_a_id_fkey(id, name, logo_url, rating),
      team_b:teams!matches_team_b_id_fkey(id, name, logo_url, rating),
      goal_scorers (
        *,
        players (
          id,
          profiles (full_name)
        )
      )
    `)
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
    .eq('status', 'completed')
    .eq('verified_result', true)
    .order('scheduled_date', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error };
}

// ==================== MATCH REQUESTS ====================

export async function createMatchRequest(request: Inserts<'match_requests'>) {
  const { data, error } = await supabase
    .from('match_requests')
    .insert(request)
    .select()
    .single();

  return { data, error };
}

export async function getMatchRequests(teamId: string) {
  const { data, error } = await supabase
    .from('match_requests')
    .select(`
      *,
      requester_team:teams!match_requests_requester_team_id_fkey(*),
      requested_team:teams!match_requests_requested_team_id_fkey(*)
    `)
    .or(`requester_team_id.eq.${teamId},requested_team_id.eq.${teamId}`)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateMatchRequest(requestId: string, status: string) {
  const { data, error } = await supabase
    .from('match_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  return { data, error };
}

// ==================== LEADERBOARD ====================

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('rating', { ascending: false })
    .order('wins', { ascending: false })
    .limit(limit);

  return { data, error };
}

// ==================== TOURNAMENTS ====================

export async function getTournaments(filters?: {
  status?: string;
  approved?: boolean;
}) {
  let query = supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.approved !== undefined) {
    query = query.eq('admin_approved', filters.approved);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function createTournament(tournament: Inserts<'tournaments'>) {
  const { data, error } = await supabase
    .from('tournaments')
    .insert(tournament)
    .select()
    .single();

  return { data, error };
}

export async function registerForTournament(
  tournamentId: string,
  teamId?: string,
  playerId?: string
) {
  const { data, error } = await supabase
    .from('tournament_registrations')
    .insert({
      tournament_id: tournamentId,
      team_id: teamId || null,
      player_id: playerId || null,
      status: 'pending',
    })
    .select()
    .single();

  return { data, error };
}

// ==================== PLAYER INVITATIONS ====================

export async function getPlayerInvitations(playerId: string) {
  const { data, error } = await supabase
    .from('player_invitations')
    .select(`
      *,
      team:teams(*),
      match:matches(*)
    `)
    .eq('player_id', playerId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function createPlayerInvitation(invitation: Inserts<'player_invitations'>) {
  const { data, error } = await supabase
    .from('player_invitations')
    .insert(invitation)
    .select()
    .single();

  return { data, error };
}

export async function updatePlayerInvitation(invitationId: string, status: string) {
  const { data, error } = await supabase
    .from('player_invitations')
    .update({ status })
    .eq('id', invitationId)
    .select()
    .single();

  return { data, error };
}

// ==================== PROFILES ====================

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
}

export async function getProfileById(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  return { data, error };
}

export async function createProfile(profile: Inserts<'profiles'>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  return { data, error };
}

export async function updateProfile(profileId: string, updates: Updates<'profiles'>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  return { data, error };
}

export async function checkProfileComplete(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!profile) return false;
  
  // Check if profile has basic info
  return !!(profile.full_name && profile.email);
}

export async function checkPlayerProfile(profileId: string) {
  const { data } = await supabase
    .from('players')
    .select('id')
    .eq('profile_id', profileId)
    .single();

  return !!data;
}

export async function checkTeamProfile(profileId: string) {
  const { data } = await supabase
    .from('teams')
    .select('id')
    .eq('captain_id', profileId)
    .single();

  return !!data;
}

// ==================== FILE UPLOADS ====================

export async function uploadFile(
  bucket: 'team-logos' | 'player-photos' | 'avatars',
  file: File,
  path: string
) {
  // Ensure we have a valid File object
  if (!(file instanceof File)) {
    console.error('Invalid file object:', file);
    return { data: null, error: { message: 'Invalid file object' } };
  }

  // Log file details for debugging
  console.log('Uploading file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    bucket,
    path
  });

  // Get the content type from the file
  let contentType = file.type;
  
  // If file.type is empty, try to infer from file extension
  if (!contentType) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp'
    };
    contentType = mimeTypes[extension || ''] || 'image/png';
  }
  
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    return { data: null, error: { message: `File type ${contentType} is not supported. Please use PNG, JPEG, or WebP.` } };
  }

  // Ensure we're uploading the actual file, not a JSON object
  if (file.size === 0) {
    return { data: null, error: { message: 'File is empty' } };
  }

  try {
    // Create a new File object to ensure it's a proper File instance
    // This helps avoid any serialization issues
    const fileToUpload = file instanceof File 
      ? file 
      : new File([file], file.name, { type: contentType });

    // Use upload with explicit options
    // Note: Don't set contentType if bucket has MIME restrictions - let Supabase infer it
    const uploadOptions: any = {
      cacheControl: '3600',
      upsert: true, // Allow overwriting existing files
    };

    // Only set contentType if file.type is available and valid
    if (fileToUpload.type && allowedTypes.includes(fileToUpload.type)) {
      uploadOptions.contentType = fileToUpload.type;
    }

    console.log('Uploading with options:', {
      bucket,
      path,
      fileName: fileToUpload.name,
      fileType: fileToUpload.type,
      fileSize: fileToUpload.size,
      uploadOptions
    });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileToUpload, uploadOptions);

    if (error) {
      console.error('Storage upload error details:', {
        error,
        message: error.message,
        statusCode: error.statusCode,
        errorDetails: JSON.stringify(error, null, 2),
        bucket,
        path,
        contentType,
        fileSize: file.size,
        fileType: file.type
      });
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Upload failed: No data returned' } };
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('Upload successful:', urlData.publicUrl);
    return { data: urlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return { data: null, error: { message: err.message || 'Upload failed' } };
  }
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  return { error };
}

