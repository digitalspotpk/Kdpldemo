import { useState } from 'react';
import { CalendarIcon, RadioIcon, TrophyIcon, PlusIcon, BellIcon, UsersIcon, BarChartIcon, HomeIcon, ShieldIcon, WhatsAppIcon } from '../ui';
import type { KDPLStore } from '../../store/useKDPLStore';

// ─── DASHBOARD ───
export function Dashboard({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { tournament, teams, fixtures, liveMatch, players } = state;
  const liveCount = fixtures.filter(f => f.status === 'live').length;
  const upcoming = fixtures.filter(f => f.status === 'scheduled').slice(0, 3);
  const recent = fixtures.filter(f => f.status === 'completed').slice(0, 3);
  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="bg-gradient-to-br from-kdpl-green/20 to-kdpl-neon/10 border border-kdpl-neon/20 rounded-xl p-4">
        <h2 className="text-kdpl-neon font-oswald font-bold text-xl">{tournament?.name || 'KDPL'}</h2>
        <p className="text-kdpl-muted text-xs mt-1">{tournament?.format} • {teams.length} teams • {players.length} players</p>
      </div>
      {liveMatch && liveMatch.status === 'live' && (
        <button onClick={() => navigate('live')} className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-left">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-red-400 text-xs font-bold">LIVE NOW</span></div>
          <div className="text-kdpl-text text-sm mt-1">{liveMatch.innings1.runs}/{liveMatch.innings1.wickets} ({liveMatch.innings1.overs}.{liveMatch.innings1.balls})</div>
        </button>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => navigate('teams')} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 text-center"><div className="text-kdpl-neon text-lg font-bold">{teams.length}</div><div className="text-kdpl-muted text-[10px]">Teams</div></button>
        <button onClick={() => navigate('fixtures')} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 text-center"><div className="text-kdpl-neon text-lg font-bold">{fixtures.length}</div><div className="text-kdpl-muted text-[10px]">Matches</div></button>
        <button onClick={() => navigate('standings')} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 text-center"><div className="text-kdpl-neon text-lg font-bold">{liveCount}</div><div className="text-kdpl-muted text-[10px]">Live</div></button>
      </div>
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-kdpl-text text-sm font-semibold">Upcoming</h3>
          {upcoming.map(f => {
            const tA = teams.find(t => t.id === f.teamAId); const tB = teams.find(t => t.id === f.teamBId);
            return <div key={f.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 text-xs text-kdpl-text">{tA?.shortName} vs {tB?.shortName} <span className="text-kdpl-muted">• {f.date || 'TBD'}</span></div>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── FIXTURES PAGE ───
export function FixturesPage({ store }: { store: KDPLStore }) {
  const { state, navigate, startLiveMatch, generateFixtures } = store;
  const { fixtures, teams, isAdmin: admin } = state;
  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><CalendarIcon size={18} className="text-kdpl-neon" /> Fixtures</h2>
        {admin && <button onClick={generateFixtures} className="px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold">Generate</button>}
      </div>
      {fixtures.map(f => {
        const tA = teams.find(t => t.id === f.teamAId); const tB = teams.find(t => t.id === f.teamBId);
        return (
          <div key={f.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="text-kdpl-text text-sm font-semibold">{tA?.shortName || '???'} vs {tB?.shortName || '???'}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${f.status === 'live' ? 'bg-red-500/20 text-red-400' : f.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-kdpl-border/30 text-kdpl-muted'}`}>{f.status.toUpperCase()}</span>
            </div>
            <div className="text-kdpl-muted text-[10px] mt-1">{f.date || 'TBD'} • {f.slot}</div>
            {f.status === 'scheduled' && admin && (
              <button onClick={() => { startLiveMatch(f.id); navigate('scorer'); }} className="mt-2 px-3 py-1 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-[10px] font-semibold">Start Scoring</button>
            )}
            {f.status === 'live' && <button onClick={() => navigate('scorer')} className="mt-2 px-3 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-semibold">Continue Scoring</button>}
          </div>
        );
      })}
    </div>
  );
}

// ─── LIVE SCORE PAGE ───
export function LiveScorePage({ store }: { store: KDPLStore }) {
  const { state, navigate } = store;
  const { liveMatch, teams, players } = state;
  if (!liveMatch || liveMatch.status !== 'live') return <div className="p-4 text-center text-kdpl-muted text-sm">No live match currently.</div>;
  const innings = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;
  const battingTeam = teams.find(t => t.id === innings.teamId);
  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-red-400 text-xs font-bold">LIVE</span></div>
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-4">
        <div className="text-kdpl-text font-oswald font-bold text-2xl">{battingTeam?.shortName} {innings.runs}/{innings.wickets}</div>
        <div className="text-kdpl-muted text-sm">({innings.overs}.{innings.balls} overs)</div>
        {innings.target > 0 && <div className="text-kdpl-neon text-sm mt-2">Target: {innings.target} | Need {innings.target - innings.runs}</div>}
      </div>
      <button onClick={() => navigate('scorecard')} className="w-full py-2 rounded-lg bg-kdpl-card border border-kdpl-border text-kdpl-text text-xs">View Full Scorecard</button>
    </div>
  );
}

// ─── VENUES PAGE ───
export function VenuesPage({ store }: { store: KDPLStore }) {
  const { state, addVenue, deleteVenue } = store;
  const { venues, isAdmin } = state;
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [city, setCity] = useState('');
  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text">Venues</h2>
        {isAdmin && <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold"><PlusIcon size={12} /></button>}
      </div>
      {showForm && (
        <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Venue Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <button onClick={() => { if (name && state.activeTournamentId) { addVenue({ name, city, capacity: 0, pitchType: 'Flat', hasFloodlights: false, tournamentId: state.activeTournamentId }); setName(''); setCity(''); setShowForm(false); } }} className="w-full py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold">Add Venue</button>
        </div>
      )}
      {venues.map(v => (
        <div key={v.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 flex items-center justify-between">
          <div><div className="text-kdpl-text text-sm">{v.name}</div><div className="text-kdpl-muted text-[10px]">{v.city} • {v.pitchType}</div></div>
          {isAdmin && <button onClick={() => deleteVenue(v.id)} className="text-red-400 text-xs">✕</button>}
        </div>
      ))}
    </div>
  );
}

// ─── SERIES DETAIL PAGE ───
export function SeriesDetailPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { series, teams, fixtures, activeSeriesId } = state;
  const s = series.find(sr => sr.id === activeSeriesId);
  if (!s) return <div className="p-4 text-kdpl-muted text-sm">Series not found.</div>;
  const tA = teams.find(t => t.id === s.teamAId); const tB = teams.find(t => t.id === s.teamBId);
  const matches = fixtures.filter(f => f.seriesId === s.id);
  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text">{s.name}</h2>
      <div className="text-kdpl-text text-sm">{tA?.shortName} vs {tB?.shortName}</div>
      <div className="text-kdpl-muted text-xs">{matches.filter(f => f.status === 'completed').length}/{s.totalMatches} matches completed</div>
    </div>
  );
}

// ─── TOSS PAGE ───
export function TossPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { liveMatch, teams } = state;
  if (!liveMatch) return <div className="p-4 text-kdpl-muted text-sm">No active match.</div>;
  const tA = teams.find(t => t.id === liveMatch.teamAId); const tB = teams.find(t => t.id === liveMatch.teamBId);
  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text">Toss</h2>
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-4 text-center">
        <div className="text-kdpl-text text-sm">{tA?.shortName} vs {tB?.shortName}</div>
        <div className="text-kdpl-muted text-xs mt-2">Call: {liveMatch.toss.call}</div>
      </div>
    </div>
  );
}

// ─── SQUAD PAGE ───
export function SquadPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { players, teams } = state;
  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text">Squads</h2>
      {teams.map(team => (
        <div key={team.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
          <div className="text-kdpl-text text-sm font-semibold mb-2">{team.name}</div>
          <div className="flex flex-wrap gap-1">
            {players.filter(p => p.teamId === team.id).map(p => (
              <span key={p.id} className="px-2 py-0.5 rounded-full bg-kdpl-darker border border-kdpl-border text-kdpl-text text-[10px]">{p.name}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SHUFFLE PAGE ───
export function ShufflePage({ store }: { store: KDPLStore }) {
  const { state } = store;
  return <div className="p-4 pb-24 text-center text-kdpl-muted text-sm">Player shuffle utility for team balancing.</div>;
}

// ─── ANALYTICS PAGE ───
export function AnalyticsPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { players } = state;
  const topBatsmen = [...players].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topBowlers = [...players].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><BarChartIcon size={18} className="text-kdpl-neon" /> Analytics</h2>
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
        <h3 className="text-kdpl-text text-sm font-semibold mb-2">Top Batsmen</h3>
        {topBatsmen.map((p, i) => <div key={p.id} className="flex justify-between py-1 text-xs border-b border-kdpl-border/20 last:border-0"><span className="text-kdpl-text">{i + 1}. {p.name}</span><span className="text-kdpl-neon">{p.runs} runs</span></div>)}
      </div>
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
        <h3 className="text-kdpl-text text-sm font-semibold mb-2">Top Bowlers</h3>
        {topBowlers.map((p, i) => <div key={p.id} className="flex justify-between py-1 text-xs border-b border-kdpl-border/20 last:border-0"><span className="text-kdpl-text">{i + 1}. {p.name}</span><span className="text-kdpl-neon">{p.wickets} wkts</span></div>)}
      </div>
    </div>
  );
}

// ─── FACEBOOK LIVE PAGE ───
export function FacebookLivePage({ store }: { store: KDPLStore }) {
  return <div className="p-4 pb-24 text-center text-kdpl-muted text-sm">Facebook Live streaming integration.</div>;
}

// ─── NOTIFICATIONS PAGE ───
export function NotificationsPage({ store }: { store: KDPLStore }) {
  const { state, markNotifRead, markAllRead } = store;
  const { notifications } = state;
  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><BellIcon size={18} className="text-kdpl-neon" /> Notifications</h2>
        <button onClick={markAllRead} className="text-kdpl-neon text-xs">Mark all read</button>
      </div>
      {notifications.length === 0 && <div className="text-center text-kdpl-muted text-sm py-8">No notifications yet.</div>}
      {notifications.map(n => (
        <div key={n.id} onClick={() => markNotifRead(n.id)} className={`bg-kdpl-card border rounded-xl p-3 cursor-pointer ${n.read ? 'border-kdpl-border/50 opacity-60' : 'border-kdpl-neon/30'}`}>
          <div className="text-kdpl-text text-sm font-semibold">{n.title}</div>
          <div className="text-kdpl-muted text-xs mt-0.5">{n.body}</div>
        </div>
      ))}
    </div>
  );
}

// ─── USER MANAGEMENT PAGE ───
export function UserManagementPage({ store }: { store: KDPLStore }) {
  return <div className="p-4 pb-24 text-center text-kdpl-muted text-sm">User management panel.</div>;
}

// ─── DATA MANAGEMENT PAGE ───
export function DataManagementPage({ store }: { store: KDPLStore }) {
  return <div className="p-4 pb-24 text-center text-kdpl-muted text-sm">Data management & export tools.</div>;
}

// ─── ADS MANAGER PAGE ───
export function AdsManagerPage({ store }: { store: KDPLStore }) {
  const { state, updateAdSlot } = store;
  const { adSlots, isSuperAdmin } = state;
  if (!isSuperAdmin) return <div className="p-4 text-kdpl-muted text-sm">Super Admin access required.</div>;
  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text">Ads Manager</h2>
      {adSlots.map(slot => (
        <div key={slot.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-kdpl-text text-xs font-semibold">{slot.name}</span>
            <button onClick={() => updateAdSlot(slot.id, { enabled: !slot.enabled })} className={`w-8 h-4 rounded-full ${slot.enabled ? 'bg-kdpl-neon' : 'bg-kdpl-border'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${slot.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <textarea value={slot.adCode} onChange={e => updateAdSlot(slot.id, { adCode: e.target.value })} placeholder="Ad code..." className="w-full px-2 py-1 rounded bg-kdpl-darker border border-kdpl-border text-kdpl-text text-[10px] h-16" />
        </div>
      ))}
    </div>
  );
}

// ─── GLOBAL ARCHIVE PAGE ───
export function GlobalArchivePage({ store }: { store: KDPLStore }) {
  return <div className="p-4 pb-24 text-center text-kdpl-muted text-sm">Global tournament archive.</div>;
}

// ─── SETUP PAGE ───
export function SetupPage({ store }: { store: KDPLStore }) {
  return <div className="p-4 pb-24 text-center text-kdpl-muted text-sm">Firebase setup & configuration.</div>;
}

// ─── TOURNAMENTS LIST PAGE ───
export function TournamentsListPage({ store }: { store: KDPLStore }) {
  const { state, switchTournament, navigate } = store;
  const { tournaments, activeTournamentId } = state;
  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><TrophyIcon size={18} className="text-kdpl-neon" /> Tournaments</h2>
        <button onClick={() => navigate('create-tournament')} className="px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold"><PlusIcon size={12} /> New</button>
      </div>
      {tournaments.map(t => (
        <button key={t.id} onClick={() => { switchTournament(t.id); navigate('dashboard'); }}
          className={`w-full bg-kdpl-card border rounded-xl p-3 text-left transition-all ${t.id === activeTournamentId ? 'border-kdpl-neon/50' : 'border-kdpl-border hover:border-kdpl-neon/30'}`}>
          <div className="text-kdpl-text text-sm font-semibold">{t.name}</div>
          <div className="text-kdpl-muted text-[10px]">{t.format} • {t.teamCount} teams • {t.status}</div>
        </button>
      ))}
      {tournaments.length === 0 && <div className="text-center text-kdpl-muted text-sm py-8">No tournaments yet. Create one to get started.</div>}
    </div>
  );
}

// ─── CREATE TOURNAMENT PAGE ───
export function CreateTournamentPage({ store }: { store: KDPLStore }) {
  const { createTournament, navigate } = store;
  const [form, setForm] = useState({ name: '', shortName: '', format: 'Round-Robin' as const, overs: 20, teamCount: 6, playersPerTeam: 11, startDate: '', endDate: '', venue: '', prizePool: '' });
  const handleCreate = () => {
    if (!form.name) return;
    createTournament({ ...form, logo: '', banner: '', status: 'upcoming', organizer: '', organizerUid: '', organizerEmail: '', customRules: [], officials: [], broadcasters: [] });
    navigate('dashboard');
  };
  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text">Create Tournament</h2>
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tournament Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
        <input value={form.shortName} onChange={e => setForm({ ...form, shortName: e.target.value })} placeholder="Short Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
        <div className="flex gap-2">
          <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value as any })} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
            <option value="Round-Robin">Round-Robin</option><option value="Knockout">Knockout</option><option value="League">League</option>
          </select>
          <input type="number" value={form.overs} onChange={e => setForm({ ...form, overs: +e.target.value })} className="w-20 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" placeholder="Overs" />
        </div>
        <div className="flex gap-2">
          <input type="number" value={form.teamCount} onChange={e => setForm({ ...form, teamCount: +e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" placeholder="Teams" />
          <input type="number" value={form.playersPerTeam} onChange={e => setForm({ ...form, playersPerTeam: +e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" placeholder="Players/Team" />
        </div>
        <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Main Venue" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
        <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm">Create Tournament</button>
      </div>
    </div>
  );
}

// ─── ORGANIZER AUTH PAGE ───
export function OrganizerAuthPage({ store }: { store: KDPLStore }) {
  const { organizerLogin, organizerSignUp, navigate } = store;
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const handleAuth = async () => {
    if (mode === 'login') await organizerLogin(email, password);
    else await organizerSignUp(email, password, name);
    navigate('dashboard');
  };
  return (
    <div className="p-4 pb-24 space-y-4 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kdpl-green to-kdpl-neon flex items-center justify-center mb-2">
        <ShieldIcon size={28} className="text-white" />
      </div>
      <h2 className="text-xl font-oswald font-bold text-kdpl-text">Organizer Access</h2>
      <div className="w-full max-w-xs space-y-2">
        <div className="flex gap-2 mb-3">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${mode === 'login' ? 'bg-kdpl-neon/15 text-kdpl-neon border border-kdpl-neon/30' : 'text-kdpl-muted'}`}>Login</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${mode === 'signup' ? 'bg-kdpl-neon/15 text-kdpl-neon border border-kdpl-neon/30' : 'text-kdpl-muted'}`}>Sign Up</button>
        </div>
        {mode === 'signup' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
        <button onClick={handleAuth} className="w-full py-3 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
      </div>
    </div>
  );
}
