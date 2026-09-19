import { TrophyIcon, RadioIcon, CalendarIcon, UsersIcon, BarChartIcon, ZapIcon, AwardIcon, ChevronRightIcon, FacebookIcon, WhatsAppIcon, ImageIcon } from '../ui';
import type { KDPLStore } from '../../store/useKDPLStore';

interface DashboardProps { store: KDPLStore; }

export default function Dashboard({ store }: DashboardProps) {
  const { state, navigate } = store;
  const { tournament, teams, players, fixtures, liveMatch, supportWhatsapp, isAdmin } = state;

  const completedMatches = fixtures.filter(f => f.status === 'completed').length;
  const scheduledMatches = fixtures.filter(f => f.status === 'scheduled').length;
  const sorted = [...teams].sort((a, b) => b.points - a.points || b.nrr - a.nrr);
  const topBatter = [...players].sort((a, b) => b.runs - a.runs)[0];
  const topBowler = [...players].sort((a, b) => b.wickets - a.wickets)[0];
  const mvp = [...players].sort((a, b) => b.mvpScore - a.mvpScore)[0];

  const getTeam = (id: string) => teams.find(t => t.id === id);

  const quickActions = [
    { label: 'Live Score', icon: RadioIcon, page: 'live', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Fixtures', icon: CalendarIcon, page: 'fixtures', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Series', icon: TrophyIcon, page: 'series', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { label: 'Teams', icon: UsersIcon, page: 'teams', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Points Table', icon: BarChartIcon, page: 'standings', color: 'text-kdpl-neon', bg: 'bg-kdpl-neon/10 border-kdpl-neon/20' },
    { label: 'Analytics', icon: AwardIcon, page: 'analytics', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Players', icon: ZapIcon, page: 'players', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  ];

  if (!tournament) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text mb-4">No Tournament Selected</h2>
        <button onClick={() => navigate('tournaments')} className="px-4 py-2 rounded-lg bg-kdpl-neon text-kdpl-darker font-bold text-sm">
          Select Tournament
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* FIX #3: WhatsApp button with position:fixed */}
      {supportWhatsapp && (
        <a
          href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Support"
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition-all"
          style={{ position: 'fixed' }}
        >
          <WhatsAppIcon size={28} className="text-white" />
        </a>
      )}

      {/* Live Match Banner */}
      {liveMatch && liveMatch.status === 'live' && (
        <div
          className="rounded-2xl bg-gradient-to-r from-red-900/60 to-kdpl-card border border-red-500/40 p-4 cursor-pointer active:scale-98 transition-all"
          onClick={() => navigate('live')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold text-xs tracking-widest">LIVE NOW</span>
            </div>
            <span className="text-kdpl-neon text-xs">Watch →</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-kdpl-text font-oswald font-bold text-sm">{getTeam(liveMatch.teamAId)?.shortName}</div>
              <div className="text-kdpl-neon font-bold text-xl font-oswald">
                {liveMatch.innings1.runs}/{liveMatch.innings1.wickets}
              </div>
              <div className="text-kdpl-muted text-xs">({liveMatch.innings1.overs}.{liveMatch.innings1.balls} ov)</div>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-kdpl-muted text-xs font-bold">VS</span>
            </div>
            <div className="text-center flex-1">
              <div className="text-kdpl-text font-oswald font-bold text-sm">{getTeam(liveMatch.teamBId)?.shortName}</div>
              {liveMatch.currentInnings === 2 ? (
                <>
                  <div className="text-kdpl-neon font-bold text-xl font-oswald">
                    {liveMatch.innings2.runs}/{liveMatch.innings2.wickets}
                  </div>
                  <div className="text-kdpl-muted text-xs">({liveMatch.innings2.overs}.{liveMatch.innings2.balls} ov)</div>
                </>
              ) : (
                <div className="text-kdpl-muted text-sm">Yet to bat</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tournament Hero Card */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-kdpl-green/30 to-kdpl-card border border-kdpl-green/30">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-kdpl-neon text-xs font-bold tracking-widest mb-1 uppercase">
                {tournament.status === 'active' ? '🟢 ONGOING' : tournament.status === 'upcoming' ? '🔵 UPCOMING' : '🏆 COMPLETED'}
              </div>
              <h2 className="text-kdpl-text font-oswald font-bold text-lg leading-tight">
                {tournament.name}
              </h2>
              <p className="text-kdpl-muted text-xs mt-1">
                {tournament.format} · {tournament.overs} Overs · {tournament.teamCount} Teams
              </p>
            </div>
            <TrophyIcon size={40} className="text-kdpl-neon/40" />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Matches Played', value: completedMatches, icon: '✅' },
              { label: 'Upcoming', value: scheduledMatches, icon: '📅' },
              { label: 'Teams', value: teams.length, icon: '🏏' },
            ].map(stat => (
              <div key={stat.label} className="bg-kdpl-darker/50 rounded-xl p-2.5 text-center">
                <div className="text-lg">{stat.icon}</div>
                <div className="text-kdpl-neon font-oswald font-bold text-xl">{stat.value}</div>
                <div className="text-kdpl-muted text-[10px] leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm mb-2 uppercase tracking-wide">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.page}
                onClick={() => navigate(action.page)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95 ${action.bg}`}
              >
                <Icon size={22} className={action.color} />
                <span className="text-kdpl-text text-[11px] font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini Points Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide">Points Table</h3>
          <button onClick={() => navigate('standings')} className="text-kdpl-neon text-xs flex items-center gap-1">
            Full Table <ChevronRightIcon size={12} />
          </button>
        </div>
        <div className="rounded-xl border border-kdpl-border bg-kdpl-card overflow-hidden">
          {sorted.slice(0, 4).map((team, i) => (
            <div key={team.id} className={`grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center px-3 py-2.5 ${i < sorted.length - 1 ? 'border-b border-kdpl-border/50' : ''}`}>
              <span className={`w-5 text-xs font-bold ${i === 0 ? 'text-yellow-400' : 'text-kdpl-muted'}`}>{i+1}</span>
              <div className="flex items-center gap-2">
                <span className="text-kdpl-text text-xs font-medium">{team.shortName}</span>
              </div>
              <span className="text-kdpl-neon font-bold text-sm font-oswald">{team.points}</span>
              <span className={`text-xs font-mono ${team.nrr >= 0 ? 'text-kdpl-neon' : 'text-red-400'}`}>
                {team.nrr >= 0 ? '+' : ''}{team.nrr.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div>
        <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide mb-2">Top Performers</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Orange Cap', player: topBatter, stat: `${topBatter?.runs || 0} Runs`, icon: '🏏' },
            { label: 'Purple Cap', player: topBowler, stat: `${topBowler?.wickets || 0} Wkts`, icon: '🎳' },
            { label: 'MVP', player: mvp, stat: `${mvp?.mvpScore || 0} Pts`, icon: '⭐' },
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-kdpl-card border border-kdpl-border p-2.5 text-center cursor-pointer hover:border-kdpl-neon/40 transition-all"
              onClick={() => navigate('analytics')}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-[10px] text-kdpl-muted mb-0.5">{item.label}</div>
              <div className="text-kdpl-text text-xs font-semibold truncate">{item.player?.name || '—'}</div>
              <div className="text-kdpl-neon text-xs font-bold font-oswald">{item.stat}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-kdpl-text font-oswald font-semibold text-sm uppercase tracking-wide">Recent Results</h3>
          <button onClick={() => navigate('fixtures')} className="text-kdpl-neon text-xs flex items-center gap-1">
            All <ChevronRightIcon size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {fixtures.filter(f => f.status === 'completed').slice(-3).reverse().map(f => {
            const ta = getTeam(f.teamAId);
            const tb = getTeam(f.teamBId);
            return (
              <div key={f.id} className="rounded-xl bg-kdpl-card border border-kdpl-border p-3">
                <div className="flex items-center justify-between text-[10px] text-kdpl-muted mb-2">
                  <span>Match #{f.matchNumber}</span>
                  <span>{f.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className={`text-xs font-semibold ${f.result?.winnerId === f.teamAId ? 'text-kdpl-neon' : 'text-kdpl-muted'}`}>{ta?.shortName}</span>
                    <span className="text-kdpl-neon font-bold text-sm font-oswald">{f.result?.teamAScore}</span>
                  </div>
                  <div className="px-2 text-kdpl-muted text-xs">vs</div>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-kdpl-neon font-bold text-sm font-oswald">{f.result?.teamBScore}</span>
                    <span className={`text-xs font-semibold ${f.result?.winnerId === f.teamBId ? 'text-kdpl-neon' : 'text-kdpl-muted'}`}>{tb?.shortName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
