export default function SplashScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Glowing Futsal Ball Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-[#00FF57] blur-3xl opacity-50 rounded-full"></div>
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] flex items-center justify-center shadow-[0_0_60px_rgba(0,255,87,0.6)]">
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20"
            fill="none"
            stroke="black"
            strokeWidth="2"
          >
            <circle cx="50" cy="50" r="40" fill="white" />
            <path d="M 30 20 Q 50 40 70 20" stroke="black" strokeWidth="2" fill="none" />
            <path d="M 30 80 Q 50 60 70 80" stroke="black" strokeWidth="2" fill="none" />
            <path d="M 20 30 Q 40 50 20 70" stroke="black" strokeWidth="2" fill="none" />
            <path d="M 80 30 Q 60 50 80 70" stroke="black" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="8" fill="black" />
          </svg>
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-4xl tracking-wider mb-2 bg-gradient-to-r from-white via-[#00FF57] to-white bg-clip-text text-transparent">
        FUTSAL HUB
      </h1>
      <h2 className="text-3xl tracking-widest text-[#00FF57] mb-8">
        KARACHI
      </h2>

      {/* Tagline */}
      <p className="text-zinc-400 text-center max-w-xs">
        Find Matches. Track Stats. Rule the Court.
      </p>

      {/* Loading Animation */}
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 bg-[#00FF57] rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-[#00FF57] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-[#00FF57] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}
