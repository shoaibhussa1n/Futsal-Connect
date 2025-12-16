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
import TeamNotifications from './components/TeamNotifications';
import UpcomingMatchesScreen from './components/UpcomingMatchesScreen';
import UpdateMatchResultsScreen from './components/UpdateMatchResultsScreen';
import MatchHistoryScreen from './components/MatchHistoryScreen';
import { checkProfileComplete, checkPlayerProfile, checkTeamProfile, getProfile } from './lib/api';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import logo from 'figma:asset/a9109d0003972ab9d286aab63c38b1a2b2dbb9dc.png';

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

      // Don't check again if we're already on a screen that doesn't need checking
      if (currentScreen !== 'checking' && currentScreen !== 'splash' && currentScreen !== 'onboarding') {
        // Only check if we're on login or checking screen
        if (currentScreen !== 'login') {
          return;
        }
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

        let hasPlayer = false;
        let hasTeam = false;

        if (isComplete) {
          // Get profile to check for player/team profiles
          const { data: profile, error: profileError } = await getProfile(user.id);
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // If we can't get profile, treat as incomplete
            setProfileComplete(false);
            setCurrentScreen('profile-completion');
            setCheckingProfile(false);
            return;
          }
          
          if (profile) {
            hasPlayer = await checkPlayerProfile(profile.id);
            hasTeam = await checkTeamProfile(profile.id);
            setHasPlayerProfile(hasPlayer);
            setHasTeamProfile(hasTeam);
          }
        }

        // Navigate based on profile status
        if (!isComplete) {
          setCurrentScreen('profile-completion');
        } else if (!hasPlayer && !hasTeam) {
          setCurrentScreen('path-selection');
        } else {
          setCurrentScreen('main');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, try to go to login, but if we have a user, maybe just go to main
        if (user) {
          // If we have a user but check failed, try going to main anyway
          setCurrentScreen('main');
        } else {
          setCurrentScreen('login');
        }
      } finally {
        setCheckingProfile(false);
      }
    };

    if (user && !authLoading) {
      // Always check when user is authenticated and auth is done loading
      if (currentScreen === 'checking' || currentScreen === 'login' || currentScreen === 'splash') {
        checkUserProfile();
      }
    } else if (!user && !authLoading) {
      // If no user and auth is done loading, go to login
      if (currentScreen === 'checking') {
        setCurrentScreen('login');
        setCheckingProfile(false);
      }
    }
  }, [user, authLoading]);

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
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#00FF57] blur-2xl opacity-30 rounded-full animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto">
                  <img 
                    src={logo} 
                    alt="Futsal Connect" 
                    className="w-full h-full object-contain animate-pulse"
                    style={{ animationDuration: '2s' }}
                  />
                </div>
              </div>
              <p className="text-zinc-400 text-sm">Checking profile...</p>
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
          sessionStorage.removeItem('editTeam');
          if (hasPlayerProfile || hasTeamProfile) {
            setCurrentScreen('main');
          } else {
            setCurrentScreen('path-selection');
          }
        }} onComplete={() => {
          const isEditMode = sessionStorage.getItem('editTeam') === 'true';
          sessionStorage.removeItem('editTeam');
          if (isEditMode) {
            setCurrentScreen('teamProfile');
          } else {
            handleTeamRegistered();
          }
        }} />;
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
      case 'teamProfile': {
        const storedTeamId = sessionStorage.getItem('teamId');
        return <TeamProfile 
          onBack={() => {
            sessionStorage.removeItem('teamId');
            setCurrentScreen('main');
          }} 
          onEditTeam={() => {
            sessionStorage.setItem('editTeam', 'true');
            setCurrentScreen('teamRegistration');
          }}
          onInvitePlayers={() => setCurrentScreen('teamInvitations')}
          onViewMatchHistory={(teamId) => {
            sessionStorage.setItem('teamId', teamId);
            setCurrentScreen('matchHistory');
          }}
          teamId={storedTeamId || undefined}
          key={storedTeamId || 'no-id'} // Force re-render when teamId changes
        />;
      }
      case 'playerProfile': {
        const storedPlayerId = sessionStorage.getItem('playerId');
        return <PlayerProfile 
          onBack={() => {
            sessionStorage.removeItem('playerId');
            setCurrentScreen('main');
          }} 
          onEdit={() => {
            sessionStorage.setItem('editPlayer', 'true');
            setCurrentScreen('playerRegistration');
          }} 
          onDelete={() => setCurrentScreen('main')}
          playerId={storedPlayerId || undefined}
          key={storedPlayerId || 'no-id'} // Force re-render when playerId changes
        />;
      }
      case 'playerMarketplace':
        return <PlayerMarketplace 
          onBack={() => setCurrentScreen('main')} 
          onViewPlayer={(id) => {
            sessionStorage.setItem('playerId', id);
            setCurrentScreen('playerProfile');
          }} 
          onSendRequest={(id) => {
            // Request sent, can show notification or just continue
          }} 
        />;
      case 'teamInvitations':
        return <TeamInvitationSystem 
          onBack={() => setCurrentScreen('main')} 
          onInvitePlayer={(id, type) => {
            // Invitation sent, can show notification
          }} 
        />;
      case 'playerNotifications':
        return <PlayerNotifications 
          onBack={() => setCurrentScreen('main')} 
          onAccept={(id) => {
            // Request accepted, can show notification
          }} 
          onReject={(id) => {
            // Request rejected, can show notification
          }} 
        />;
      case 'teamNotifications':
        return <TeamNotifications 
          onBack={() => setCurrentScreen('main')} 
          onAccept={(id) => {
            // Request accepted, can show notification
          }} 
          onReject={(id) => {
            // Request rejected, can show notification
          }} 
        />;
      case 'upcomingMatches':
        return <UpcomingMatchesScreen 
          onBack={() => setCurrentScreen('main')} 
        />;
      case 'updateMatchResults':
        return <UpdateMatchResultsScreen 
          onBack={() => setCurrentScreen('main')}
          onSelectMatch={(matchId) => {
            sessionStorage.setItem('matchId', matchId);
            setCurrentScreen('matchResult');
          }}
        />;
      case 'matchHistory': {
        const storedTeamId = sessionStorage.getItem('teamId');
        return <MatchHistoryScreen 
          onBack={() => {
            sessionStorage.removeItem('teamId');
            setCurrentScreen('main');
          }}
          teamId={storedTeamId || undefined}
        />;
      }
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
          onUpdateResult={() => {
            setCurrentScreen('updateMatchResults');
          }}
          onViewLeaderboard={() => setCurrentScreen('leaderboard')}
          onViewTeamProfile={(teamId) => {
            sessionStorage.setItem('teamId', teamId);
            setCurrentScreen('teamProfile');
          }}
          onTeamNotifications={() => setCurrentScreen('teamNotifications')}
          onViewAllMatches={() => setCurrentScreen('upcomingMatches')}
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
          onTeamNotifications={() => setCurrentScreen('teamNotifications')}
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
          onViewTeamProfile={(teamId) => {
            sessionStorage.setItem('teamId', teamId);
            setCurrentScreen('teamProfile');
          }}
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
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#00FF57] blur-2xl opacity-30 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto">
              <img 
                src={logo} 
                alt="Futsal Connect" 
                className="w-full h-full object-contain animate-pulse"
                style={{ animationDuration: '2s' }}
              />
            </div>
          </div>
          <p className="text-zinc-400 text-sm">Loading...</p>
          {authLoading && (
            <p className="text-zinc-600 text-xs mt-2">Checking authentication...</p>
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
