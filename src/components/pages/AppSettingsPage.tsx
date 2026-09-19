import { useState } from 'react';
import { SettingsIcon, SunIcon, MoonIcon, WhatsAppIcon } from '../ui';
import type { KDPLStore } from '../../store/useKDPLStore';

// ─── APP SETTINGS PAGE (FIX #12: Community link control) ───
export default function AppSettingsPage({ store }: { store: KDPLStore }) {
  const { state, setTheme, updateSupportWhatsapp, updateCommunityLink, toggleCommunityLink } = store;
  const { theme, supportWhatsapp, isSuperAdmin, communityLink, communityLinkEnabled } = state;
  const [waNum, setWaNum] = useState(supportWhatsapp);
  const [commLink, setCommLink] = useState(communityLink);

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-lg font-oswald font-bold text-kdpl-text flex items-center gap-2"><SettingsIcon size={18} className="text-kdpl-neon" /> App Settings</h2>

      {/* Theme */}
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
        <h3 className="text-kdpl-text text-sm font-semibold mb-2">Theme</h3>
        <div className="flex gap-2">
          <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon' : 'bg-kdpl-darker border border-kdpl-border text-kdpl-muted'}`}>
            <MoonIcon size={14} /> Dark
          </button>
          <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-kdpl-neon/15 border border-kdpl-neon/30 text-kdpl-neon' : 'bg-kdpl-darker border border-kdpl-border text-kdpl-muted'}`}>
            <SunIcon size={14} /> Light
          </button>
        </div>
      </div>

      {/* Support WhatsApp */}
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3 space-y-2">
        <h3 className="text-kdpl-text text-sm font-semibold">Support WhatsApp</h3>
        <div className="flex items-center gap-2">
          <WhatsAppIcon size={16} className="text-green-400" />
          <input value={waNum} onChange={e => setWaNum(e.target.value)} placeholder="+92 300 1234567" className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
        </div>
        <button onClick={() => updateSupportWhatsapp(waNum)} className="w-full py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold">Save</button>
      </div>

      {/* FIX #12: Community Link Control (Super Admin only) */}
      {isSuperAdmin && (
        <div className="bg-kdpl-card border border-kdpl-neon/30 rounded-xl p-3 space-y-2">
          <h3 className="text-kdpl-neon text-sm font-semibold flex items-center gap-2">
            🌐 Community Link (Super Admin)
          </h3>
          <div className="flex items-center gap-2">
            <input value={commLink} onChange={e => setCommLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." className="flex-1 px-3 py-2 rounded-lg bg-kdpl-darker border border-kdpl-border text-kdpl-text text-xs" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-kdpl-muted text-xs">Show community toast on app launch</span>
            <button onClick={() => toggleCommunityLink(!communityLinkEnabled)}
              className={`w-10 h-5 rounded-full transition-all ${communityLinkEnabled ? 'bg-kdpl-neon' : 'bg-kdpl-border'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${communityLinkEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button onClick={() => updateCommunityLink(commLink)} className="w-full py-2 rounded-lg bg-kdpl-neon text-kdpl-darker text-xs font-bold">Save Community Link</button>
        </div>
      )}

      {/* App info */}
      <div className="bg-kdpl-card border border-kdpl-border rounded-xl p-3">
        <h3 className="text-kdpl-text text-sm font-semibold mb-1">About</h3>
        <div className="text-kdpl-muted text-xs space-y-1">
          <div>KDPL Cricket Manager v2.0</div>
          <div>React + TypeScript + Tailwind CSS</div>
          <div>Firebase Firestore + Auth</div>
        </div>
      </div>
    </div>
  );
}
