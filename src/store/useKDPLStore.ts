import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { genId } from '../utils';
import type {
  AppState, Team, Player, Venue, Fixture, LiveMatch, Series, Tournament,
  Notification, OrganizerProfile, BallEvent, PlayerInningsStats, BowlerInningsStats,
  Innings, UndoSnapshot
} from '../types';

const CLOUD_DOC = doc(db, 'kdpl', 'data');
const LIVE_MATCHES_COLLECTION = collection(db, 'kdplLiveMatches');
const TOURNAMENTS_COLLECTION = collection(db, 'kdplTournaments');

function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* */ }
}

function cloudSet(field: string, value: unknown): void {
  setDoc(CLOUD_DOC, { [field]: value }, { merge: true })
    .catch(e => console.warn('Cloud sync failed:', e));
}

function cloudSetTournament(t: Tournament): void {
  setDoc(doc(TOURNAMENTS_COLLECTION, t.id), t)
    .catch(e => console.warn('Cloud sync failed:', e));
}

function cloudDeleteTournament(id: string): void {
  deleteDoc(doc(TOURNAMENTS_COLLECTION, id))
    .catch(e => console.warn('Cloud sync failed:', e));
}

function cloudSetLiveMatch(lm: LiveMatch): void {
  setDoc(doc(LIVE_MATCHES_COLLECTION, lm.id), lm)
    .catch(e => console.warn('Cloud sync failed:', e));
}

function cloudDeleteLiveMatch(id: string): void {
  deleteDoc(doc(LIVE_MATCHES_COLLECTION, id))
    .catch(e => console.warn('Cloud sync failed:', e));
}

const DEFAULT_AD_SLOTS = [
  { id: 'ad1', name: 'Dashboard Top', position: 'dashboard-top' as const, adCode: '', enabled: false, createdAt: Date.now() },
  { id: 'ad2', name: 'Dashboard Mid', position: 'dashboard-mid' as const, adCode: '', enabled: false, createdAt: Date.now() },
];

interface InternalState extends AppState {
  allTeams: Team[]; allPlayers: Player[]; allVenues: Venue[];
  allFixtures: Fixture[]; allSeries: Series[]; allLiveMatches: LiveMatch[];
  pageHistory: string[]; activeSeriesId: string | null;
}

function withDerived(s: InternalState): InternalState {
  const tournament = s.tournaments.find(t => t.id === s.activeTournamentId) || null;
  const isSuperAdmin = !!s.authEmail && s.superAdminEmails.map(e => e.toLowerCase()).includes(s.authEmail.toLowerCase());
  const organizerProfile = s.organizers.find(o => o.uid === s.authUid) || null;
  const isOwner = !!tournament && !!s.authUid && tournament.organizerUid === s.authUid && organizerProfile?.status === 'approved';
  const tournamentLiveMatches = s.allLiveMatches.filter(lm => lm.tournamentId === s.activeTournamentId);
  const liveMatch = tournamentLiveMatches.find(lm => lm.fixtureId === s.activeFixtureId) ||
    tournamentLiveMatches.find(lm => lm.status === 'live') || tournamentLiveMatches[0] || null;
  return {
    ...s, tournament, organizerProfile,
    teams: s.allTeams.filter(t => t.tournamentId === s.activeTournamentId),
    players: s.allPlayers.filter(p => p.tournamentId === s.activeTournamentId),
    venues: s.allVenues.filter(v => v.tournamentId === s.activeTournamentId),
    fixtures: s.allFixtures.filter(f => f.tournamentId === s.activeTournamentId),
    series: s.allSeries.filter(sr => sr.tournamentId === s.activeTournamentId),
    liveMatch, liveMatches: tournamentLiveMatches.filter(lm => lm.status === 'live'),
    isSuperAdmin, isAdmin: isSuperAdmin || isOwner,
  };
}

function emptyInnings(teamId: string): Innings {
  return { teamId, battingOrder: [], currentBatter1: '', currentBatter2: '', currentBowler: '', runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, target: 0, ballEvents: [], playerStats: {}, bowlerStats: {}, partnerships: [], fallOfWickets: [] };
}

const INITIAL_STATE: InternalState = {
  currentPage: 'dashboard', currentTab: 'home',
  isAdmin: false, isSuperAdmin: false, hasSetupAccess: false,
  authUid: null, authEmail: null, userRole: 'GUEST', user: null,
  tournaments: [], activeTournamentId: null, tournament: null,
  organizers: [], organizerProfile: null,
  allTeams: [], allPlayers: [], allVenues: [], allFixtures: [], allSeries: [], allLiveMatches: [],
  teams: [], players: [], venues: [], fixtures: [], series: [],
  liveMatch: null, liveMatches: [], activeFixtureId: null, activeSeriesId: null,
  notifications: [], adSlots: DEFAULT_AD_SLOTS,
  supportWhatsapp: '', superAdminEmails: [],
  theme: 'dark', lang: 'en', isOnline: true, syncStatus: 'synced', writeQueue: 0,
  pageHistory: [],
  communityLink: 'https://chat.whatsapp.com/kdpl-community',
  communityLinkEnabled: true,
  communityToastShown: false,
};

function findActiveLiveMatch(s: InternalState): LiveMatch | null {
  const tlm = s.allLiveMatches.filter(lm => lm.tournamentId === s.activeTournamentId);
  return tlm.find(lm => lm.fixtureId === s.activeFixtureId) || tlm.find(lm => lm.status === 'live') || tlm[0] || null;
}

function applyPlayerStats(allPlayers: Player[], lm: LiveMatch): Player[] {
  const allBatting = { ...lm.innings1.playerStats, ...lm.innings2.playerStats };
  const allBowling = { ...lm.innings1.bowlerStats, ...lm.innings2.bowlerStats };
  const allBalls = [...lm.innings1.ballEvents, ...lm.innings2.ballEvents];
  const participantIds = new Set([...Object.keys(allBatting), ...Object.keys(allBowling), ...allBalls.filter(b => b.isWicket && b.fielderId).map(b => b.fielderId)]);
  return allPlayers.map(p => {
    if (!participantIds.has(p.id)) return p;
    const bat = allBatting[p.id]; const bowl = allBowling[p.id];
    const catches = allBalls.filter(b => b.isWicket && b.fielderId === p.id && (b.wicketType === 'Caught' || b.wicketType === 'Run-Out')).length;
    const stumpings = allBalls.filter(b => b.isWicket && b.fielderId === p.id && b.wicketType === 'Stumped').length;
    const runsThisMatch = bat?.runs || 0; const wicketsThisMatch = bowl?.wickets || 0;
    const oversThisMatch = (bowl?.overs || 0) + (bowl?.balls || 0) / 6;
    return { ...p, matches: p.matches + 1, runs: p.runs + runsThisMatch, balls: p.balls + (bat?.balls || 0), fours: p.fours + (bat?.fours || 0), sixes: p.sixes + (bat?.sixes || 0), fifties: p.fifties + (runsThisMatch >= 50 && runsThisMatch < 100 ? 1 : 0), hundreds: p.hundreds + (runsThisMatch >= 100 ? 1 : 0), highScore: Math.max(p.highScore, runsThisMatch), wickets: p.wickets + wicketsThisMatch, oversBowled: Math.round((p.oversBowled + oversThisMatch) * 10) / 10, runsConceded: p.runsConceded + (bowl?.runs || 0), catches: p.catches + catches, stumpings: p.stumpings + stumpings, mvpScore: p.mvpScore + runsThisMatch + wicketsThisMatch * 20 + (catches + stumpings) * 10 };
  });
}

function finalizeMatch(s: InternalState, lm: LiveMatch): InternalState {
  const i1 = lm.innings1, i2 = lm.innings2;
  const teamAWins = i2.runs > i1.runs;
  const tied = i1.runs === i2.runs && i2.wickets < (s.allPlayers.filter(p => p.teamId === i2.teamId).length || 11);
  const winnerId = teamAWins ? i2.teamId : tied ? '' : i1.teamId;
  const loserTeamId = teamAWins ? i1.teamId : i2.teamId;
  const margin = teamAWins ? `${i2.teamId === lm.teamAId ? i1.runs : (i2.runs - i1.runs)} runs` : `${(s.allPlayers.filter(p => p.teamId === i1.teamId).length || 11) - i1.wickets} wickets`;
  const result = { winnerId, loserTeamId, teamAScore: i1.runs, teamBScore: i2.runs, teamAOvers: `${i1.overs}.${i1.balls}`, teamBOvers: `${i2.overs}.${i2.balls}`, margin, manOfMatch: '' };
  const allFixtures = s.allFixtures.map(f => f.id === lm.fixtureId ? { ...f, status: 'completed' as const, result } : f);
  const allTeams = s.allTeams.map(t => {
    if (t.id !== i1.teamId && t.id !== i2.teamId) return t;
    const isA = t.id === i1.teamId; const isWinner = t.id === winnerId; const isLoser = t.id === loserTeamId && !tied;
    const runsFor = isA ? i1.runs : i2.runs; const oversFor = (isA ? i1.overs : i2.overs) + (isA ? i1.balls : i2.balls) / 6;
    const runsAgainst = isA ? i2.runs : i1.runs; const oversAgainst = (isA ? i2.overs : i1.overs) + (isA ? i2.balls : i1.balls) / 6;
    const nrrFor = oversFor > 0 ? runsFor / oversFor : 0; const nrrAgainst = oversAgainst > 0 ? runsAgainst / oversAgainst : 0;
    const newNrrRunsFor = t.nrrRunsFor + runsFor; const newNrrOversFor = t.nrrOversFor + oversFor;
    const newNrrRunsAgainst = t.nrrRunsAgainst + runsAgainst; const newNrrOversAgainst = t.nrrOversAgainst + oversAgainst;
    const nrr = newNrrOversFor > 0 && newNrrOversAgainst > 0 ? (newNrrRunsFor / newNrrOversFor) - (newNrrRunsAgainst / newNrrOversAgainst) : 0;
    return { ...t, matchesPlayed: t.matchesPlayed + 1, wins: t.wins + (isWinner ? 1 : 0), losses: t.losses + (isLoser ? 1 : 0), ties: t.ties + (tied ? 1 : 0), points: t.points + (isWinner ? 2 : tied ? 1 : 0), nrr: Math.round(nrr * 1000) / 1000, nrrRunsFor: newNrrRunsFor, nrrOversFor: newNrrOversFor, nrrRunsAgainst: newNrrRunsAgainst, nrrOversAgainst: newNrrOversAgainst };
  });
  const allPlayers = applyPlayerStats(s.allPlayers, lm);
  const allLiveMatches = s.allLiveMatches.filter(x => x.id !== lm.id);
  lsSet('kdpl_all_teams', allTeams); lsSet('kdpl_all_players', allPlayers); lsSet('kdpl_all_fixtures', allFixtures); lsSet('kdpl_all_live_matches', allLiveMatches);
  cloudSet('teams', allTeams); cloudSet('players', allPlayers); cloudSet('fixtures', allFixtures);
  cloudDeleteLiveMatch(lm.id);
  return withDerived({ ...s, allTeams, allPlayers, allFixtures, allLiveMatches });
}

export function useKDPLStore() {
  const [state, setState] = useState<InternalState>(() => {
    const saved = ls<Partial<InternalState>>('kdpl_state', {});
    const allTeams = ls<Team[]>('kdpl_all_teams', []);
    const allPlayers = ls<Player[]>('kdpl_all_players', []);
    const allVenues = ls<Venue[]>('kdpl_all_venues', []);
    const allFixtures = ls<Fixture[]>('kdpl_all_fixtures', []);
    const allSeries = ls<Series[]>('kdpl_all_series', []);
    const allLiveMatches = ls<LiveMatch[]>('kdpl_all_live_matches', []);
    const communityLink = ls<string>('kdpl_community_link', 'https://chat.whatsapp.com/kdpl-community');
    const communityLinkEnabled = ls<boolean>('kdpl_community_link_enabled', true);
    return withDerived({
      ...INITIAL_STATE, ...saved,
      allTeams, allPlayers, allVenues, allFixtures, allSeries, allLiveMatches,
      communityLink, communityLinkEnabled,
    });
  });

  // Firestore real-time sync
  useEffect(() => {
    const unsub = onSnapshot(CLOUD_DOC, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setState(s => {
        const updates: Partial<InternalState> = {};
        if (data.teams) { lsSet('kdpl_all_teams', data.teams); updates.allTeams = data.teams; }
        if (data.players) { lsSet('kdpl_all_players', data.players); updates.allPlayers = data.players; }
        if (data.venues) { lsSet('kdpl_all_venues', data.venues); updates.allVenues = data.venues; }
        if (data.fixtures) { lsSet('kdpl_all_fixtures', data.fixtures); updates.allFixtures = data.fixtures; }
        if (data.series) { lsSet('kdpl_all_series', data.series); updates.allSeries = data.series; }
        if (data.notifications) updates.notifications = data.notifications;
        if (data.adSlots) updates.adSlots = data.adSlots;
        if (data.superAdminEmails) updates.superAdminEmails = data.superAdminEmails;
        if (data.supportWhatsapp) updates.supportWhatsapp = data.supportWhatsapp;
        return withDerived({ ...s, ...updates });
      });
    }, () => { setState(s => ({ ...s, isOnline: false, syncStatus: 'offline' })); });
    const unsubLive = onSnapshot(LIVE_MATCHES_COLLECTION, (snap) => {
      const allLiveMatches: LiveMatch[] = [];
      snap.forEach(d => allLiveMatches.push(d.data() as LiveMatch));
      lsSet('kdpl_all_live_matches', allLiveMatches);
      setState(s => withDerived({ ...s, allLiveMatches, isOnline: true, syncStatus: 'synced' }));
    });
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setState(s => ({ ...s, authUid: user?.uid || null, authEmail: user?.email || null }));
    });
    const onlineHandler = () => setState(s => ({ ...s, isOnline: true }));
    const offlineHandler = () => setState(s => ({ ...s, isOnline: false, syncStatus: 'offline' }));
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    return () => { unsub(); unsubLive(); unsubAuth(); window.removeEventListener('online', onlineHandler); window.removeEventListener('offline', offlineHandler); };
  }, []);

  const navigate = useCallback((page: string) => {
    setState(s => ({ ...s, currentPage: page, pageHistory: [...s.pageHistory, s.currentPage] }));
  }, []);

  const goBack = useCallback(() => {
    setState(s => {
      const history = [...s.pageHistory];
      const prev = history.pop() || 'dashboard';
      return { ...s, currentPage: prev, pageHistory: history };
    });
  }, []);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setState(s => { lsSet('kdpl_theme', theme); document.body.classList.toggle('light-mode', theme === 'light'); return { ...s, theme }; });
  }, []);

  const loginAdmin = useCallback(() => setState(s => ({ ...s, isAdmin: true })), []);
  const logoutAdmin = useCallback(() => {
    signOut(auth).catch(() => {});
    setState(s => ({ ...s, isAdmin: false, isSuperAdmin: false, authUid: null, authEmail: null, hasSetupAccess: false }));
  }, []);

  const organizerSignUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile: OrganizerProfile = { uid: cred.user.uid, email, name, status: 'pending', createdAt: Date.now() };
      setState(s => {
        const organizers = [...s.organizers, profile];
        cloudSet('organizers', organizers);
        return withDerived({ ...s, organizers, authUid: cred.user.uid, authEmail: email, organizerProfile: profile });
      });
    } catch (e) { console.error(e); }
  }, []);

  const organizerLogin = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setState(s => withDerived({ ...s, authUid: cred.user.uid, authEmail: email }));
    } catch (e) { console.error(e); }
  }, []);

  const approveOrganizer = useCallback((uid: string) => {
    setState(s => {
      const organizers = s.organizers.map(o => o.uid === uid ? { ...o, status: 'approved' as const } : o);
      cloudSet('organizers', organizers);
      return withDerived({ ...s, organizers });
    });
  }, []);

  const switchTournament = useCallback((id: string | null) => {
    setState(s => withDerived({ ...s, activeTournamentId: id, activeFixtureId: null }));
  }, []);

  const setActiveFixture = useCallback((id: string | null) => {
    setState(s => withDerived({ ...s, activeFixtureId: id }));
  }, []);

  const setActiveSeries = useCallback((id: string | null) => {
    setState(s => ({ ...s, activeSeriesId: id }));
  }, []);

  // FIX #5: Tournament update now properly saves officials and broadcasters
  const createTournament = useCallback((t: Omit<Tournament, 'id' | 'createdAt'>) => {
    const tournament: Tournament = { ...t, id: genId('t'), createdAt: Date.now() };
    setState(s => {
      const tournaments = [...s.tournaments, tournament];
      cloudSetTournament(tournament);
      return withDerived({ ...s, tournaments, activeTournamentId: tournament.id });
    });
  }, []);

  const updateTournament = useCallback((id: string, updates: Partial<Tournament>) => {
    setState(s => {
      const tournaments = s.tournaments.map(t => t.id === id ? { ...t, ...updates } : t);
      const updated = tournaments.find(t => t.id === id);
      if (updated) cloudSetTournament(updated);
      return withDerived({ ...s, tournaments });
    });
  }, []);

  const deleteTournament = useCallback((id: string) => {
    setState(s => {
      const tournaments = s.tournaments.filter(t => t.id !== id);
      const allTeams = s.allTeams.filter(t => t.tournamentId !== id);
      const allPlayers = s.allPlayers.filter(p => p.tournamentId !== id);
      const allVenues = s.allVenues.filter(v => v.tournamentId !== id);
      const allFixtures = s.allFixtures.filter(f => f.tournamentId !== id);
      const allSeries = s.allSeries.filter(sr => sr.tournamentId !== id);
      const allLiveMatches = s.allLiveMatches.filter(lm => lm.tournamentId !== id);
      cloudDeleteTournament(id);
      cloudSet('teams', allTeams); cloudSet('players', allPlayers); cloudSet('venues', allVenues);
      cloudSet('fixtures', allFixtures); cloudSet('series', allSeries);
      lsSet('kdpl_all_teams', allTeams); lsSet('kdpl_all_players', allPlayers);
      lsSet('kdpl_all_venues', allVenues); lsSet('kdpl_all_fixtures', allFixtures);
      lsSet('kdpl_all_series', allSeries); lsSet('kdpl_all_live_matches', allLiveMatches);
      return withDerived({ ...s, tournaments, allTeams, allPlayers, allVenues, allFixtures, allSeries, allLiveMatches, activeTournamentId: s.activeTournamentId === id ? null : s.activeTournamentId });
    });
  }, []);

  const addTeam = useCallback((team: Omit<Team, 'id' | 'createdAt' | 'wins' | 'losses' | 'ties' | 'nrr' | 'points' | 'matchesPlayed' | 'nrrRunsFor' | 'nrrOversFor' | 'nrrRunsAgainst' | 'nrrOversAgainst'>) => {
    const t: Team = { ...team, id: genId('team'), createdAt: Date.now(), wins: 0, losses: 0, ties: 0, nrr: 0, points: 0, matchesPlayed: 0, nrrRunsFor: 0, nrrOversFor: 0, nrrRunsAgainst: 0, nrrOversAgainst: 0 };
    setState(s => {
      const allTeams = [...s.allTeams, t];
      lsSet('kdpl_all_teams', allTeams); cloudSet('teams', allTeams);
      return withDerived({ ...s, allTeams });
    });
  }, []);

  const updateTeam = useCallback((id: string, updates: Partial<Team>) => {
    setState(s => {
      const allTeams = s.allTeams.map(t => t.id === id ? { ...t, ...updates } : t);
      lsSet('kdpl_all_teams', allTeams); cloudSet('teams', allTeams);
      return withDerived({ ...s, allTeams });
    });
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setState(s => {
      const allTeams = s.allTeams.filter(t => t.id !== id);
      const allPlayers = s.allPlayers.filter(p => p.teamId !== id);
      lsSet('kdpl_all_teams', allTeams); lsSet('kdpl_all_players', allPlayers);
      cloudSet('teams', allTeams); cloudSet('players', allPlayers);
      return withDerived({ ...s, allTeams, allPlayers });
    });
  }, []);

  const addPlayer = useCallback((player: Omit<Player, 'id' | 'createdAt' | 'matches' | 'runs' | 'balls' | 'fours' | 'sixes' | 'fifties' | 'hundreds' | 'highScore' | 'wickets' | 'oversBowled' | 'runsConceded' | 'catches' | 'stumpings' | 'mvpScore'>) => {
    const p: Player = { ...player, id: genId('p'), createdAt: Date.now(), matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, highScore: 0, wickets: 0, oversBowled: 0, runsConceded: 0, catches: 0, stumpings: 0, mvpScore: 0 };
    setState(s => {
      const allPlayers = [...s.allPlayers, p];
      lsSet('kdpl_all_players', allPlayers); cloudSet('players', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    setState(s => {
      const allPlayers = s.allPlayers.map(p => p.id === id ? { ...p, ...updates } : p);
      lsSet('kdpl_all_players', allPlayers); cloudSet('players', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const deletePlayer = useCallback((id: string) => {
    setState(s => {
      const allPlayers = s.allPlayers.filter(p => p.id !== id);
      lsSet('kdpl_all_players', allPlayers); cloudSet('players', allPlayers);
      return withDerived({ ...s, allPlayers });
    });
  }, []);

  const addVenue = useCallback((venue: Omit<Venue, 'id' | 'createdAt'>) => {
    const v: Venue = { ...venue, id: genId('v'), createdAt: Date.now() };
    setState(s => {
      const allVenues = [...s.allVenues, v];
      lsSet('kdpl_all_venues', allVenues); cloudSet('venues', allVenues);
      return withDerived({ ...s, allVenues });
    });
  }, []);

  const updateVenue = useCallback((id: string, updates: Partial<Venue>) => {
    setState(s => {
      const allVenues = s.allVenues.map(v => v.id === id ? { ...v, ...updates } : v);
      lsSet('kdpl_all_venues', allVenues); cloudSet('venues', allVenues);
      return withDerived({ ...s, allVenues });
    });
  }, []);

  const deleteVenue = useCallback((id: string) => {
    setState(s => {
      const allVenues = s.allVenues.filter(v => v.id !== id);
      lsSet('kdpl_all_venues', allVenues); cloudSet('venues', allVenues);
      return withDerived({ ...s, allVenues });
    });
  }, []);

  const addFixture = useCallback((fixture: Omit<Fixture, 'id' | 'createdAt'>) => {
    const f: Fixture = { ...fixture, id: genId('f'), createdAt: Date.now() };
    setState(s => {
      const allFixtures = [...s.allFixtures, f];
      lsSet('kdpl_all_fixtures', allFixtures); cloudSet('fixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  const updateFixture = useCallback((id: string, updates: Partial<Fixture>) => {
    setState(s => {
      const allFixtures = s.allFixtures.map(f => f.id === id ? { ...f, ...updates } : f);
      lsSet('kdpl_all_fixtures', allFixtures); cloudSet('fixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  const deleteFixture = useCallback((id: string) => {
    setState(s => {
      const allFixtures = s.allFixtures.filter(f => f.id !== id);
      lsSet('kdpl_all_fixtures', allFixtures); cloudSet('fixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  const createSeries = useCallback((series: Omit<Series, 'id' | 'createdAt'>) => {
    const sr: Series = { ...series, id: genId('sr'), createdAt: Date.now() };
    setState(s => {
      const allSeries = [...s.allSeries, sr];
      lsSet('kdpl_all_series', allSeries); cloudSet('series', allSeries);
      return withDerived({ ...s, allSeries });
    });
  }, []);

  const updateLiveMatch = useCallback((lm: LiveMatch) => {
    setState(s => {
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== lm.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const clearLiveMatch = useCallback((id: string) => {
    setState(s => {
      const allLiveMatches = s.allLiveMatches.filter(lm => lm.id !== id);
      lsSet('kdpl_all_live_matches', allLiveMatches);
      cloudDeleteLiveMatch(id);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const startLiveMatch = useCallback((fixtureId: string) => {
    setState(s => {
      const fixture = s.allFixtures.find(f => f.id === fixtureId);
      if (!fixture) return s;
      const lm: LiveMatch = {
        id: genId('lm'), tournamentId: fixture.tournamentId, fixtureId,
        teamAId: fixture.teamAId, teamBId: fixture.teamBId,
        status: 'live', currentInnings: 1,
        innings1: emptyInnings(fixture.teamAId), innings2: emptyInnings(fixture.teamBId),
        overs: fixture.overs, toss: { winner: '', call: 'Heads', result: 'Heads', decision: 'Bat First' },
        undoStack: [], lastOverBowlerId: '', startedAt: Date.now(), updatedAt: Date.now(),
      };
      const allLiveMatches = [...s.allLiveMatches, lm];
      const allFixtures = s.allFixtures.map(f => f.id === fixtureId ? { ...f, status: 'live' as const } : f);
      lsSet('kdpl_all_live_matches', allLiveMatches); lsSet('kdpl_all_fixtures', allFixtures);
      cloudSetLiveMatch(lm); cloudSet('fixtures', allFixtures);
      return withDerived({ ...s, allLiveMatches, allFixtures, activeFixtureId: fixtureId });
    });
  }, []);

  // FIX #4: recordBall now triggers immediate sync via cloudSetLiveMatch (no debounce)
  const recordBall = useCallback((ball: Omit<BallEvent, 'id' | 'timestamp'>) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      const ballEvent: BallEvent = { ...ball, id: genId('b'), timestamp: Date.now() };
      const snapshot: UndoSnapshot = { ball: ballEvent, innings: lm.currentInnings, prevBatter1: innings.currentBatter1, prevBatter2: innings.currentBatter2, prevBowler: innings.currentBowler, prevLastOverBowlerId: lm.lastOverBowlerId };
      const isWideOrNb = ballEvent.extraType === 'Wide' || ballEvent.extraType === 'No-Ball';
      const runs = ballEvent.runs; const extras = ballEvent.extras;
      innings.runs += runs + extras;
      if (extras > 0) innings.extras += extras;
      if (!isWideOrNb) { innings.balls += 1; if (innings.balls === 6) { innings.overs += 1; innings.balls = 0; } }
      // Batter stats
      if (innings.playerStats[ballEvent.batsmanId]) {
        const bs = { ...innings.playerStats[ballEvent.batsmanId] };
        const credited = (ballEvent.extraType === '' || ballEvent.extraType === 'No-Ball') ? runs : 0;
        bs.runs += credited; if (!isWideOrNb) bs.balls += 1;
        if (credited === 4) bs.fours += 1; if (credited === 6) bs.sixes += 1;
        bs.strikeRate = bs.balls > 0 ? (bs.runs / bs.balls) * 100 : 0;
        innings.playerStats = { ...innings.playerStats, [ballEvent.batsmanId]: bs };
      }
      // Bowler stats
      if (innings.bowlerStats[ballEvent.bowlerId]) {
        const bwl = { ...innings.bowlerStats[ballEvent.bowlerId] };
        bwl.runs += (ballEvent.extraType === 'Bye' || ballEvent.extraType === 'Leg-Bye') ? 0 : runs + extras;
        if (!isWideOrNb) { bwl.balls += 1; if (bwl.balls === 6) { bwl.overs += 1; bwl.balls = 0; } }
        if (ballEvent.isWicket && ballEvent.wicketType !== 'Run-Out') bwl.wickets += 1;
        bwl.economy = bwl.overs > 0 ? bwl.runs / bwl.overs : 0;
        innings.bowlerStats = { ...innings.bowlerStats, [ballEvent.bowlerId]: bwl };
      }
      // Wicket handling
      const dismissedId = ballEvent.isWicket ? (ballEvent.wicketType === 'Run-Out' && ballEvent.runOutBatsmanId ? ballEvent.runOutBatsmanId : ballEvent.batsmanId) : '';
      if (ballEvent.isWicket && dismissedId && innings.playerStats[dismissedId]) {
        const ds = { ...innings.playerStats[dismissedId] };
        ds.isOut = true; ds.wicketType = ballEvent.wicketType;
        ds.bowlerId = ballEvent.wicketType === 'Run-Out' ? '' : ballEvent.bowlerId;
        ds.fielderId = ballEvent.fielderId;
        innings.playerStats = { ...innings.playerStats, [dismissedId]: ds };
        innings.wickets += 1;
        innings.fallOfWickets = [...innings.fallOfWickets, { score: innings.runs, wicket: innings.wickets, batsmanId: dismissedId, over: `${innings.overs}.${innings.balls}` }];
      }
      innings.ballEvents = [...innings.ballEvents, ballEvent];
      lm.undoStack = [...(lm.undoStack || []).slice(-20), snapshot];
      lm.freeHit = ballEvent.extraType === 'No-Ball';
      // Strike rotation
      const runsRun = (ballEvent.extraType === 'Bye' || ballEvent.extraType === 'Leg-Bye') ? ballEvent.extras : ballEvent.runs;
      if (!isWideOrNb && runsRun % 2 === 1) { const tmp = innings.currentBatter1; innings.currentBatter1 = innings.currentBatter2; innings.currentBatter2 = tmp; }
      if (ballEvent.isWicket && dismissedId) {
        if (innings.currentBatter1 === dismissedId) innings.currentBatter1 = '';
        else if (innings.currentBatter2 === dismissedId) innings.currentBatter2 = '';
      }
      const overJustCompleted = !isWideOrNb && innings.balls === 0 && innings.overs > 0 && (innings.ballEvents.length > 1);
      if (innings.overs > 0 && innings.balls === 0 && lm.lastOverBowlerId !== ballEvent.bowlerId) {
        const tmp = innings.currentBatter1; innings.currentBatter1 = innings.currentBatter2; innings.currentBatter2 = tmp;
        innings.currentBowler = ''; lm.lastOverBowlerId = ballEvent.bowlerId;
      }
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      // Check innings/match end
      const playerCount = s.allPlayers.filter(p => p.teamId === innings.teamId && p.tournamentId === s.activeTournamentId).length || 11;
      const allOut = innings.wickets >= Math.max(1, playerCount - 1);
      const oversComplete = innings.overs >= lm.overs;
      const chaseComplete = lm.currentInnings === 2 && innings.runs > lm.innings1.runs;
      if (allOut || oversComplete || chaseComplete) {
        if (lm.currentInnings === 1) {
          lm.currentInnings = 2;
          lm.innings2 = { ...lm.innings2, target: innings.runs + 1 };
          lm.lastOverBowlerId = ''; lm.freeHit = false;
        } else {
          lm.status = 'completed';
          const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
          // FIX #4: Immediate finalization — no debounce, instant state + cloud sync
          return finalizeMatch({ ...s, allLiveMatches }, lm);
        }
      }
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches);
      // FIX #4: Immediate cloud sync (no debounce)
      cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const undoBall = useCallback(() => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current || !current.undoStack?.length) return s;
      const lm = { ...current }; const undoStack = [...lm.undoStack]; const snap = undoStack.pop()!;
      lm.undoStack = undoStack; const last = snap.ball;
      if (lm.status === 'completed') lm.status = 'live';
      lm.currentInnings = snap.innings;
      const innings = snap.innings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.runs = Math.max(0, innings.runs - last.runs - last.extras);
      innings.extras = Math.max(0, innings.extras - last.extras);
      const isWideOrNb = last.extraType === 'Wide' || last.extraType === 'No-Ball';
      if (!isWideOrNb) { if (innings.balls === 0 && innings.overs > 0) { innings.overs -= 1; innings.balls = 5; } else innings.balls = Math.max(0, innings.balls - 1); }
      if (last.isWicket) innings.wickets = Math.max(0, innings.wickets - 1);
      innings.ballEvents = innings.ballEvents.slice(0, -1);
      if (last.isWicket) innings.fallOfWickets = innings.fallOfWickets.slice(0, -1);
      innings.currentBatter1 = snap.prevBatter1; innings.currentBatter2 = snap.prevBatter2;
      innings.currentBowler = snap.prevBowler; lm.lastOverBowlerId = snap.prevLastOverBowlerId;
      lm.freeHit = false;
      if (snap.innings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches); cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const selectOpeners = useCallback((strikerId: string, nonStrikerId: string, bowlerId: string) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.currentBatter1 = strikerId; innings.currentBatter2 = nonStrikerId; innings.currentBowler = bowlerId;
      innings.playerStats = { ...innings.playerStats, [strikerId]: innings.playerStats[strikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, wicketType: '', bowlerId: '', fielderId: '', strikeRate: 0 }, [nonStrikerId]: innings.playerStats[nonStrikerId] || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, wicketType: '', bowlerId: '', fielderId: '', strikeRate: 0 } };
      innings.bowlerStats = { ...innings.bowlerStats, [bowlerId]: innings.bowlerStats[bowlerId] || { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0, economy: 0 } };
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches); cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const selectNextBatter = useCallback((batterId: string) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.currentBatter1 = batterId;
      innings.playerStats = { ...innings.playerStats, [batterId]: innings.playerStats[batterId] || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, wicketType: '', bowlerId: '', fielderId: '', strikeRate: 0 } };
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches); cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const selectNextBowler = useCallback((bowlerId: string) => {
    setState(s => {
      const current = findActiveLiveMatch(s);
      if (!current) return s;
      const lm = { ...current };
      const innings = lm.currentInnings === 1 ? { ...lm.innings1 } : { ...lm.innings2 };
      innings.currentBowler = bowlerId;
      innings.bowlerStats = { ...innings.bowlerStats, [bowlerId]: innings.bowlerStats[bowlerId] || { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0, economy: 0 } };
      if (lm.currentInnings === 1) lm.innings1 = innings; else lm.innings2 = innings;
      lm.updatedAt = Date.now();
      const allLiveMatches = [...s.allLiveMatches.filter(x => x.id !== current.id), lm];
      lsSet('kdpl_all_live_matches', allLiveMatches); cloudSetLiveMatch(lm);
      return withDerived({ ...s, allLiveMatches });
    });
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp'>) => {
    const notif: Notification = { ...n, id: genId('n'), timestamp: Date.now() };
    setState(s => {
      const notifications = [notif, ...s.notifications].slice(0, 100);
      cloudSet('notifications', notifications);
      return { ...s, notifications };
    });
  }, []);

  const markNotifRead = useCallback((id: string) => {
    setState(s => ({ ...s, notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
  }, []);

  const markAllRead = useCallback(() => {
    setState(s => ({ ...s, notifications: s.notifications.map(n => ({ ...n, read: true })) }));
  }, []);

  const updateAdSlot = useCallback((id: string, updates: Partial<{ adCode: string; enabled: boolean }>) => {
    setState(s => {
      const adSlots = s.adSlots.map(a => a.id === id ? { ...a, ...updates } : a);
      cloudSet('adSlots', adSlots);
      return { ...s, adSlots };
    });
  }, []);

  const updateSupportWhatsapp = useCallback((num: string) => {
    setState(s => { cloudSet('supportWhatsapp', num); return { ...s, supportWhatsapp: num }; });
  }, []);

  // FIX #12: Community link management
  const updateCommunityLink = useCallback((link: string) => {
    setState(s => { lsSet('kdpl_community_link', link); return { ...s, communityLink: link }; });
  }, []);

  const toggleCommunityLink = useCallback((enabled: boolean) => {
    setState(s => { lsSet('kdpl_community_link_enabled', enabled); return { ...s, communityLinkEnabled: enabled }; });
  }, []);

  const dismissCommunityToast = useCallback(() => {
    setState(s => ({ ...s, communityToastShown: true }));
  }, []);

  const generateFixtures = useCallback(() => {
    setState(s => {
      if (!s.tournament || s.teams.length < 2) return s;
      const teams = [...s.teams]; const newFixtures: Fixture[] = [];
      let matchNum = s.allFixtures.filter(f => f.tournamentId === s.activeTournamentId).length;
      if (s.tournament.format === 'Round-Robin' || s.tournament.format === 'League') {
        const n = teams.length; const rounds = n % 2 === 0 ? n - 1 : n;
        const teamIds = [...teams.map(t => t.id)]; if (teamIds.length % 2 !== 0) teamIds.push('BYE');
        for (let round = 0; round < rounds; round++) {
          for (let i = 0; i < teamIds.length / 2; i++) {
            const home = teamIds[i], away = teamIds[teamIds.length - 1 - i];
            if (home === 'BYE' || away === 'BYE') continue;
            matchNum++;
            newFixtures.push({ id: genId('f'), tournamentId: s.activeTournamentId!, round: round + 1, stage: 'group', matchNumber: matchNum, teamAId: home, teamBId: away, venueId: '', date: '', time: '', slot: 'Day', status: 'scheduled', overs: s.tournament.overs, umpires: [], createdAt: Date.now() });
          }
          const last = teamIds.pop()!; teamIds.splice(1, 0, last);
        }
      }
      const allFixtures = [...s.allFixtures, ...newFixtures];
      lsSet('kdpl_all_fixtures', allFixtures); cloudSet('fixtures', allFixtures);
      return withDerived({ ...s, allFixtures });
    });
  }, []);

  return {
    state, navigate, goBack, setTheme, loginAdmin, logoutAdmin,
    organizerSignUp, organizerLogin, approveOrganizer,
    switchTournament, setActiveFixture, setActiveSeries,
    createTournament, updateTournament, deleteTournament,
    addTeam, updateTeam, deleteTeam,
    addPlayer, updatePlayer, deletePlayer,
    addVenue, updateVenue, deleteVenue,
    addFixture, updateFixture, deleteFixture,
    createSeries, updateLiveMatch, clearLiveMatch, startLiveMatch,
    recordBall, undoBall, selectOpeners, selectNextBatter, selectNextBowler,
    addNotification, markNotifRead, markAllRead,
    updateAdSlot, updateSupportWhatsapp,
    updateCommunityLink, toggleCommunityLink, dismissCommunityToast,
    generateFixtures,
  };
}

export type KDPLStore = ReturnType<typeof useKDPLStore>;
