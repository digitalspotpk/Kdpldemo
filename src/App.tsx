import { useState, useEffect } from 'react';
import { useKDPLStore } from './store/useKDPLStore';
import { TopBar, BottomNav, LiveMatchFloatingWidget, PullToRefresh, SubNav, SplashScreen } from './components/layout';
import { Dashboard, FixturesPage, LiveScorePage, VenuesPage, SeriesDetailPage, TossPage, SquadPage, ShufflePage, AnalyticsPage, FacebookLivePage, NotificationsPage, UserManagementPage, DataManagementPage, AdsManagerPage, GlobalArchivePage, SetupPage, TournamentsListPage, CreateTournamentPage, OrganizerAuthPage } from './components/pages/OtherPages';
import ScorecardPage, { TeamsPage, PlayersPage, StandingsPage } from './components/pages/MainPages';
import ScorerPage from './components/pages/ScorerPage';
import SeriesPage from './components/pages/SeriesPage';
import TournamentConfigPage from './components/pages/TournamentConfigPage';
import AppSettingsPage from './components/pages/AppSettingsPage';
import { XIcon, WhatsAppIcon } from './components/ui';

export default function App() {
  const store = useKDPLStore();
  const { state, navigate, dismissCommunityToast } = store;
  const { currentPage, theme, notifications, communityLink, communityLinkEnabled, communityToastShown } = state;

  const [showSplash, setShowSplash] = useState(true);
  const [splashFadeOut, setSplashFadeOut] = useState(false);
  // FIX #12: Community toast state
  const [showCommunityToast, setShowCommunityToast] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFadeOut(true), 2100);
    const t2 = setTimeout(() => setShowSplash(false), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // FIX #12: Show community toast after splash disappears (if enabled and not previously dismissed)
  useEffect(() => {
    if (!showSplash && communityLinkEnabled && !communityToastShown && communityLink) {
      const timer = setTimeout(() => setShowCommunityToast(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [showSplash, communityLinkEnabled, communityToastShown, communityLink]);

  const handleBellClick = () => navigate('notifications');

  if (showSplash) return <SplashScreen fadeOut={splashFadeOut} />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard store={store} />;
      case 'teams': return <TeamsPage store={store} />;
      case 'players': return <PlayersPage store={store} />;
      case 'venues': return <VenuesPage store={store} />;
      case 'fixtures': return <FixturesPage store={store} />;
      case 'series': return <SeriesPage store={store} />;
      case 'series-detail': return <SeriesDetailPage store={store} />;
      case 'live': return <LiveScorePage store={store} />;
      case 'scorer': return <ScorerPage store={store} />;
      case 'standings': return <StandingsPage store={store} />;
      case 'analytics': return <AnalyticsPage store={store} />;
      case 'scorecard': return <ScorecardPage store={store} />;
      case 'toss': return <TossPage store={store} />;
      case 'squad': return <SquadPage store={store} />;
      case 'shuffle': return <ShufflePage store={store} />;
      case 'tournament-config': return <TournamentConfigPage store={store} />;
      case 'facebook-live': return <FacebookLivePage store={store} />;
      case 'notifications': return <NotificationsPage store={store} />;
      case 'user-management': return <UserManagementPage store={store} />;
      case 'data-management': return <DataManagementPage store={store} />;
      case 'ads-manager': return <AdsManagerPage store={store} />;
      case 'app-settings': return <AppSettingsPage store={store} />;
      case 'tournaments': return <TournamentsListPage store={store} />;
      case 'create-tournament': return <CreateTournamentPage store={store} />;
      case 'organizer-auth': return <OrganizerAuthPage store={store} />;
      case 'global': return <GlobalArchivePage store={store} />;
      case 'tournament': return <TournamentConfigPage store={store} />;
      case 'setup': return <SetupPage store={store} />;
      default: return <Dashboard store={store} />;
    }
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(15,81,50,0.3) 0%, #060e1a 60%)' }}>
      <div id="kdpl-app-frame" className="w-full h-dvh flex flex-col bg-kdpl-darker relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-kdpl-dark rounded-b-2xl z-50" />
        <TopBar store={store} onBellClick={handleBellClick} unreadCount={unreadCount} />
        <SubNav store={store} />
        {!state.isOnline && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1.5 bg-amber-500/20 border-b border-amber-500/30">
            <span className="text-amber-400 text-xs font-semibold">📡 You are offline — showing cached data</span>
          </div>
        )}
        <main className="flex-1 flex flex-col min-h-0 animate-slide-up" key={currentPage}>
          <PullToRefresh>{renderPage()}</PullToRefresh>
        </main>
        <LiveMatchFloatingWidget store={store} />
        <BottomNav store={store} />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kdpl-neon/40 to-transparent" />

        {/* FIX #12: Community Join Toast */}
        {showCommunityToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-[380px] animate-slide-up">
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-3 shadow-xl shadow-green-500/20 flex items-center gap-3">
              <div className="flex-shrink-0">
                <WhatsAppIcon size={28} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-bold">Join our Community!</div>
                <div className="text-white/80 text-[10px] truncate">Connect with other cricket enthusiasts</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={communityLink} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-[10px] font-bold hover:bg-white/30 transition-all">
                  Join
                </a>
                <button onClick={() => { setShowCommunityToast(false); dismissCommunityToast(); }}
                  className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
                  <XIcon size={10} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
