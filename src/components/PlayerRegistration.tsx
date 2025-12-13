import { useState } from 'react';
import { Upload, User, MapPin, Target, Calendar, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createPlayer, uploadFile } from '../lib/api';
import { supabase } from '../lib/supabase';

interface PlayerRegistrationProps {
  onBack: () => void;
  onRegister?: () => void;
}

export default function PlayerRegistration({ onBack, onRegister }: PlayerRegistrationProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [skillLevel, setSkillLevel] = useState(5);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [experience, setExperience] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [bio, setBio] = useState('');
  const [area, setArea] = useState('');

  const positions = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward',
    'Winger',
    'Any Position'
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Photo must be less than 2MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to register as a player');
      return;
    }

    if (!fullName.trim() || !age || !selectedPosition || !area) {
      setError('Please fill in all required fields including area');
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

      // Check if player profile already exists
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (existingPlayer) {
        setError('You already have a player profile. Please edit your existing profile instead.');
        setLoading(false);
        return;
      }

      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        const fileName = `${user.id}-${Date.now()}.${photoFile.name.split('.').pop()}`;
        const { data: uploadedUrl, error: uploadError } = await uploadFile('player-photos', photoFile, fileName);
        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          // Continue without photo
        } else {
          photoUrl = uploadedUrl;
        }
      }

      // Create player profile
      const { data: player, error: playerError } = await createPlayer({
        profile_id: profile.id,
        position: selectedPosition,
        skill_level: skillLevel,
        age: parseInt(age),
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        experience: experience || null,
        city: area || 'Karachi',
        availability_days: selectedDays,
        preferred_time: preferredTime || null,
        bio: bio || null,
        photo_url: photoUrl,
        matches_played: 0,
        goals: 0,
        assists: 0,
        mvps: 0,
        rating: 5.0,
      });

      if (playerError || !player) {
        setError(playerError?.message || 'Failed to create player profile');
        setLoading(false);
        return;
      }

      // Success
      if (onRegister) {
        onRegister();
      } else {
        onBack();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

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
          Register as <span className="text-[#00FF57]">Player</span>
        </h1>
        <p className="text-zinc-500">Join the futsal community</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Profile Photo (Optional)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="block bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-8 cursor-pointer hover:border-[#00FF57]/50 transition-colors text-center"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Photo preview" className="w-32 h-32 mx-auto rounded-xl object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">Tap to upload photo</p>
                    <p className="text-xs text-zinc-600 mt-1">Max 2MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Full Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
                required
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Age *</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              min="10"
              max="100"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
              required
            />
          </div>

          {/* Height and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Height"
                min="100"
                max="250"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight"
                min="30"
                max="200"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Experience Level</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#00FF57] transition-colors"
            >
              <option value="">Select experience</option>
              <option value="Beginner (0-1 years)">Beginner (0-1 years)</option>
              <option value="Intermediate (1-3 years)">Intermediate (1-3 years)</option>
              <option value="Advanced (3-5 years)">Advanced (3-5 years)</option>
              <option value="Expert (5+ years)">Expert (5+ years)</option>
            </select>
          </div>

          {/* Area */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Area *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none z-10" />
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-[#00FF57] transition-colors appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-zinc-900">Select your area</option>
                <option value="DHA" className="bg-zinc-900">DHA</option>
                <option value="Clifton" className="bg-zinc-900">Clifton</option>
                <option value="Gulshan-e-Iqbal" className="bg-zinc-900">Gulshan-e-Iqbal</option>
                <option value="Gulistan-e-Johar" className="bg-zinc-900">Gulistan-e-Johar</option>
                <option value="North Nazimabad" className="bg-zinc-900">North Nazimabad</option>
                <option value="Malir" className="bg-zinc-900">Malir</option>
                <option value="Lyari" className="bg-zinc-900">Lyari</option>
                <option value="Saddar" className="bg-zinc-900">Saddar</option>
                <option value="PECHS" className="bg-zinc-900">PECHS</option>
                <option value="Bahadurabad" className="bg-zinc-900">Bahadurabad</option>
                <option value="Shahrah-e-Faisal" className="bg-zinc-900">Shahrah-e-Faisal</option>
                <option value="Korangi" className="bg-zinc-900">Korangi</option>
                <option value="Landhi" className="bg-zinc-900">Landhi</option>
                <option value="Gulshan-e-Maymar" className="bg-zinc-900">Gulshan-e-Maymar</option>
                <option value="Scheme 33" className="bg-zinc-900">Scheme 33</option>
                <option value="Defence" className="bg-zinc-900">Defence</option>
                <option value="Karimabad" className="bg-zinc-900">Karimabad</option>
                <option value="Federal B Area" className="bg-zinc-900">Federal B Area</option>
                <option value="Garden" className="bg-zinc-900">Garden</option>
                <option value="Kemari" className="bg-zinc-900">Kemari</option>
              </select>
            </div>
          </div>

          {/* Preferred Position */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Preferred Position *</label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none z-10" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-[#00FF57] transition-colors appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-zinc-900">Select position</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos} className="bg-zinc-900">{pos}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill Level Slider */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Skill Level: <span className="text-[#00FF57]">{skillLevel}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={skillLevel}
              onChange={(e) => setSkillLevel(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00FF57 0%, #00FF57 ${(skillLevel - 1) * 11.11}%, #27272a ${(skillLevel - 1) * 11.11}%, #27272a 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Beginner</span>
              <span>Advanced</span>
              <span>Pro</span>
            </div>
          </div>

          {/* Availability Days */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Availability (Days)</label>
            <div className="flex gap-2 flex-wrap">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedDays.includes(day)
                      ? 'bg-[#00FF57] text-black'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Time */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Preferred Time</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-[#00FF57] transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-zinc-900">Select time</option>
                <option value="morning" className="bg-zinc-900">Morning (6AM - 12PM)</option>
                <option value="afternoon" className="bg-zinc-900">Afternoon (12PM - 6PM)</option>
                <option value="evening" className="bg-zinc-900">Evening (6PM - 12AM)</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Bio / About Me</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself, your playing style, experience..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl py-4 text-black font-medium shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Register as Player</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
