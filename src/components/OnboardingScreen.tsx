import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Find Teams That Match Your Skill Level',
      illustration: '⚽',
      description: 'Connect with teams of similar skill ratings for competitive, balanced matches across Karachi',
    },
    {
      title: 'Track Your Wins, Goals & MVP Awards',
      illustration: '📊',
      description: 'Monitor your team performance with real-time stats, rankings, and leaderboards',
    },
    {
      title: 'Join Local Futsal Tournaments in Karachi',
      illustration: '🏆',
      description: 'Compete in organized tournaments, climb the ranks, and become the champion',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Illustration */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-[#00FF57] blur-3xl opacity-30 rounded-full"></div>
          <div className="relative text-9xl mb-4">
            {slides[currentSlide].illustration}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl text-center mb-4 text-white max-w-sm">
          {slides[currentSlide].title}
        </h2>

        {/* Description */}
        <p className="text-zinc-400 text-center max-w-xs mb-12">
          {slides[currentSlide].description}
        </p>

        {/* Slide Indicators */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-[#00FF57]'
                  : 'w-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="px-8 pb-12">
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform"
        >
          <span className="tracking-wide">
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
