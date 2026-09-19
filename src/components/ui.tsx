import { useState, useRef } from 'react';
import { cn, uploadImageToImgBB, compressImage } from '../utils';

// ─── ICONS ───
interface IconProps { size?: number; className?: string; }
const I = ({ size = 20, className = '', d }: IconProps & { d: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
);
export const HomeIcon = (p: IconProps) => <I {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />;
export const CalendarIcon = (p: IconProps) => <I {...p} d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" />;
export const RadioIcon = (p: IconProps) => <I {...p} d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4M12 12v.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4M19.1 4.9C23 8.8 23 15.1 19.1 19" />;
export const EditIcon = (p: IconProps) => <I {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
export const BarChartIcon = (p: IconProps) => <I {...p} d="M12 20V10M18 20V4M6 20v-4" />;
export const LockIcon = (p: IconProps) => <I {...p} d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />;
export const SunIcon = (p: IconProps) => <I {...p} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 100 12 6 6 0 000-12z" />;
export const MoonIcon = (p: IconProps) => <I {...p} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />;
export const BellIcon = (p: IconProps) => <I {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />;
export const ShieldIcon = (p: IconProps) => <I {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
export const WifiOffIcon = (p: IconProps) => <I {...p} d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />;
export const LogoutIcon = (p: IconProps) => <I {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />;
export const XIcon = (p: IconProps) => <I {...p} d="M18 6L6 18M6 6l12 12" />;
export const SettingsIcon = (p: IconProps) => <I {...p} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />;
export const ArrowLeftIcon = (p: IconProps) => <I {...p} d="M19 12H5M12 19l-7-7 7-7" />;
export const PlusIcon = (p: IconProps) => <I {...p} d="M12 5v14M5 12h14" />;
export const TrashIcon = (p: IconProps) => <I {...p} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />;
export const DownloadIcon = (p: IconProps) => <I {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />;
export const UploadIcon = (p: IconProps) => <I {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
export const UsersIcon = (p: IconProps) => <I {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />;
export const TrophyIcon = (p: IconProps) => <I {...p} d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z" />;
export const WhatsAppIcon = (p: IconProps) => <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="currentColor" className={p.className}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.414.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
export const CameraIcon = (p: IconProps) => <I {...p} d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" />;
export const ZapIcon = (p: IconProps) => <I {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
export const AwardIcon = (p: IconProps) => <I {...p} d="M12 15l-3.09 1.64.59-3.44-2.5-2.44 3.45-.5L12 7.5l1.55 2.76 3.45.5-2.5 2.44.59 3.44zM4.3 18.7l.7-4.1L2 12l4.1-.6L8 7.5 9.9 11.4 14 12l-3 2.9.7 4.1L8 17l-3.7 1.7z" />;
export const ChevronRightIcon = (p: IconProps) => <I {...p} d="M9 18l6-6-6-6" />;
export const FacebookIcon = (p: IconProps) => <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="currentColor" className={p.className}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
export const ImageIcon = (p: IconProps) => <I {...p} d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" />;

// ─── TEAM BADGE ───
interface TeamBadgeProps { name: string; shortName: string; color: string; logoUrl?: string; size?: 'sm' | 'md' | 'lg'; }
export function TeamBadge({ name, shortName, color, logoUrl, size = 'md' }: TeamBadgeProps) {
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-10 h-10 text-xs', lg: 'w-14 h-14 text-sm' };
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shadow-lg flex-shrink-0 overflow-hidden`} style={{ backgroundColor: color || '#0f5132' }}>
      {logoUrl ? <img src={logoUrl} alt={name} className="w-full h-full object-cover" /> : shortName?.slice(0, 3) || name?.slice(0, 2)}
    </div>
  );
}

// ─── IMAGE UPLOAD COMPONENT (FIX #6) ───
interface ImageUploadProps {
  value: string; onChange: (url: string) => void;
  label?: string; compress?: boolean; maxSizeMB?: number;
  className?: string;
}
export function ImageUpload({ value, onChange, label = 'Upload Image', compress = true, maxSizeMB = 5, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setUploading(true);
    try {
      const processed = compress ? await compressImage(file) : file;
      const url = await uploadImageToImgBB(processed);
      onChange(url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <label className="text-xs text-kdpl-muted font-medium">{label}</label>
      <div className="flex items-center gap-3">
        {value && (
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-kdpl-border flex-shrink-0">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" id={`upload-${label}`} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-kdpl-card border border-kdpl-border text-kdpl-text text-xs hover:border-kdpl-neon/50 transition-all disabled:opacity-50">
            {uploading ? <span className="animate-spin">⏳</span> : <UploadIcon size={14} />}
            {uploading ? 'Uploading...' : 'Choose Image'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-red-400 text-[10px] mt-1 hover:underline">Remove</button>
          )}
        </div>
      </div>
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
    </div>
  );
}

// ─── AD SLOT RENDERER ───
export function AdSlotRenderer({ adCode, enabled }: { adCode: string; enabled: boolean }) {
  if (!enabled || !adCode) return null;
  return <div className="w-full my-2" dangerouslySetInnerHTML={{ __html: adCode }} />;
}
