import { useState } from 'react';
import { Upload, User, Calendar, Ruler, Weight, Award, Target, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile } from '../lib/api';
import { supabase } from '../lib/supabase';

interface ProfileCompletionProps {
  onComplete: () => void;
}

export default function ProfileCompletion({ onComplete }: ProfileCompletionProps) {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [skillLevel, setSkillLevel] = useState(5);
  const [experience, setExperience] = useState('');
  const [position, setPosition] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const positions = [
    'Goalkeeper',
    'Defender',
    'Midfielder',
    'Forward',
    'Winger',
    'Any Position'
  ];

  const experienceLevels = [
    'Beginner (0-1 years)',
    'Intermediate (1-3 years)',
    'Advanced (3-5 years)',
    'Expert (5+ years)'
  ];

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
      setError('You must be logged in');
      return;
    }

    if (!fullName.trim() || !age || !position) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get or create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Log any error when checking for existing profile (non-critical)
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile check error:', profileError);
      }

      let profileId: string;

      if (profile) {
        profileId = profile.id;
        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            email: user.email,
          })
          .eq('id', profileId);

        if (updateError) {
          console.error('Profile update error:', updateError);
          setError(`Failed to update profile: ${updateError.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      } else {
        // Create profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: fullName,
            email: user.email,
          })
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          setError(`Failed to create profile: ${createError.message || 'Unknown error'}. Please check your database setup and RLS policies.`);
          setLoading(false);
          return;
        }

        if (!newProfile) {
          setError('Failed to create profile: No data returned');
          setLoading(false);
          return;
        }
        
        profileId = newProfile.id;
      }

      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        try {
          const fileName = `${user.id}-${Date.now()}.${photoFile.name.split('.').pop()}`;
          const { data: uploadedUrl, error: uploadError } = await uploadFile('avatars', photoFile, fileName);
          if (uploadError) {
            console.warn('Photo upload error (non-critical):', uploadError);
            // Don't fail the whole process if photo upload fails
          } else if (uploadedUrl) {
            photoUrl = uploadedUrl;
            // Update profile with avatar
            const { error: avatarUpdateError } = await supabase
              .from('profiles')
              .update({ avatar_url: photoUrl })
              .eq('id', profileId);
            
            if (avatarUpdateError) {
              console.warn('Avatar update error (non-critical):', avatarUpdateError);
            }
          }
        } catch (uploadErr: any) {
          console.warn('Photo upload failed (non-critical):', uploadErr);
          // Continue even if photo upload fails
        }
      }

      // Store profile completion data in localStorage for path selection
      localStorage.setItem('profileData', JSON.stringify({
        profileId,
        fullName,
        age,
        height,
        weight,
        skillLevel,
        experience,
        position,
        photoUrl
      }));

      // Profile completed - user can now choose path
      onComplete();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
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

      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Age *</label>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your age"
            min="10"
            max="100"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Height (cm)</label>
          <div className="relative">
            <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Height"
              min="100"
              max="250"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Weight (kg)</label>
          <div className="relative">
            <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Weight"
              min="30"
              max="200"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00FF57] transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Preferred Position *</label>
        <div className="relative">
          <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none z-10" />
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
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

      <div>
        <label className="text-sm text-zinc-400 mb-3 block">
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

      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Experience Level</label>
        <div className="relative">
          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none z-10" />
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-[#00FF57] transition-colors appearance-none cursor-pointer"
          >
            <option value="" className="bg-zinc-900">Select experience level</option>
            {experienceLevels.map((level) => (
              <option key={level} value={level} className="bg-zinc-900">{level}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-6 py-12">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-[#00FF57] w-8' : 'bg-zinc-700 w-2'
              }`}
            />
          ))}
        </div>
        <h2 className="text-2xl text-center mb-2">
          {step === 1 ? 'Basic Information' : 'Playing Details'}
        </h2>
        <p className="text-zinc-500 text-center text-sm">
          Step {step} of 2
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1">
          {step === 1 ? renderStep1() : renderStep2()}
        </div>

        <div className="mt-8 space-y-3">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform"
            >
              Continue
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 py-4 rounded-xl active:scale-95 transition-transform"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Complete Profile</span>
                )}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

