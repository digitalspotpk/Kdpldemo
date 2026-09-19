import { useState } from 'react';
import { DownloadIcon, PlusIcon, TrashIcon, EditIcon, WhatsAppIcon, CameraIcon, UsersIcon } from '../ui';
import { ImageUpload } from '../ui';
import { exportElementAsImage } from '../../utils';
import type { KDPLStore } from '../../store/useKDPLStore';

// ─── SCORECARD PAGE (FIX #7: Mobile-compatible export) ───
export default function ScorecardPage({ store }: { store: KDPLStore }) {
  const { state } = store;
  const { liveMatch, teams, players, fixtures } = state;
  const [exporting, setExporting] = useState(false);

  const completedMatch = fixtures.find(f => f.status === 'completed' && f.result);
  const match = liveMatch || (completedMatch ? null : null);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportElementAsImage('scorecard-content', `scorecard_${Date.now()}.png`);
    } catch (e) { console.error(e); }
    setExporting(false);
  };

  if (!match && !completedMatch) {
    return <div className="p-4 text-center text-kdpl-muted text-sm">No match data available for scorecard.</div>;
  }

  const teamA = teams.find(t => t.id === (match?.teamAId || completedMatch?.teamAId));
  const teamB = teams.find(t => t.id === (match?.teamBId || completedMatch?.teamBId));
  const innings1 = match?.innings1;
  const innings2 = match?.innings2;

  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text">Scorecard</h2>
        {/* FIX #7: Mobile-compatible download button */}
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold disabled:opacity-50">
          {exporting ? '⏳' : <DownloadIcon size={12} />}
          {exporting ? 'Exporting...' : 'Download'}
        </button>
      </div>

      <div id="scorecard-content" className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-3">
        <div className="text-center">
          <div className="text-kdpl-text font-oswald font-bold">{teamA?.shortName} vs {teamB?.shortName}</div>
          {completedMatch?.result && <div className="text-kdpl-neon text-xs mt-1">{completedMatch.result.margin}</div>}
        </div>

        {innings1 && <InningsCard innings={innings1} teams={teams} players={players} label="1st Innings" />}
        {innings2 && <InningsCard innings={innings2} teams={teams} players={players} label="2nd Innings" />}
      </div>
    </div>
  );
}

function InningsCard({ innings, teams, players, label }: { innings: any; teams: any[]; players: any[]; label: string }) {
  const team = teams.find(t => t.id === innings.teamId);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-kdpl-text text-sm font-semibold">{team?.shortName}</span>
        <span className="text-kdpl-neon font-bold">{innings.runs}/{innings.wickets} ({innings.overs}.{innings.balls})</span>
      </div>
      <div className="text-[10px] text-kdpl-muted">{label}</div>
      {/* Batting */}
      <div className="space-y-1">
        {Object.entries(innings.playerStats || {}).map(([pid, stats]: [string, any]) => {
          const player = players.find(p => p.id === pid);
          if (!player) return null;
          return (
            <div key={pid} className="flex items-center justify-between text-[11px] py-0.5 border-b border-kdpl-border/20">
              <span className="text-kdpl-text truncate flex-1">{player.name} {stats.isOut ? '' : '*'}</span>
              <span className="text-kdpl-muted ml-2">{stats.runs}({stats.balls})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TEAMS PAGE (FIX #9: WhatsApp field for captain) ───
export function TeamsPage({ store }: { store: KDPLStore }) {
  const { state, addTeam, updateTeam, deleteTeam } = store;
  const { teams, isAdmin } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', shortName: '', color: '#0f5132', city: '', captain: '', captainWhatsapp: '', logoImageUrl: '' });

  const handleSave = () => {
    if (!form.name || !state.activeTournamentId) return;
    if (editingId) {
      updateTeam(editingId, form);
      setEditingId(null);
    } else {
      addTeam({ ...form, tournamentId: state.activeTournamentId, logo: '', sponsors: [] });
    }
    setForm({ name: '', shortName: '', color: '#0f5132', city: '', captain: '', captainWhatsapp: '', logoImageUrl: '' });
    setShowForm(false);
  };

  const startEdit = (team: any) => {
    setForm({ name: team.name, shortName: team.shortName, color: team.color, city: team.city, captain: team.captain, captainWhatsapp: team.captainWhatsapp || '', logoImageUrl: team.logoImageUrl || '' });
    setEditingId(team.id);
    setShowForm(true);
  };

  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><UsersIcon size={18} className="text-kdpl-neon" /> Teams</h2>
        {isAdmin && <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', shortName: '', color: '#0f5132', city: '', captain: '', captainWhatsapp: '', logoImageUrl: '' }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold"><PlusIcon size={12} /> Add</button>}
      </div>

      {/* FIX #11: Admin controls - Edit/Delete on team items */}
      {teams.map(team => (
        <div key={team.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: team.color }}>
                {team.logoImageUrl ? <img src={team.logoImageUrl} className="w-full h-full rounded-full object-cover" /> : team.shortName}
              </div>
              <div>
                <div className="text-kdpl-text text-sm font-semibold">{team.name}</div>
                <div className="text-kdpl-muted text-[10px]">{team.city} • Captain: {team.captain || 'TBA'}</div>
                {/* FIX #9: Show WhatsApp if available */}
                {team.captainWhatsapp && <div className="text-green-400 text-[10px] flex items-center gap-1"><WhatsAppIcon size={10} /> {team.captainWhatsapp}</div>}
              </div>
            </div>
            {/* FIX #11: Admin-only edit/delete controls */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(team)} className="p-1.5 rounded-lg hover:bg-kdpl-darker text-kdpl-muted hover:text-kdpl-neon"><EditIcon size={14} /></button>
                <button onClick={() => deleteTeam(team.id)} className="p-1.5 rounded-lg hover:bg-kdpl-darker text-kdpl-muted hover:text-red-400"><TrashIcon size={14} /></button>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-2 text-[10px] text-kdpl-muted">
            <span>W: {team.wins}</span><span>L: {team.losses}</span><span>Pts: {team.points}</span><span>NRR: {team.nrr}</span>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
          <h3 className="text-kdpl-text text-sm font-semibold">{editingId ? 'Edit Team' : 'New Team'}</h3>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Team Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <div className="flex gap-2">
            <input value={form.shortName} onChange={e => setForm({ ...form, shortName: e.target.value })} placeholder="Short Name" className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-9 rounded-lg border border-kdpl-border cursor-pointer" />
          </div>
          <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <input value={form.captain} onChange={e => setForm({ ...form, captain: e.target.value })} placeholder="Captain Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          {/* FIX #9: WhatsApp field for captain */}
          <div className="flex items-center gap-2">
            <WhatsAppIcon size={14} className="text-green-400 flex-shrink-0" />
            <input value={form.captainWhatsapp} onChange={e => setForm({ ...form, captainWhatsapp: e.target.value })} placeholder="Captain WhatsApp Number" className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          </div>
          {/* FIX #6: Image upload for team logo */}
          <ImageUpload value={form.logoImageUrl} onChange={url => setForm({ ...form, logoImageUrl: url })} label="Team Logo" />
          <button onClick={handleSave} className="w-full py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold">{editingId ? 'Update' : 'Add Team'}</button>
        </div>
      )}
    </div>
  );
}

// ─── PLAYERS PAGE (FIX #8: Profile pic upload, FIX #10: WhatsApp field) ───
export function PlayersPage({ store }: { store: KDPLStore }) {
  const { state, addPlayer, updatePlayer, deletePlayer } = store;
  const { players, teams, isAdmin } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'; teamId: string; photo: string; photoUrl: string; whatsapp: string; battingStyle: string; bowlingStyle: string }>({ name: '', role: 'Batsman', teamId: '', photo: '', photoUrl: '', whatsapp: '', battingStyle: '', bowlingStyle: '' });

  const handleSave = () => {
    if (!form.name || !form.teamId || !state.activeTournamentId) return;
    if (editingId) {
      updatePlayer(editingId, form);
      setEditingId(null);
    } else {
      addPlayer({ ...form, tournamentId: state.activeTournamentId, banned: false, banReason: '', tier: 'Bronze' });
    }
    setForm({ name: '', role: 'Batsman', teamId: '', photo: '', photoUrl: '', whatsapp: '', battingStyle: '', bowlingStyle: '' });
    setShowForm(false);
  };

  return (
    <div className="p-4 pb-24 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-oswald font-bold text-kdpl-text">Players</h2>
        {isAdmin && <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon text-xs font-semibold"><PlusIcon size={12} /> Add</button>}
      </div>

      {players.map(p => {
        const team = teams.find(t => t.id === p.teamId);
        return (
          <div key={p.id} className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
            <div className="flex items-center gap-3">
              {/* FIX #8: Profile picture display */}
              <div className="w-10 h-10 rounded-full bg-kdpl-darker border border-kdpl-border overflow-hidden flex items-center justify-center flex-shrink-0">
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-kdpl-muted text-xs">{p.name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-kdpl-text text-sm font-semibold truncate">{p.name}</div>
                <div className="text-kdpl-muted text-[10px]">{p.role} • {team?.shortName || '??'}</div>
                {/* FIX #10: Show WhatsApp if available */}
                {p.whatsapp && <div className="text-green-400 text-[10px] flex items-center gap-1"><WhatsAppIcon size={10} /> {p.whatsapp}</div>}
              </div>
              <div className="text-right text-[10px]">
                <div className="text-kdpl-text">{p.runs} runs</div>
                <div className="text-kdpl-muted">{p.wickets} wkts</div>
              </div>
              {/* FIX #11: Admin controls */}
              {isAdmin && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setForm({ name: p.name, role: p.role, teamId: p.teamId, photo: p.photo, photoUrl: p.photoUrl || '', whatsapp: p.whatsapp || '', battingStyle: p.battingStyle, bowlingStyle: p.bowlingStyle }); setEditingId(p.id); setShowForm(true); }} className="p-1 text-kdpl-muted hover:text-kdpl-neon"><EditIcon size={12} /></button>
                  <button onClick={() => deletePlayer(p.id)} className="p-1 text-kdpl-muted hover:text-red-400"><TrashIcon size={12} /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showForm && (
        <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
          <h3 className="text-kdpl-text text-sm font-semibold">{editingId ? 'Edit Player' : 'New Player'}</h3>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Player Name" className="w-full px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <div className="flex gap-2">
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
              <option value="Batsman">Batsman</option><option value="Bowler">Bowler</option><option value="All-Rounder">All-Rounder</option><option value="Wicket-Keeper">Wicket-Keeper</option>
            </select>
            <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
              <option value="">Select Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.shortName}</option>)}
            </select>
          </div>
          {/* FIX #10: WhatsApp field */}
          <div className="flex items-center gap-2">
            <WhatsAppIcon size={14} className="text-green-400 flex-shrink-0" />
            <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp Number" className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          </div>
          {/* FIX #8: Profile picture upload with compression */}
          <ImageUpload value={form.photoUrl} onChange={url => setForm({ ...form, photoUrl: url })} label="Profile Photo" compress={true} maxSizeMB={3} />
          <button onClick={handleSave} className="w-full py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold">{editingId ? 'Update' : 'Add Player'}</button>
        </div>
      )}
    </div>
  );
}

// ─── STANDINGS PAGE (FIX #11: Admin controls for points table) ───
export function StandingsPage({ store }: { store: KDPLStore }) {
  const { state, deleteTeam } = store;
  const { teams, isAdmin } = state;
  const sorted = [...teams].sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><UsersIcon size={18} className="text-kdpl-neon" /> Points Table</h2>

      <div className="bg-kdpl-card border border-kdpl-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-kdpl-border text-kdpl-muted">
              <th className="py-2 px-2 text-left">#</th>
              <th className="py-2 px-2 text-left">Team</th>
              <th className="py-2 px-1 text-center">P</th>
              <th className="py-2 px-1 text-center">W</th>
              <th className="py-2 px-1 text-center">L</th>
              <th className="py-2 px-1 text-center">Pts</th>
              <th className="py-2 px-1 text-center">NRR</th>
              {/* FIX #11: Admin action column */}
              {isAdmin && <th className="py-2 px-2 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => (
              <tr key={team.id} className="border-b border-kdpl-border/30 last:border-0">
                <td className="py-2 px-2 text-kdpl-muted">{idx + 1}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: team.color }}>{team.shortName?.slice(0, 2)}</div>
                    <span className="text-kdpl-text font-medium">{team.shortName}</span>
                  </div>
                </td>
                <td className="py-2 px-1 text-center text-kdpl-text">{team.matchesPlayed}</td>
                <td className="py-2 px-1 text-center text-green-400">{team.wins}</td>
                <td className="py-2 px-1 text-center text-red-400">{team.losses}</td>
                <td className="py-2 px-1 text-center text-kdpl-neon font-bold">{team.points}</td>
                <td className="py-2 px-1 text-center text-kdpl-text">{team.nrr > 0 ? '+' : ''}{team.nrr}</td>
                {/* FIX #11: Admin edit/delete/remove actions */}
                {isAdmin && (
                  <td className="py-2 px-2 text-center">
                    <button onClick={() => deleteTeam(team.id)} className="text-red-400 hover:text-red-300 p-1" title="Remove team">
                      <TrashIcon size={12} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIX #11: Bulk delete option for admin */}
      {isAdmin && teams.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => { if (confirm('Remove all teams from points table?')) teams.forEach(t => deleteTeam(t.id)); }}
            className="flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
            Clear All Teams
          </button>
        </div>
      )}
    </div>
  );
}
