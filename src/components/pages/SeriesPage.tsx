import { useState } from 'react';
import { PlusIcon, TrophyIcon } from '../ui';
import { computeSeriesResult } from '../../utils';
import type { KDPLStore } from '../../store/useKDPLStore';

export default function SeriesPage({ store }: { store: KDPLStore }) {
  const { state, navigate, createSeries, setActiveSeries } = store;
  const { series, teams, fixtures, isAdmin } = state;
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [totalMatches, setTotalMatches] = useState(3);
  const [seriesType, setSeriesType] = useState<'best-of' | 'fixed'>('best-of');

  const handleCreate = () => {
    if (!name || !teamAId || !teamBId || !state.activeTournamentId) return;
    createSeries({ name, teamAId, teamBId, totalMatches, seriesType, tournamentId: state.activeTournamentId });
    setShowCreate(false); setName(''); setTeamAId(''); setTeamBId('');
  };

  return (
    // FIX #1: Added pb-24 to prevent bottom nav overlap
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><TrophyIcon size={18} className="text-kdpl-neon" /> Series</h2>
        {isAdmin && (
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold">
            <PlusIcon size={12} /> Create
          </button>
        )}
      </div>

      {showCreate && (
        <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Series Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <select value={teamAId} onChange={e => setTeamAId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
            <option value="">Select Team A</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={teamBId} onChange={e => setTeamBId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
            <option value="">Select Team B</option>
            {teams.filter(t => t.id !== teamAId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="number" value={totalMatches} onChange={e => setTotalMatches(+e.target.value)} min={1} max={7} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" placeholder="Total Matches" />
            <select value={seriesType} onChange={e => setSeriesType(e.target.value as 'best-of' | 'fixed')} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
              <option value="best-of">Best Of</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <button onClick={handleCreate} className="w-full py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold">Create Series</button>
        </div>
      )}

      {series.length === 0 && !showCreate && (
        <div className="text-center py-12 text-kdpl-muted text-sm">No series yet. Create one to track head-to-head contests.</div>
      )}

      {series.map(s => {
        const result = computeSeriesResult(s, fixtures);
        const tA = teams.find(t => t.id === s.teamAId);
        const tB = teams.find(t => t.id === s.teamBId);
        return (
          <button key={s.id} onClick={() => { setActiveSeries(s.id); navigate('series-detail'); }}
            className="w-full bg-kdpl-card border border-kdpl-border rounded-xl p-3 text-left hover:border-kdpl-neon/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-kdpl-text text-sm font-semibold">{s.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${result.status === 'completed' ? 'bg-green-500/20 text-green-400' : result.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-kdpl-border/30 text-kdpl-muted'}`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-kdpl-text text-xs">{tA?.shortName || '???'}</span>
              <span className="text-kdpl-neon text-xs font-bold">{result.teamAWins} - {result.teamBWins}</span>
              <span className="text-kdpl-text text-xs">{tB?.shortName || '???'}</span>
            </div>
            <div className="text-kdpl-muted text-[10px] mt-1">{result.completedCount}/{s.totalMatches} matches played</div>
          </button>
        );
      })}
    </div>
  );
}
