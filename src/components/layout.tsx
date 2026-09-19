import { useState, useRef } from 'react';
import { SunIcon, MoonIcon, BellIcon, ShieldIcon, WifiOffIcon, LogoutIcon, XIcon, SettingsIcon, ArrowLeftIcon, HomeIcon, CalendarIcon, RadioIcon, EditIcon, BarChartIcon, LockIcon } from './ui';
import type { KDPLStore } from '../store/useKDPLStore';

// ─── SPLASH SCREEN ───
export function SplashScreen({ fadeOut }: { fadeOut: boolean }) {
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-kdpl-darker transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-kdpl-green to-kdpl-neon flex items-center justify-center shadow-2xl shadow-kdpl-neon/30 animate-pulse">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 20L20 4" /><path d="M4 20l4-1 12-15-1 4" /><circle cx="19" cy="5" r="2" fill="white" stroke="none" />
          </svg>
        </div>
        <h1 className="text-3xl font-oswald font-bold text-kdpl-neon tracking-wider">KDPL</h1>
        <p className="text-kdpl-muted text-xs mt-1">Premier League Cricket</p>
      </div>
    </div>
  );
}

// ─── TOP BAR ───
export function TopBar({ store, onBellClick, unreadCount }: { store: KDPLStore; onBellClick: () => void; unreadCount: number }) {
  const { state, setTheme, logoutAdmin, navigate, goBack } = store;
  const { tournament, theme, isSuperAdmin, authUid, isOnline, syncStatus, liveMatch, pageHistory, currentPage } = state;
  const isLive = liveMatch?.status === 'live';
  const [confirmLogout, setConfirmLogout] = useState(false);
  const showBack = pageHistory.length > 0 && currentPage !== 'dashboard';
  return (
    <div className="flex items-center justify-between px-3 h-14 border-b border-kdpl-border bg-kdpl-darker/95 backdrop-blur-sm relative z-50 flex-shrink-0">
      {showBack && (
        <button onClick={goBack} className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all flex-shrink-0 mr-1"><ArrowLeftIcon size={18} /></button>
      )}
      <button onClick={() => navigate('tournaments')} className="flex items-center gap-2 min-w-0 text-left">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kdpl-green to-kdpl-neon flex items-center justify-center flex-shrink-0 shadow-lg shadow-kdpl-neon/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M4 20L20 4" /><path d="M4 20l4-1 12-15-1 4" /><circle cx="19" cy="5" r="2" fill="white" stroke="none" /></svg>
        </div>
        <div className="min-w-0">
          <div className="text-kdpl-neon font-oswald font-bold text-sm leading-none tracking-wide">KDPL</div>
          <div className="text-kdpl-text/60 text-xs truncate max-w-[140px] leading-none mt-0.5">{tournament?.shortName || 'All Tournaments'}</div>
        </div>
        {isLive && <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5 ml-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /><span className="text-red-400 text-[10px] font-bold tracking-wide">LIVE</span></div>}
      </button>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 mr-1">
          {isOnline ? <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-kdpl-neon' : syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-orange-400'}`} /> : <WifiOffIcon size={14} className="text-orange-400" />}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all">
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>
        <button onClick={onBellClick} className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all relative">
          <BellIcon size={16} />
          {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>
        <button onClick={() => navigate('app-settings')} className="w-8 h-8 rounded-lg flex items-center justify-center text-kdpl-muted hover:text-kdpl-text hover:bg-kdpl-card transition-all" title="App Settings"><SettingsIcon size={16} /></button>
        {authUid ? (
          <div className="relative">
            <button onClick={() => setConfirmLogout(true)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-kdpl-green/20 border border-kdpl-green/40 cursor-pointer hover:bg-kdpl-green/30 transition-all" title="Tap to logout"><ShieldIcon size={14} className="text-kdpl-neon" /></button>
            {confirmLogout && (<><div className="fixed inset-0 z-[60]" onClick={() => setConfirmLogout(false)} /><div className="absolute right-0 top-10 z-[61] w-52 bg-kdpl-card border border-kdpl-border rounded-xl shadow-xl p-3"><div className="flex items-center justify-between mb-1"><span className="text-kdpl-text text-xs font-semibold">{isSuperAdmin ? 'Super Admin' : 'Organizer'}</span><button onClick={() => setConfirmLogout(false)} className="text-kdpl-muted"><XIcon size={12} /></button></div><button onClick={() => { logoutAdmin(); setConfirmLogout(false); }} className="w-full py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 mt-2"><LogoutIcon size={13} /> Logout</button></div></>)}
          </div>
        ) : (
          <button onClick={() => navigate('organizer-auth')} className="px-2.5 h-8 rounded-lg flex items-center text-kdpl-muted hover:text-kdpl-neon text-xs font-medium">Sign In</button>
        )}
      </div>
    </div>
  );
}

// ─── SUB NAV ───
export function SubNav({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { currentPage, isAdmin, tournament } = state;
  if (currentPage === 'dashboard' || currentPage === 'tournaments' || currentPage === 'organizer-auth') return null;
  const subItems = [
    { id: 'teams', label: 'Teams', page: 'teams' },
    { id: 'players', label: 'Players', page: 'players' },
    { id: 'venues', label: 'Venues', page: 'venues' },
    { id: 'fixtures', label: 'Fixtures', page: 'fixtures' },
    { id: 'series', label: 'Series', page: 'series' },
  ];
  if (!tournament) return null;
  return (
    <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-kdpl-border/50 bg-kdpl-darker/80 overflow-x-auto scrollbar-hide">
      {subItems.map(item => (
        <button key={item.id} onClick={() => navigate(item.page)}
          className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${currentPage === item.page ? 'bg-kdpl-neon/15 text-kdpl-neon border border-kdpl-neon/30' : 'text-kdpl-muted hover:text-kdpl-text'}`}>
          {item.label}
        </button>
      ))}
      {isAdmin && <button onClick={() => navigate('tournament-config')} className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${currentPage === 'tournament-config' ? 'bg-kdpl-neon/15 text-kdpl-neon border border-kdpl-neon/30' : 'text-kdpl-muted hover:text-kdpl-text'}`}>Config</button>}
    </div>
  );
}

// ─── BOTTOM NAV ───
const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon, page: 'dashboard' },
  { id: 'matches', label: 'Matches', icon: CalendarIcon, page: 'fixtures' },
  { id: 'live', label: 'Live', icon: RadioIcon, page: 'live' },
  { id: 'manage', label: 'Manage', icon: EditIcon, page: 'teams', adminOnly: true },
  { id: 'stats', label: 'Stats', icon: BarChartIcon, page: 'standings' },
] as const;
const PAGE_TAB_MAP: Record<string, string> = {
  dashboard: 'home', fixtures: 'matches', 'tournament-config': 'matches',
  live: 'live', 'facebook-live': 'live', global: 'live',
  teams: 'manage', venues: 'manage', players: 'manage', squad: 'manage',
  toss: 'manage', scorer: 'manage', scorecard: 'manage', shuffle: 'manage',
  tournament: 'manage', 'user-management': 'manage', 'ads-manager': 'manage', 'app-settings': 'manage',
  tournaments: 'manage', 'create-tournament': 'manage', 'organizer-auth': 'manage',
  standings: 'stats', analytics: 'stats', notifications: 'stats',
};
export function BottomNav({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { currentPage, isAdmin, authUid, liveMatch } = state;
  const activeTab = PAGE_TAB_MAP[currentPage] || 'home';
  const isLive = liveMatch?.status === 'live';
  return (
    <div className="flex-shrink-0 h-16 border-t border-kdpl-border bg-kdpl-darker/95 backdrop-blur-md relative z-50">
      <div className="flex items-stretch h-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isManage = tab.id === 'manage';
          const isLiveTab = tab.id === 'live';
          const locked = isManage && !isAdmin;
          return (
            <button key={tab.id} onClick={() => { if (isManage && !isAdmin) { navigate(authUid ? 'tournaments' : 'organizer-auth'); return; } navigate(tab.page); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${isActive ? 'text-kdpl-neon' : 'text-kdpl-muted hover:text-kdpl-text'}`}>
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-kdpl-neon rounded-full" />}
              {isLiveTab && isLive && <span className="absolute top-2 right-1/2 translate-x-5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-kdpl-darker" />}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-kdpl-neon/10' : ''}`}>
                {locked ? <LockIcon size={18} className="text-kdpl-muted" /> : <Icon size={18} />}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-kdpl-neon' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PULL TO REFRESH ───
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };
  const handleTouchEnd = () => { setPulling(false); };
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto kdpl-scroll" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {pulling && <div className="text-center py-2 text-kdpl-muted text-xs">↻ Pull to refresh</div>}
      {children}
    </div>
  );
}

// ─── LIVE MATCH FLOATING WIDGET ───
export function LiveMatchFloatingWidget({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { liveMatch, teams } = state;
  if (!liveMatch || liveMatch.status !== 'live') return null;
  const teamA = teams.find(t => t.id === liveMatch.teamAId);
  const teamB = teams.find(t => t.id === liveMatch.teamBId);
  const innings = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;
  const battingTeam = teams.find(t => t.id === innings.teamId);
  return (
    <button onClick={() => navigate('live')}
      className="absolute bottom-20 right-3 z-40 bg-kdpl-card border border-red-500/30 rounded-xl px-3 py-2 shadow-xl shadow-red-500/10 max-w-[180px] animate-fade-in">
      <div className="flex items-center gap-1 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-[9px] font-bold">LIVE</span>
      </div>
      <div className="text-kdpl-text text-xs font-semibold truncate">{battingTeam?.shortName || '???'} {innings.runs}/{innings.wickets}</div>
      <div className="text-kdpl-muted text-[10px]">({innings.overs}.{innings.balls} ov)</div>
      <div className="text-kdpl-muted text-[9px] truncate mt-0.5">{teamA?.shortName} vs {teamB?.shortName}</div>
    </button>
  );
}
