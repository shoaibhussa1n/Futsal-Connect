import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import LoginSignup from './components/LoginSignup';
import ProfileCompletion from './components/ProfileCompletion';
import PathSelection from './components/PathSelection';
import HomeScreen from './components/HomeScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import TeamsScreen from './components/TeamsScreen';
import TournamentsScreen from './components/TournamentsScreen';
import UserProfile from './components/UserProfile';
import TeamRegistration from './components/TeamRegistration';
import MatchRequestConfirmation from './components/MatchRequestConfirmation';
import MatchResultSubmission from './components/MatchResultSubmission';
import LeaderboardScreen from './components/LeaderboardScreen';
import TeamProfile from './components/TeamProfile';
import PlayerRegistration from './components/PlayerRegistration';
import PlayerProfile from './components/PlayerProfile';
import PlayerMarketplace from './components/PlayerMarketplace';
import TeamInvitationSystem from './components/TeamInvitationSystem';
import PlayerNotifications from './components/PlayerNotifications';
import { checkProfileComplete, checkPlayerProfile, checkTeamProfile, getProfile } from './lib/api';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    localStorage.getItem('hasSeenOnboarding') === 'true'
  );
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [hasPlayerProfile, setHasPlayerProfile] = useState<boolean | null>(null);
  const [hasTeamProfile, setHasTeamProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Show splash for 2 seconds, then onboarding or login
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        if (hasSeenOnboarding) {
          // Wait for auth to finish loading before deciding
          if (!authLoading) {
            setCurrentScreen(user ? 'checking' : 'login');
          }
        } else {
          setCurrentScreen('onboarding');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, hasSeenOnboarding, user, authLoading]);

  // Handle auth loading completion
  useEffect(() => {
    if (!authLoading && currentScreen === 'splash' && hasSeenOnboarding) {
      setCurrentScreen(user ? 'checking' : 'login');
    }
  }, [authLoading, currentScreen, hasSeenOnboarding, user]);

  // Check profile status when user is authenticated
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user || authLoading) {
        setCheckingProfile(false);
        if (!user && !authLoading) {
          setCurrentScreen('login');
        }
        return;
      }

      try {
        setCheckingProfile(true);
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('Profile check timeout, redirecting to login');
          setCheckingProfile(false);
          setCurrentScreen('login');
        }, 10000); // 10 second timeout
        
        // Check if profile exists and is complete
        const isComplete = await checkProfileComplete(user.id);
        clearTimeout(timeoutId);
        setProfileComplete(isComplete);

        if (isComplete) {
          // Get profile to check for player/team profiles
          const { data: profile } = await getProfile(user.id);
          if (profile) {
            const hasPlayer = await checkPlayerProfile(profile.id);
            const hasTeam = await checkTeamProfile(profile.id);
            setHasPlayerProfile(hasPlayer);
            setHasTeamProfile(hasTeam);
          }
        }

        // Navigate based on profile status
        if (!isComplete) {
          setCurrentScreen('profile-completion');
        } else if (!hasPlayerProfile && !hasTeamProfile) {
          setCurrentScreen('path-selection');
        } else {
          setCurrentScreen('main');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, go to login to let user try again
        setCurrentScreen('login');
      } finally {
        setCheckingProfile(false);
      }
    };

    if (user && currentScreen === 'checking') {
      checkUserProfile();
    } else if (!user && !authLoading && currentScreen === 'checking') {
      // If no user and auth is done loading, go to login
      setCurrentScreen('login');
      setCheckingProfile(false);
    }
  }, [user, authLoading, currentScreen]);

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!authLoading && !user && currentScreen !== 'splash' && currentScreen !== 'onboarding' && currentScreen !== 'login') {
      setCurrentScreen('login');
    }
  }, [user, authLoading, currentScreen]);

  const handleProfileComplete = () => {
    setProfileComplete(true);
    setCurrentScreen('path-selection');
  };

  const handlePathSelection = (path: 'player' | 'team' | 'join') => {
    if (path === 'player') {
      setCurrentScreen('playerRegistration');
    } else if (path === 'team') {
      setCurrentScreen('teamRegistration');
    } else {
      setCurrentScreen('teams');
      setActiveTab('teams');
    }
  };

  const handlePlayerRegistered = () => {
    setHasPlayerProfile(true);
    setCurrentScreen('main');
    setActiveTab('home');
  };

  const handleTeamRegistered = () => {
    setHasTeamProfile(true);
    setCurrentScreen('main');
    setActiveTab('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboarding':
        return <OnboardingScreen onComplete={() => {
          setHasSeenOnboarding(true);
          localStorage.setItem('hasSeenOnboarding', 'true');
          setCurrentScreen(user ? 'checking' : 'login');
        }} />;
      case 'checking':
        return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#00FF57] mx-auto mb-4" />
              <p className="text-zinc-400">Checking profile...</p>
            </div>
          </div>
        );
      case 'login':
        return <LoginSignup onLogin={() => {
          if (user) {
            setCurrentScreen('checking');
          }
        }} />;
      case 'profile-completion':
        return <ProfileCompletion onComplete={handleProfileComplete} />;
      case 'path-selection':
        return <PathSelection onSelectPath={handlePathSelection} />;
      case 'teamRegistration':
        return <TeamRegistration onBack={() => {
          if (hasPlayerProfile || hasTeamProfile) {
            setCurrentScreen('main');
          } else {
            setCurrentScreen('path-selection');
          }
        }} onComplete={handleTeamRegistered} />;
      case 'playerRegistration':
        return <PlayerRegistration 
          onBack={() => {
            sessionStorage.removeItem('editPlayer');
            if (hasPlayerProfile || hasTeamProfile) {
              setCurrentScreen('main');
            } else {
              setCurrentScreen('path-selection');
            }
          }} 
          onRegister={() => {
            sessionStorage.removeItem('editPlayer');
            handlePlayerRegistered();
          }}
          editMode={sessionStorage.getItem('editPlayer') === 'true'}
        />;
      case 'matchRequest':
        return <MatchRequestConfirmation 
          onBack={() => setCurrentScreen('main')} 
          opponentTeamId={sessionStorage.getItem('opponentTeamId') || undefined} 
        />;
      case 'matchResult':
        return <MatchResultSubmission 
          onBack={() => setCurrentScreen('main')} 
          matchId={sessionStorage.getItem('matchId') || undefined} 
        />;
      case 'leaderboard':
        return <LeaderboardScreen onBack={() => setCurrentScreen('main')} />;
      case 'teamProfile':
        return <TeamProfile onBack={() => setCurrentScreen('main')} />;
      case 'playerProfile':
        return <PlayerProfile onBack={() => setCurrentScreen('main')} onEdit={() => setCurrentScreen('playerRegistration')} onDelete={() => setCurrentScreen('main')} />;
      case 'playerMarketplace':
        return <PlayerMarketplace onBack={() => setCurrentScreen('main')} onViewPlayer={(id) => setCurrentScreen('playerProfile')} onSendRequest={(id) => alert('Request sent to player!')} />;
      case 'teamInvitations':
        return <TeamInvitationSystem onBack={() => setCurrentScreen('main')} onInvitePlayer={(id, type) => alert(`${type === 'team' ? 'Team invitation' : 'Match hire'} sent!`)} />;
      case 'playerNotifications':
        return <PlayerNotifications onBack={() => setCurrentScreen('main')} onAccept={(id) => alert('Request accepted!')} onReject={(id) => alert('Request rejected!')} />;
      case 'main':
        return renderMainApp();
      default:
        return <SplashScreen />;
    }
  };

  const renderMainApp = () => {
    let content;
    switch (activeTab) {
      case 'home':
        content = <HomeScreen 
          onCreateTeam={() => setCurrentScreen('teamRegistration')}
          onCreateMatch={() => setActiveTab('matchmaking')}
          onUpdateResult={(matchId) => {
            sessionStorage.setItem('matchId', matchId);
            setCurrentScreen('matchResult');
          }}
          onViewLeaderboard={() => setCurrentScreen('leaderboard')}
          onViewTeamProfile={(teamId) => {
            sessionStorage.setItem('teamId', teamId);
            setCurrentScreen('teamProfile');
          }}
        />;
        break;
      case 'matchmaking':
        content = <MatchmakingScreen onRequestMatch={(teamId) => {
          sessionStorage.setItem('opponentTeamId', teamId);
          setCurrentScreen('matchRequest');
        }} />;
        break;
      case 'teams':
        content = <TeamsScreen 
          onViewTeam={(teamId) => {
            sessionStorage.setItem('teamId', teamId);
            setCurrentScreen('teamProfile');
          }}
          onInvitePlayers={() => setCurrentScreen('teamInvitations')}
        />;
        break;
      case 'tournaments':
        content = <TournamentsScreen />;
        break;
      case 'profile':
        content = <UserProfile 
          onLogout={() => {
            setCurrentScreen('login');
            setProfileComplete(null);
            setHasPlayerProfile(null);
            setHasTeamProfile(null);
          }} 
          onPlayerRegister={() => setCurrentScreen('playerRegistration')}
          onPlayerMarketplace={() => setCurrentScreen('playerMarketplace')}
          onPlayerNotifications={() => setCurrentScreen('playerNotifications')}
          onEditProfile={() => {
            // Navigate to player registration in edit mode if player exists, otherwise to profile completion
            if (hasPlayerProfile) {
              sessionStorage.setItem('editPlayer', 'true');
              setCurrentScreen('playerRegistration');
            } else {
              setCurrentScreen('profile-completion');
            }
          }}
        />;
        break;
      default:
        content = <HomeScreen />;
    }

    return (
      <div className="min-h-screen bg-black pb-20">
        {content}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  };

  // Show loading state while checking auth or profile (but with timeout)
  if (authLoading || (checkingProfile && currentScreen === 'checking')) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] flex items-center justify-center animate-pulse">
            <span className="text-2xl">⚽</span>
          </div>
          <p className="text-zinc-400">Loading...</p>
          {authLoading && (
            <p className="text-zinc-600 text-sm mt-2">Checking authentication...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {renderScreen()}
    </div>
  );
}

function BottomNav({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '⚽' },
    { id: 'matchmaking', label: 'Match', icon: '🎯' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'tournaments', label: 'Cups', icon: '🏆' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'text-[#00FF57]'
                : 'text-zinc-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
