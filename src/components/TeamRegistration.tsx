import { useState } from 'react';
import { ChevronLeft, Plus, X, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createTeam, uploadFile } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Player {
  id: number;
  name: string;
  age: string;
  position: string;
}

export default function TeamRegistration({ onBack, onComplete }: { onBack: () => void; onComplete?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('Open');
  const [teamLevel, setTeamLevel] = useState(5);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPlayer = () => {
    setPlayers([...players, { id: Date.now(), name: '', age: '', position: 'Forward' }]);
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: number, field: keyof Player, value: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a team');
      return;
    }

    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setError('Profile not found. Please complete your profile first.');
        setLoading(false);
        return;
      }

      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const fileName = `${user.id}-${Date.now()}.${logoFile.name.split('.').pop()}`;
        const { data: uploadedUrl, error: uploadError } = await uploadFile('team-logos', logoFile, fileName);
        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          // Continue without logo
        } else {
          logoUrl = uploadedUrl;
        }
      }

      // Create team
      const { data: team, error: teamError } = await createTeam({
        name: teamName,
        captain_id: profile.id,
        logo_url: logoUrl,
        age_group: ageGroup,
        team_level: teamLevel,
        rating: 5.0,
        wins: 0,
        losses: 0,
        draws: 0,
        total_goals: 0,
        total_mvps: 0,
      });

      if (teamError || !team) {
        setError(teamError?.message || 'Failed to create team');
        setLoading(false);
        return;
      }

      // Note: Players will need to be registered separately as they need player profiles
      // For now, we just create the team. Players can be added later through the player marketplace

      // Success - call onComplete if provided, otherwise go back
      if (onComplete) {
        onComplete();
      } else {
        onBack();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="text-[#00FF57]">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl">Register Team</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Team Logo Upload */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Team Logo (Optional)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="block bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-8 cursor-pointer hover:border-[#00FF57]/50 transition-colors text-center"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-32 h-32 mx-auto rounded-xl object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">Tap to upload logo</p>
                    <p className="text-xs text-zinc-600 mt-1">Max 2MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Team Name */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Team Name *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Age Group */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Age Group *</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white focus:border-[#00FF57] focus:outline-none transition-colors"
              required
            >
              <option value="U16">U16</option>
              <option value="U18">U18</option>
              <option value="U21">U21</option>
              <option value="Open">Open</option>
            </select>
          </div>

          {/* Team Level Slider */}
          <div>
            <label className="text-sm text-zinc-400 mb-3 block">
              Team Level: <span className="text-[#00FF57]">{teamLevel}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={teamLevel}
              onChange={(e) => setTeamLevel(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #00FF57 0%, #00FF57 ${teamLevel * 10}%, #27272a ${teamLevel * 10}%, #27272a 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-2">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Pro</span>
            </div>
          </div>

          {/* Info about players */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-400">
              💡 You can add players to your team after registration through the Player Marketplace or by inviting them directly.
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform mb-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Team...</span>
              </>
            ) : (
              <span>Create Team</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
