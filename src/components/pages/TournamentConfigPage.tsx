import { useState } from 'react';
import { PlusIcon, TrashIcon, WhatsAppIcon } from '../ui';
import type { KDPLStore } from '../../store/useKDPLStore';
import type { TournamentOfficial, TournamentBroadcaster } from '../../types';
import { genId } from '../../utils';

export default function TournamentConfigPage({ store }: { store: KDPLStore }) {
  const { state, updateTournament } = store;
  const { tournament, isAdmin, supportWhatsapp } = state;
  const [officials, setOfficials] = useState<TournamentOfficial[]>(tournament?.officials || []);
  const [broadcasters, setBroadcasters] = useState<TournamentBroadcaster[]>(tournament?.broadcasters || []);
  const [newOfficial, setNewOfficial] = useState<{ name: string; role: 'Organizer' | 'Committee Member'; whatsapp: string }>({ name: '', role: 'Organizer', whatsapp: '' });
  const [newBroadcaster, setNewBroadcaster] = useState({ name: '', whatsapp: '' });
  const [saved, setSaved] = useState(false);

  if (!tournament || !isAdmin) {
    return <div className="p-4 text-center text-kdpl-muted text-sm">No tournament selected or access denied.</div>;
  }

  // FIX #5: Properly save officials and broadcasters to the tournament
  const handleSave = () => {
    updateTournament(tournament.id, { officials, broadcasters });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addOfficial = () => {
    if (!newOfficial.name) return;
    setOfficials([...officials, { ...newOfficial, id: genId('off') }]);
    setNewOfficial({ name: '', role: 'Organizer', whatsapp: '' });
  };

  const removeOfficial = (id: string) => setOfficials(officials.filter(o => o.id !== id));

  const addBroadcaster = () => {
    if (!newBroadcaster.name) return;
    setBroadcasters([...broadcasters, { ...newBroadcaster, id: genId('bc') }]);
    setNewBroadcaster({ name: '', whatsapp: '' });
  };

  const removeBroadcaster = (id: string) => setBroadcasters(broadcasters.filter(b => b.id !== id));

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text">Tournament Configuration</h2>

      {/* Basic Info */}
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
        <h3 className="text-kdpl-text text-sm font-semibold">Basic Info</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-kdpl-muted">Format:</span> <span className="text-kdpl-text">{tournament.format}</span></div>
          <div><span className="text-kdpl-muted">Overs:</span> <span className="text-kdpl-text">{tournament.overs}</span></div>
          <div><span className="text-kdpl-muted">Teams:</span> <span className="text-kdpl-text">{tournament.teamCount}</span></div>
          <div><span className="text-kdpl-muted">Status:</span> <span className="text-kdpl-text capitalize">{tournament.status}</span></div>
        </div>
      </div>

      {/* FIX #5: Officials section with proper save */}
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
        <h3 className="text-kdpl-text text-sm font-semibold">Organisers & Committee</h3>
        {officials.map(o => (
          <div key={o.id} className="flex items-center justify-between py-1 border-b border-kdpl-border/30 last:border-0">
            <div>
              <div className="text-kdpl-text text-xs">{o.name}</div>
              <div className="text-kdpl-muted text-[10px]">{o.role} {o.whatsapp && `• ${o.whatsapp}`}</div>
            </div>
            <button onClick={() => removeOfficial(o.id)} className="text-red-400 p-1"><TrashIcon size={12} /></button>
          </div>
        ))}
        <div className="space-y-1 pt-2">
          <input value={newOfficial.name} onChange={e => setNewOfficial({ ...newOfficial, name: e.target.value })} placeholder="Name" className="w-full px-2 py-1.5 rounded bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <div className="flex gap-1">
            <select value={newOfficial.role} onChange={e => setNewOfficial({ ...newOfficial, role: e.target.value as 'Organizer' | 'Committee Member' })} className="flex-1 px-2 py-1.5 rounded bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs">
              <option value="Organizer">Organizer</option>
              <option value="Committee Member">Committee</option>
            </select>
            <input value={newOfficial.whatsapp} onChange={e => setNewOfficial({ ...newOfficial, whatsapp: e.target.value })} placeholder="WhatsApp" className="flex-1 px-2 py-1.5 rounded bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          </div>
          <button onClick={addOfficial} className="flex items-center gap-1 text-kdpl-neon text-xs"><PlusIcon size={10} /> Add</button>
        </div>
      </div>

      {/* FIX #5: Broadcasters section with proper save */}
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
        <h3 className="text-kdpl-text text-sm font-semibold">Live Broadcasters</h3>
        {broadcasters.map(b => (
          <div key={b.id} className="flex items-center justify-between py-1 border-b border-kdpl-border/30 last:border-0">
            <div>
              <div className="text-kdpl-text text-xs">{b.name}</div>
              {b.whatsapp && <div className="text-kdpl-muted text-[10px]">{b.whatsapp}</div>}
            </div>
            <button onClick={() => removeBroadcaster(b.id)} className="text-red-400 p-1"><TrashIcon size={12} /></button>
          </div>
        ))}
        <div className="space-y-1 pt-2">
          <input value={newBroadcaster.name} onChange={e => setNewBroadcaster({ ...newBroadcaster, name: e.target.value })} placeholder="Name" className="w-full px-2 py-1.5 rounded bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <input value={newBroadcaster.whatsapp} onChange={e => setNewBroadcaster({ ...newBroadcaster, whatsapp: e.target.value })} placeholder="WhatsApp" className="w-full px-2 py-1.5 rounded bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          <button onClick={addBroadcaster} className="flex items-center gap-1 text-kdpl-neon text-xs"><PlusIcon size={10} /> Add</button>
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${saved ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-kdpl-neon text-kdpl-darker'}`}>
        {saved ? '✓ Saved Successfully' : 'Save Configuration'}
      </button>

      {/* FIX #3: WhatsApp FAB with position:fixed instead of scrolling with content */}
      {supportWhatsapp && (
        <a href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform"
          style={{ position: 'fixed' }}>
          <WhatsAppIcon size={22} className="text-white" />
        </a>
      )}
    </div>
  );
}
