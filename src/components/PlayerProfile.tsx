import { useState, useEffect } from 'react';
import { User, Edit, Trash2, TrendingUp, Target, Award, Loader2 } from 'lucide-react';
import { getPlayerById } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PlayerProfileProps {
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  playerId?: string;
}

export default function PlayerProfile({ onBack, onEdit, onDelete, playerId }: PlayerProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    // Reset state when playerId changes
    setPlayer(null);
    setProfile(null);
    setIsOwnProfile(false);
    loadPlayerData();
  }, [playerId, user]);

  const loadPlayerData = async () => {
    // Get playerId from prop or sessionStorage
    const idToLoad = playerId || sessionStorage.getItem('playerId');
    
    if (!idToLoad) {
      console.warn('No playerId provided');
      setLoading(false);
      return;
    }

    console.log('Loading player data for ID:', idToLoad);
    await fetchPlayerData(idToLoad);
  };

  const fetchPlayerData = async (id: string) => {
    try {
      setLoading(true);
      console.log('Fetching player with ID:', id);
      
      const { data, error } = await getPlayerById(id);
      
      if (error) {
        console.error('Error loading player:', error);
        alert(`Error loading player: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('Player data received:', data);

      if (!data) {
        console.warn('No player data returned');
        setLoading(false);
        return;
      }

      setPlayer(data);
      
      // Get profile data - always fetch full profile
      if (data.profile_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.profile_id)
          .single();
        
        if (profileError) {
          console.error('Error loading profile:', profileError);
        } else if (profileData) {
          console.log('Profile data received:', profileData);
          setProfile(profileData);
          
          // Check if this is the current user's profile
          if (user && profileData.user_id === user.id) {
            setIsOwnProfile(true);
          }
        } else {
          console.warn('No profile data found for profile_id:', data.profile_id);
        }
      } else {
        console.warn('Player data has no profile_id');
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  if (!player || !profile) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
          <button onClick={onBack} className="text-[#00FF57] mb-4">
            ← Return to Home
          </button>
          <h1 className="text-3xl mb-2">
            Player <span className="text-[#00FF57]">Profile</span>
          </h1>
        </div>
        <div className="px-6 py-12 text-center">
          <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">Player not found</p>
          <button onClick={onBack} className="text-[#00FF57]">Go Back</button>
        </div>
      </div>
    );
  }

  const playerName = profile.full_name || 'Unknown Player';
  const playerAge = player.age ? `${player.age} years` : '';
  const playerCity = player.city || 'Karachi';
  const position = player.position || 'Not specified';
  const skillLevel = player.skill_level || 0;
  const bio = player.bio || 'No bio available.';
  const availabilityDays = player.availability_days || [];
  const preferredTime = player.preferred_time || 'Not specified';
  const matchesPlayed = player.matches_played || 0;
  const goals = player.goals || 0;
  const assists = player.assists || 0;
  const mvps = player.mvps || 0;
  const rating = player.rating || 0;

  // Calculate performance metrics (simplified)
  const technicalSkills = Math.min(100, (skillLevel / 10) * 100);
  const teamwork = Math.min(100, (rating / 10) * 100);
  const fitness = Math.min(100, ((matchesPlayed / 50) * 100));
  const gameIQ = Math.min(100, ((goals + assists) / 20) * 100);

  const dayAbbreviations: { [key: string]: string } = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-900 to-black px-6 pt-12 pb-6">
        <button 
          onClick={onBack}
          className="text-[#00FF57] mb-4"
        >
          ← Return to Home
        </button>
        <h1 className="text-3xl mb-2">
          Player <span className="text-[#00FF57]">Profile</span>
        </h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-zinc-800">
          {/* Photo and Basic Info */}
          <div className="flex items-start gap-4 mb-6">
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={playerName}
                className="w-24 h-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-2xl flex items-center justify-center">
                <User className="w-12 h-12 text-black" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl mb-1">{playerName}</h2>
              <p className="text-zinc-500 text-sm mb-2">
                {playerAge && `${playerAge} • `}{playerCity}
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-[#00FF57]/20 text-[#00FF57] px-3 py-1 rounded-full text-xs">
                  {position}
                </span>
                <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-xs">
                  Skill: {skillLevel}/10
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6 p-4 bg-black/50 rounded-xl">
            <p className="text-sm text-zinc-400 leading-relaxed">
              {bio}
            </p>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <h3 className="text-sm text-zinc-500 mb-3">Availability</h3>
            <div className="flex gap-2 flex-wrap">
              {availabilityDays.length > 0 ? (
                availabilityDays.map((day: string) => (
                  <div
                    key={day}
                    className="bg-[#00FF57]/10 border border-[#00FF57]/30 text-[#00FF57] px-3 py-1 rounded-lg text-xs"
                  >
                    {dayAbbreviations[day] || day}
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">No availability set</p>
              )}
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              {preferredTime !== 'Not specified' ? preferredTime : 'Time not specified'}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Matches Played */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#00FF57]" />
              <p className="text-xs text-zinc-500">Matches</p>
            </div>
            <p className="text-3xl text-white">{matchesPlayed}</p>
          </div>

          {/* Goals */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#FF6600]" />
              <p className="text-xs text-zinc-500">Goals</p>
            </div>
            <p className="text-3xl text-[#FF6600]">{goals}</p>
          </div>

          {/* Assists */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-[#00A3FF]" />
              <p className="text-xs text-zinc-500">Assists</p>
            </div>
            <p className="text-3xl text-[#00A3FF]">{assists}</p>
          </div>

          {/* MVPs */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-zinc-500">MVPs</p>
            </div>
            <p className="text-3xl text-yellow-500">{mvps}</p>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-6 border border-[#00FF57]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Performance Rating</h3>
            <div className="text-3xl text-[#00FF57]">{rating.toFixed(1)}</div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Technical Skills', value: Math.round(technicalSkills) },
              { label: 'Teamwork', value: Math.round(teamwork) },
              { label: 'Fitness', value: Math.round(fitness) },
              { label: 'Game IQ', value: Math.round(gameIQ) }
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{stat.label}</span>
                  <span className="text-[#00FF57]">{stat.value}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00FF57] to-[#00cc44]"
                    style={{ width: `${stat.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons - Only show if it's the user's own profile */}
        {isOwnProfile && (
          <div className="space-y-3">
            <button
              onClick={onEdit}
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl py-4 text-[#00FF57] font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>

            <button
              onClick={onDelete}
              className="w-full bg-zinc-900 border-2 border-red-500/30 rounded-xl py-4 text-red-500 font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <Trash2 className="w-5 h-5" />
              Delete Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
