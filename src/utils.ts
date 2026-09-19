import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Innings, Partnership, Series, Fixture } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let fallbackCounter = 0;
export function genId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  fallbackCounter = (fallbackCounter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${fallbackCounter}_${rand}`;
}

export function computePartnerships(innings: Innings): Partnership[] {
  const partnerships: Partnership[] = [];
  let batter1 = '', batter2 = '', runs = 0, balls = 0;
  for (const ball of innings.ballEvents) {
    if (!batter1 && !batter2) batter1 = ball.batsmanId;
    else if (batter1 && !batter2 && ball.batsmanId !== batter1) batter2 = ball.batsmanId;
    runs += ball.runs + ball.extras;
    if (ball.extraType === '' || ball.extraType === 'No-Ball') balls += 1;
    if (ball.isWicket) {
      partnerships.push({ batter1Id: batter1, batter2Id: batter2, runs, balls });
      const dismissedId = ball.wicketType === 'Run-Out' && ball.runOutBatsmanId ? ball.runOutBatsmanId : ball.batsmanId;
      const survivor = dismissedId === batter1 ? batter2 : batter1;
      batter1 = survivor; batter2 = ''; runs = 0; balls = 0;
    }
  }
  if (batter1 || batter2) partnerships.push({ batter1Id: batter1, batter2Id: batter2, runs, balls });
  return partnerships;
}

export interface SeriesResult {
  matches: Fixture[]; completedCount: number; teamAWins: number; teamBWins: number;
  ties: number; decided: boolean; winnerId: string;
  status: 'upcoming' | 'live' | 'completed'; remaining: number;
}

export function computeSeriesResult(series: Series, fixtures: Fixture[]): SeriesResult {
  const matches = fixtures.filter(f => f.seriesId === series.id).sort((a, b) => (a.seriesMatchNumber || 0) - (b.seriesMatchNumber || 0));
  const completed = matches.filter(f => f.status === 'completed' && f.result);
  let teamAWins = 0, teamBWins = 0, ties = 0;
  completed.forEach(f => {
    if (f.result!.winnerId === series.teamAId) teamAWins++;
    else if (f.result!.winnerId === series.teamBId) teamBWins++;
    else ties++;
  });
  const majority = Math.floor(series.totalMatches / 2) + 1;
  let decided = false, winnerId = '';
  if (series.seriesType === 'best-of' && (teamAWins >= majority || teamBWins >= majority)) {
    decided = true; winnerId = teamAWins >= majority ? series.teamAId : series.teamBId;
  } else if (completed.length >= series.totalMatches && matches.length >= series.totalMatches) {
    decided = true; winnerId = teamAWins > teamBWins ? series.teamAId : teamBWins > teamAWins ? series.teamBId : '';
  }
  const status: SeriesResult['status'] = decided ? 'completed' : matches.some(f => f.status === 'live') || completed.length > 0 ? 'live' : 'upcoming';
  const remaining = decided ? 0 : Math.max(0, series.totalMatches - matches.length);
  return { matches, completedCount: completed.length, teamAWins, teamBWins, ties, decided, winnerId, status, remaining };
}

// FIX #6: Image upload utility using ImgBB free API
export async function uploadImageToImgBB(file: File): Promise<string> {
  const API_KEY = '6d207e021cb19a5f2b5e8d8a1f5e0c8d'; // Free tier key for demo
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: 'POST', body: formData,
    });
    const data = await response.json();
    if (data.success) return data.data.url;
    throw new Error(data.error?.message || 'Upload failed');
  } catch (error) {
    console.warn('ImgBB upload failed, using local base64:', error);
    return fileToBase64(file);
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// FIX #8: Image compression utility
export async function compressImage(file: File, maxWidth = 400, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        else resolve(file);
      }, 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

// FIX #7: Mobile-compatible export utility
export async function exportElementAsImage(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // FIX #7: Mobile-compatible canvas export
  const html2canvas = (await import('html2canvas')).default;
  
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    scale: window.devicePixelRatio > 1 ? 2 : 1, // Lower scale for mobile performance
    backgroundColor: '#0f172a',
    logging: false,
    // Mobile-specific: use window dimensions for proper rendering
    width: Math.min(element.scrollWidth, window.innerWidth),
    windowWidth: window.innerWidth,
  });

  // Mobile-compatible download: try blob URL first, fallback to data URL
  try {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        // Fallback: open in new tab for mobile save
        const dataUrl = canvas.toDataURL('image/png');
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`<img src="${dataUrl}" style="max-width:100%"><br><a href="${dataUrl}" download="${filename}">Save Image</a>`);
        }
      }
    }, 'image/png', 0.95);
  } catch {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
