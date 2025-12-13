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
  mvpPlayerId?: string
) {
  // Update match result
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      mvp_player_id: mvpPlayerId,
      status: 'completed',
    })
    .eq('id', matchId)
    .select()
    .single();

  if (matchError) {
    return { data: null, error: matchError };
  }

  // Add goal scorers
  if (goalScorers.length > 0) {
    const { error: goalsError } = await supabase
      .from('goal_scorers')
      .insert(goalScorers.map(scorer => ({
        match_id: matchId,
        player_id: scorer.player_id,
        team_id: scorer.team_id,
        goals: scorer.goals,
      })));

    if (goalsError) {
      return { data: null, error: goalsError };
    }
  }

  // Update team stats (wins/losses)
  const teamAWon = teamAScore > teamBScore;
  const teamBWon = teamBScore > teamAScore;
  const isDraw = teamAScore === teamBScore;

  // Try to use RPC functions if available, otherwise update directly
  try {
    if (teamAWon) {
      // Try RPC first, fallback to direct update
      const rpcResult = await supabase.rpc('increment_team_wins', { team_id: match.team_a_id });
      if (rpcResult.error) {
        // Fallback: get current value and increment
        const { data: teamA } = await supabase.from('teams').select('wins').eq('id', match.team_a_id).single();
        if (teamA) {
          await supabase.from('teams').update({ wins: (teamA.wins || 0) + 1 }).eq('id', match.team_a_id);
        }
        const { data: teamB } = await supabase.from('teams').select('losses').eq('id', match.team_b_id).single();
        if (teamB) {
          await supabase.from('teams').update({ losses: (teamB.losses || 0) + 1 }).eq('id', match.team_b_id);
        }
      } else {
        await supabase.rpc('increment_team_losses', { team_id: match.team_b_id });
      }
    } else if (teamBWon) {
      const rpcResult = await supabase.rpc('increment_team_wins', { team_id: match.team_b_id });
      if (rpcResult.error) {
        const { data: teamB } = await supabase.from('teams').select('wins').eq('id', match.team_b_id).single();
        if (teamB) {
          await supabase.from('teams').update({ wins: (teamB.wins || 0) + 1 }).eq('id', match.team_b_id);
        }
        const { data: teamA } = await supabase.from('teams').select('losses').eq('id', match.team_a_id).single();
        if (teamA) {
          await supabase.from('teams').update({ losses: (teamA.losses || 0) + 1 }).eq('id', match.team_a_id);
        }
      } else {
        await supabase.rpc('increment_team_losses', { team_id: match.team_a_id });
      }
    } else if (isDraw) {
      const rpcResult = await supabase.rpc('increment_team_draws', { team_id: match.team_a_id });
      if (rpcResult.error) {
        const { data: teamA } = await supabase.from('teams').select('draws').eq('id', match.team_a_id).single();
        if (teamA) {
          await supabase.from('teams').update({ draws: (teamA.draws || 0) + 1 }).eq('id', match.team_a_id);
        }
        const { data: teamB } = await supabase.from('teams').select('draws').eq('id', match.team_b_id).single();
        if (teamB) {
          await supabase.from('teams').update({ draws: (teamB.draws || 0) + 1 }).eq('id', match.team_b_id);
        }
      } else {
        await supabase.rpc('increment_team_draws', { team_id: match.team_b_id });
      }
    }

    // Recalculate ratings (optional - can be handled by database triggers)
    await supabase.rpc('calculate_team_rating', { team_id: match.team_a_id }).catch(() => {
      // Rating calculation will be handled by database triggers or manually
    });
    await supabase.rpc('calculate_team_rating', { team_id: match.team_b_id }).catch(() => {
      // Rating calculation will be handled by database triggers or manually
    });
  } catch (error) {
    console.warn('Error updating team stats:', error);
  }

  return { data: match, error: null };
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
    // Use upload with explicit options
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing files
        contentType: contentType,
        duplex: 'half', // Required for some browsers
      });

    if (error) {
      console.error('Storage upload error details:', {
        error,
        message: error.message,
        statusCode: error.statusCode,
        bucket,
        path,
        contentType,
        fileSize: file.size
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

