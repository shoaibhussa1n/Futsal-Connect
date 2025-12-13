import { User, Edit, Trash2, TrendingUp, Target, Award } from 'lucide-react';

interface PlayerProfileProps {
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PlayerProfile({ onBack, onEdit, onDelete }: PlayerProfileProps) {
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
            <div className="w-24 h-24 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-2xl flex items-center justify-center">
              <User className="w-12 h-12 text-black" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl mb-1">Ahmed Khan</h2>
              <p className="text-zinc-500 text-sm mb-2">23 years • Karachi</p>
              <div className="flex gap-2">
                <span className="bg-[#00FF57]/20 text-[#00FF57] px-3 py-1 rounded-full text-xs">
                  Midfielder
                </span>
                <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-xs">
                  Skill: 8/10
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6 p-4 bg-black/50 rounded-xl">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Passionate futsal player with 5 years of experience. Strong at ball control and playmaking. Love the fast-paced action and teamwork. Looking for competitive matches and long-term team opportunities.
            </p>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <h3 className="text-sm text-zinc-500 mb-3">Availability</h3>
            <div className="flex gap-2 flex-wrap">
              {['Mon', 'Tue', 'Wed', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="bg-[#00FF57]/10 border border-[#00FF57]/30 text-[#00FF57] px-3 py-1 rounded-lg text-xs"
                >
                  {day}
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-2">Evening (6PM - 12AM)</p>
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
            <p className="text-3xl text-white">34</p>
          </div>

          {/* Goals */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#FF6600]" />
              <p className="text-xs text-zinc-500">Goals</p>
            </div>
            <p className="text-3xl text-[#FF6600]">12</p>
          </div>

          {/* Assists */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-[#00A3FF]" />
              <p className="text-xs text-zinc-500">Assists</p>
            </div>
            <p className="text-3xl text-[#00A3FF]">18</p>
          </div>

          {/* MVPs */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-yellow-500" />
              <p className="text-xs text-zinc-500">MVPs</p>
            </div>
            <p className="text-3xl text-yellow-500">5</p>
          </div>
        </div>

        {/* Performance Rating */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-6 border border-[#00FF57]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Performance Rating</h3>
            <div className="text-3xl text-[#00FF57]">8.5</div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Technical Skills', value: 85 },
              { label: 'Teamwork', value: 90 },
              { label: 'Fitness', value: 80 },
              { label: 'Game IQ', value: 85 }
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

        {/* Action Buttons */}
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
      </div>
    </div>
  );
}
