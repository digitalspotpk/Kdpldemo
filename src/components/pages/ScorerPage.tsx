import { useState } from 'react';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { WicketType, BallEvent } from '../../types';

export default function ScorerPage({ store }: { store: KDPLStore }) {
  const { state, recordBall, undoBall, selectOpeners, selectNextBatter, selectNextBowler } = store;
  const { liveMatch, teams, players, activeFixtureId } = state;
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [pendingBall, setPendingBall] = useState<Omit<BallEvent, 'id' | 'timestamp'> | null>(null);
  const [wicketType, setWicketType] = useState<WicketType>('Bowled');
  const [fielderId, setFielderId] = useState('');
  const [showNextBatter, setShowNextBatter] = useState(false);
  const [showNextBowler, setShowNextBowler] = useState(false);

  if (!liveMatch || liveMatch.status !== 'live') {
    return <div className="p-4 text-center text-kdpl-muted text-sm">No live match. Start scoring from Fixtures.</div>;
  }

  const innings = liveMatch.currentInnings === 1 ? liveMatch.innings1 : liveMatch.innings2;
  const battingTeam = teams.find(t => t.id === innings.teamId);
  const teamPlayers = players.filter(p => p.teamId === innings.teamId);
  const bowlingTeamId = liveMatch.currentInnings === 1 ? liveMatch.teamBId : liveMatch.teamAId;
  const bowlingPlayers = players.filter(p => p.teamId === bowlingTeamId);
  const striker = innings.currentBatter1 ? players.find(p => p.id === innings.currentBatter1) : null;
  const nonStriker = innings.currentBatter2 ? players.find(p => p.id === innings.currentBatter2) : null;
  const bowler = innings.currentBowler ? players.find(p => p.id === innings.currentBowler) : null;

  const needsOpeners = !innings.currentBatter1 || !innings.currentBatter2 || !innings.currentBowler;

  const handleBall = (runs: number, extraType: BallEvent['extraType'] = '', extras = 0) => {
    const ball: Omit<BallEvent, 'id' | 'timestamp'> = {
      ball: innings.balls + (extraType === 'Wide' || extraType === 'No-Ball' ? 0 : 1),
      over: innings.overs, runs, extras, extraType,
      isWicket: false, wicketType: '',
      batsmanId: innings.currentBatter1, bowlerId: innings.currentBowler, fielderId: '',
      commentary: `${runs}${extraType ? ` (${extraType})` : ''}`,
    };
    recordBall(ball);
  };

  const handleWicketBall = () => {
    if (!pendingBall) return;
    const ball = { ...pendingBall, isWicket: true, wicketType, fielderId };
    recordBall(ball);
    setShowWicketModal(false);
    setPendingBall(null);
    setShowNextBatter(true);
  };

  if (needsOpeners) {
    return <OpenersSelector store={store} teamPlayers={teamPlayers} bowlingPlayers={bowlingPlayers} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Score header */}
      <div className="p-3 bg-kdpl-card border-b border-kdpl-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-kdpl-text font-oswald font-bold text-xl">{battingTeam?.shortName} {innings.runs}/{innings.wickets}</div>
            <div className="text-kdpl-muted text-xs">({innings.overs}.{innings.balls} ov)</div>
          </div>
          {innings.target > 0 && <div className="text-kdpl-neon text-sm font-bold">Need {innings.target - innings.runs} from {liveMatch.overs * 6 - (innings.overs * 6 + innings.balls)} balls</div>}
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-kdpl-text">{striker?.name || '???'}* {innings.playerStats[innings.currentBatter1]?.runs || 0}({innings.playerStats[innings.currentBatter1]?.balls || 0})</span>
          <span className="text-kdpl-muted">{nonStriker?.name || '???'} {innings.playerStats[innings.currentBatter2]?.runs || 0}({innings.playerStats[innings.currentBatter2]?.balls || 0})</span>
        </div>
        {bowler && <div className="text-kdpl-muted text-[10px] mt-1">Bowling: {bowler.name} {innings.bowlerStats[innings.currentBowler]?.overs || 0}-{innings.bowlerStats[innings.currentBowler]?.runs || 0}</div>}
      </div>

      {/* Scoring buttons */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 6].map(r => (
            <button key={r} onClick={() => handleBall(r)}
              className="py-3 rounded-xl bg-kdpl-card border border-kdpl-border text-kdpl-text font-bold text-lg hover:border-kdpl-neon/50 active:scale-95 transition-all">
              {r}
            </button>
          ))}
          <button onClick={() => { const ball: Omit<BallEvent, 'id' | 'timestamp'> = { ball: innings.balls, over: innings.overs, runs: 0, extras: 1, extraType: 'Wide', isWicket: false, wicketType: '', batsmanId: innings.currentBatter1, bowlerId: innings.currentBowler, fielderId: '', commentary: 'Wide' }; recordBall(ball); }}
            className="py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-sm">Wd</button>
          <button onClick={() => { const ball: Omit<BallEvent, 'id' | 'timestamp'> = { ball: innings.balls, over: innings.overs, runs: 0, extras: 1, extraType: 'No-Ball', isWicket: false, wicketType: '', batsmanId: innings.currentBatter1, bowlerId: innings.currentBowler, fielderId: '', commentary: 'No Ball' }; recordBall(ball); }}
            className="py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-sm">Nb</button>
        </div>

        {/* Wicket button */}
        <button onClick={() => {
          setPendingBall({ ball: innings.balls, over: innings.overs, runs: 0, extras: 0, extraType: '', isWicket: true, wicketType: 'Bowled', batsmanId: innings.currentBatter1, bowlerId: innings.currentBowler, fielderId: '', commentary: 'WICKET!' });
          setShowWicketModal(true);
        }} className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm">
          🏏 WICKET
        </button>

        <button onClick={undoBall} className="w-full py-2 rounded-lg bg-kdpl-card border border-kdpl-border text-kdpl-muted text-xs">
          ↩ Undo Last Ball
        </button>
      </div>

      {/* FIX #2: Wicket modal with proper z-index (z-[70]) and padding to clear bottom nav */}
      {showWicketModal && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60">
          <div className="w-full max-w-[430px] bg-kdpl-card border-t border-kdpl-border rounded-t-2xl p-4 pb-8 space-y-3 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-kdpl-text font-oswald font-bold text-lg">Wicket Details</h3>
              <button onClick={() => setShowWicketModal(false)} className="text-kdpl-muted text-xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['Bowled', 'Caught', 'LBW', 'Run-Out', 'Stumped', 'Hit-Wicket'] as WicketType[]).map(wt => (
                <button key={wt} onClick={() => setWicketType(wt)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${wicketType === wt ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-kdpl-darker border-kdpl-border text-kdpl-muted'}`}>
                  {wt}
                </button>
              ))}
            </div>
            {(wicketType === 'Caught' || wicketType === 'Run-Out' || wicketType === 'Stumped') && (
              <div>
                <label className="text-kdpl-muted text-xs mb-1 block">Fielder</label>
                <select value={fielderId} onChange={e => setFielderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
                  <option value="">Select fielder</option>
                  {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleWicketBall} className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm">
              Confirm Wicket
            </button>
          </div>
        </div>
      )}

      {/* Next batter selector */}
      {showNextBatter && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60">
          <div className="w-full max-w-[430px] bg-kdpl-card border-t border-kdpl-border rounded-t-2xl p-4 pb-8 space-y-3 animate-slide-up max-h-[70vh] overflow-y-auto">
            <h3 className="text-kdpl-text font-oswald font-bold">Select Next Batter</h3>
            {teamPlayers.filter(p => !innings.playerStats[p.id]?.isOut && p.id !== innings.currentBatter2).map(p => (
              <button key={p.id} onClick={() => { selectNextBatter(p.id); setShowNextBatter(false); setShowNextBowler(true); }}
                className="w-full py-2 px-3 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs text-left hover:border-kdpl-neon/50">
                {p.name} ({p.role})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next bowler selector */}
      {showNextBowler && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60">
          <div className="w-full max-w-[430px] bg-kdpl-card border-t border-kdpl-border rounded-t-2xl p-4 pb-8 space-y-3 animate-slide-up max-h-[70vh] overflow-y-auto">
            <h3 className="text-kdpl-text font-oswald font-bold">Select Next Bowler</h3>
            {bowlingPlayers.filter(p => p.id !== liveMatch.lastOverBowlerId).map(p => (
              <button key={p.id} onClick={() => { selectNextBowler(p.id); setShowNextBowler(false); }}
                className="w-full py-2 px-3 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs text-left hover:border-kdpl-neon/50">
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OpenersSelector({ store, teamPlayers, bowlingPlayers }: { store: KDPLStore; teamPlayers: { id: string; name: string; role: string }[]; bowlingPlayers: { id: string; name: string; role: string }[] }) {
  const { selectOpeners } = store;
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowlerSel, setBowlerSel] = useState('');
  return (
    <div className="p-4 space-y-3">
      <h3 className="text-kdpl-text font-oswald font-bold">Select Openers & Bowler</h3>
      <select value={striker} onChange={e => setStriker(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
        <option value="">Striker</option>
        {teamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={nonStriker} onChange={e => setNonStriker(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
        <option value="">Non-Striker</option>
        {teamPlayers.filter(p => p.id !== striker).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={bowlerSel} onChange={e => setBowlerSel(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
        <option value="">Opening Bowler</option>
        {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={() => selectOpeners(striker, nonStriker, bowlerSel)} disabled={!striker || !nonStriker || !bowlerSel}
        className="w-full py-3 rounded-xl bg-kdpl-neon text-kdpl-darker font-bold text-sm disabled:opacity-50">
        Start Innings
      </button>
    </div>
  );
}
