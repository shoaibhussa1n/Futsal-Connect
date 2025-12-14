import { useEffect, useState } from 'react';
import { Edit, LogOut, User, Trophy, Target, Award, UserPlus, Users, Bell, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function UserProfile({ onLogout, onPlayerRegister, onPlayerMarketplace, onPlayerNotifications, onEditProfile, onViewTeamProfile }: { 
  onLogout: () => void;
  onPlayerRegister?: () => void;
  onPlayerMarketplace?: () => void;
  onPlayerNotifications?: () => void;
  onEditProfile?: () => void;
  onViewTeamProfile?: (teamId: string) => void;
}) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

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

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Get player profile
        const { data: playerData } = await supabase
          .from('players')
          .select('*')
          .eq('profile_id', profileData.id)
          .single();

        if (playerData) {
          setPlayer(playerData);
        }

        // Get team (if captain)
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('captain_id', profileData.id)
          .single();

        if (teamData) {
          setTeam(teamData);

          // Get recent matches
          const { data: matches } = await supabase
            .from('matches')
            .select(`
              *,
              team_a:teams!matches_team_a_id_fkey(name),
              team_b:teams!matches_team_b_id_fkey(name)
            `)
            .or(`team_a_id.eq.${teamData.id},team_b_id.eq.${teamData.id}`)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(5);

          if (matches) {
            setRecentMatches(matches.map(match => {
              const isTeamA = match.team_a_id === teamData.id;
              const opponent = isTeamA ? match.team_b : match.team_a;
              const won = isTeamA 
                ? (match.team_a_score || 0) > (match.team_b_score || 0)
                : (match.team_b_score || 0) > (match.team_a_score || 0);
              const score = isTeamA
                ? `${match.team_a_score || 0}-${match.team_b_score || 0}`
                : `${match.team_b_score || 0}-${match.team_a_score || 0}`;

              return {
                opponent: opponent?.name || 'Unknown',
                result: won ? `Won ${score}` : `Lost ${score}`,
                date: new Date(match.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                mvp: match.mvp_player_id === playerData?.id,
              };
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FF57]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Cover */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-black h-40 relative">
        <div className="absolute -bottom-16 left-6 flex items-end gap-4">
          <div className="w-32 h-32 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-2xl flex items-center justify-center border-4 border-black shadow-[0_0_40px_rgba(0,255,87,0.3)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <User className="w-16 h-16 text-black" />
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pt-24 pb-6">
        {/* User Info */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold mb-1 text-white">{profile?.full_name || 'User'}</h1>
            <p className="text-sm text-zinc-500">{team ? 'Team Captain' : player ? 'Player' : 'Member'}</p>
            {team && (
              <p className="text-sm text-zinc-600 mt-1">{team.name}</p>
            )}
          </div>
          <button 
            onClick={onEditProfile}
            className="bg-zinc-900 border-2 border-[#00FF57] text-[#00FF57] p-3 rounded-xl active:scale-95 transition-transform flex-shrink-0"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats */}
        {player && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
              <Trophy className="w-5 h-5 mx-auto mb-2 text-[#00FF57]" />
              <div className="text-xl font-bold text-white mb-1">{player.matches_played || 0}</div>
              <div className="text-xs text-zinc-500">Matches</div>
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
              <Target className="w-5 h-5 mx-auto mb-2 text-[#FF6600]" />
              <div className="text-xl font-bold text-white mb-1">{player.goals || 0}</div>
              <div className="text-xs text-zinc-500">Goals</div>
            </div>

            <div className="bg-zinc-900 rounded-xl p-4 text-center border border-zinc-800">
              <Award className="w-5 h-5 mx-auto mb-2 text-[#007BFF]" />
              <div className="text-xl font-bold text-white mb-1">{player.mvps || 0}</div>
              <div className="text-xs text-zinc-500">MVPs</div>
            </div>
          </div>
        )}

        {/* My Team Section */}
        {team && onViewTeamProfile && (
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 mb-5 border border-[#00FF57]/20 cursor-pointer active:scale-98 transition-transform" onClick={() => onViewTeamProfile(team.id)}>
            <div className="flex items-center gap-4">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-black" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white truncate">My Team</h3>
                  <span className="bg-[#00FF57] text-black px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                    Captain
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-2 truncate">{team.name}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[#00FF57]" />
                    {team.wins || 0}W
                  </span>
                  <span>{team.losses || 0}L</span>
                  <span className="text-[#00FF57] font-medium">Rating: {team.rating?.toFixed(1) || '5.0'}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-500 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Personal Info Section */}
        <div className="bg-zinc-900 rounded-xl p-5 mb-5 border border-zinc-800">
          <h3 className="text-base font-semibold mb-4 text-white">Personal Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-zinc-800">
              <span className="text-zinc-400 text-sm">Email</span>
              <span className="text-white text-sm font-medium">{profile?.email || user?.email || 'N/A'}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">Phone</span>
                <span className="text-white text-sm font-medium">{profile.phone}</span>
              </div>
            )}
            {player && (
              <>
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-400 text-sm">Position</span>
                  <span className="text-white text-sm font-medium">{player.position || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-400 text-sm">Age Group</span>
                  <span className="text-white text-sm font-medium">{player.age ? `${player.age} years` : 'N/A'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg mb-4">Recent Matches</h3>
            <div className="space-y-3">
              {recentMatches.map((match, index) => (
                <div key={index} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-1">vs {match.opponent}</p>
                      <p className="text-xs text-zinc-500">{match.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {match.mvp && (
                        <div className="bg-[#FF6600]/20 text-[#FF6600] px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          MVP
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        match.result.startsWith('Won')
                          ? 'bg-[#00FF57]/20 text-[#00FF57]'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {match.result}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings & Actions */}
        <div className="space-y-2.5">
          {/* Player Features Section */}
          {!player && (
            <div className="bg-gradient-to-br from-[#00FF57]/10 to-[#00cc44]/10 border border-[#00FF57]/30 rounded-xl p-4 mb-2">
              <h3 className="text-sm font-medium text-[#00FF57] mb-3">Player Features</h3>
              <button 
                onClick={onPlayerRegister}
                className="w-full bg-zinc-900 border border-zinc-800 text-white py-3 rounded-lg flex items-center justify-between px-4 active:scale-95 transition-transform hover:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#00FF57]" />
                  <span className="font-medium">Register as Player</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          )}

          {player && (
            <>
              <button 
                onClick={onPlayerMarketplace}
                className="w-full bg-zinc-900 border border-zinc-800 text-white py-3.5 rounded-xl flex items-center justify-between px-5 active:scale-95 transition-transform hover:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#00A3FF]" />
                  <span className="font-medium">Player Marketplace</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </button>
              <button 
                onClick={onPlayerNotifications}
                className="w-full bg-zinc-900 border border-zinc-800 text-white py-3.5 rounded-xl flex items-center justify-between px-5 active:scale-95 transition-transform hover:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#FF6600]" />
                  <span className="font-medium">Player Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">0</span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              </button>
            </>
          )}

          <button 
            onClick={onEditProfile}
            className="w-full bg-zinc-900 border border-zinc-800 text-white py-3.5 rounded-xl flex items-center justify-between px-5 active:scale-95 transition-transform hover:bg-zinc-800"
          >
            <span className="font-medium">Edit Profile</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button className="w-full bg-zinc-900 border border-zinc-800 text-white py-3.5 rounded-xl flex items-center justify-between px-5 active:scale-95 transition-transform hover:bg-zinc-800">
            <span className="font-medium">Settings</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button className="w-full bg-zinc-900 border border-zinc-800 text-white py-3.5 rounded-xl flex items-center justify-between px-5 active:scale-95 transition-transform hover:bg-zinc-800">
            <span className="font-medium">Help & Support</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-900/20 border-2 border-red-500 text-red-500 py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-red-900/30 mt-4 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
