import { Users, User, UserPlus } from 'lucide-react';

interface PathSelectionProps {
  onSelectPath: (path: 'player' | 'team' | 'join') => void;
}

export default function PathSelection({ onSelectPath }: PathSelectionProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,87,0.4)]">
          <span className="text-4xl">⚽</span>
        </div>
        <h1 className="text-2xl tracking-wider mb-2">Welcome to Futsal Hub!</h1>
        <p className="text-zinc-500">Choose your path to get started</p>
      </div>

      {/* Path Options */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {/* Register as Individual Player */}
        <button
          onClick={() => onSelectPath('player')}
          className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border-2 border-[#00FF57]/30 hover:border-[#00FF57] transition-all active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl mb-1">Register as Individual Player</h3>
              <p className="text-sm text-zinc-500">Play as a free agent and get invited to teams or matches</p>
            </div>
            <span className="text-zinc-500">→</span>
          </div>
        </button>

        {/* Create a Team */}
        <button
          onClick={() => onSelectPath('team')}
          className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border-2 border-[#00FF57]/30 hover:border-[#00FF57] transition-all active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00FF57] to-[#00cc44] rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl mb-1">Create Your Team</h3>
              <p className="text-sm text-zinc-500">Start your own team and invite players to join</p>
            </div>
            <span className="text-zinc-500">→</span>
          </div>
        </button>

        {/* Join Existing Team */}
        <button
          onClick={() => onSelectPath('join')}
          className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border-2 border-[#007BFF]/30 hover:border-[#007BFF] transition-all active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#007BFF] to-[#0056b3] rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl mb-1">Join an Existing Team</h3>
              <p className="text-sm text-zinc-500">Browse teams and request to join</p>
            </div>
            <span className="text-zinc-500">→</span>
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-sm text-blue-400 text-center">
          💡 You can always change your path later or do multiple things!
        </p>
      </div>
    </div>
  );
}

