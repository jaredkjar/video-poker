// Per-player profiles and stats, persisted in localStorage.

import { isTextSizeId, isThemeId, loadPrefs, type TextSizeId, type ThemeId } from './prefs';

export interface Stats {
  hands: number;
  handsWon: number;
  wagered: number;
  won: number;
  biggestWin: number;
  /** Hands where the player's hold matched the computed optimal hold */
  perfectHolds: number;
  /** Hands where the optimal hold was known in time to compare */
  holdsEvaluated: number;
  /** Count of winning hands by paytable rank (index matches HAND_NAMES) */
  handCounts: number[];
}

export interface SaveData {
  credits: number;
  bet: number;
  sound: boolean;
  dollars: boolean;
  denom: number;
  trainer: boolean;
  theme: ThemeId;
  textSize: TextSizeId;
  stats: Stats;
}

export interface Registry {
  names: string[];
  last: string | null;
}

const USERS_KEY = 'video-poker-users-v1';
const LEGACY_KEY = 'video-poker-save-v1';
const userKey = (name: string) => `video-poker-user-${name.toLowerCase()}`;

export function emptyStats(): Stats {
  return {
    hands: 0,
    handsWon: 0,
    wagered: 0,
    won: 0,
    biggestWin: 0,
    perfectHolds: 0,
    holdsEvaluated: 0,
    handCounts: Array(9).fill(0),
  };
}

function normalizeStats(s?: Partial<Stats>): Stats {
  const base = emptyStats();
  if (!s) return base;
  return {
    ...base,
    ...s,
    handCounts:
      Array.isArray(s.handCounts) && s.handCounts.length === 9 ? s.handCounts : base.handCounts,
  };
}

export function defaultSave(): SaveData {
  // New profiles (and guests) inherit the device's current look so signing
  // up doesn't visibly change the table out from under you.
  const prefs = loadPrefs();
  return {
    credits: 200,
    bet: 1,
    sound: true,
    dollars: false,
    denom: 0.25,
    trainer: false,
    theme: prefs.theme,
    textSize: prefs.textSize,
    stats: emptyStats(),
  };
}

export function loadRegistry(): Registry {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const r = JSON.parse(raw) as Partial<Registry>;
      if (Array.isArray(r.names)) {
        // Drop blanks and case-insensitive duplicates — profiles that differ
        // only by case share one storage key, so duplicate registry entries
        // would render twice and delete each other's data.
        const names: string[] = [];
        const seen = new Set<string>();
        for (const n of r.names) {
          if (typeof n !== 'string') continue;
          const trimmed = n.trim();
          if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
          seen.add(trimmed.toLowerCase());
          names.push(trimmed);
        }
        return { names, last: typeof r.last === 'string' ? r.last : null };
      }
    }
  } catch {
    // corrupted registry — start fresh
  }
  return { names: [], last: null };
}

export function saveRegistry(reg: Registry): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(reg));
}

export function loadProfile(name: string): SaveData {
  try {
    const raw = localStorage.getItem(userKey(name));
    if (raw) {
      const p = JSON.parse(raw) as Partial<SaveData>;
      const base = defaultSave();
      return {
        ...base,
        ...p,
        theme: isThemeId(p.theme) ? p.theme : base.theme,
        textSize: isTextSizeId(p.textSize) ? p.textSize : base.textSize,
        trainer: typeof p.trainer === 'boolean' ? p.trainer : base.trainer,
        stats: normalizeStats(p.stats),
      };
    }
  } catch {
    // corrupted profile — fall through to defaults
  }
  // First login for this profile: inherit the pre-profiles save if one exists,
  // so credits/stats from before the login feature carry over (once).
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const p = JSON.parse(legacy) as Partial<SaveData>;
      localStorage.removeItem(LEGACY_KEY);
      return { ...defaultSave(), ...p, stats: normalizeStats(p.stats) };
    }
  } catch {
    // ignore bad legacy data
  }
  return defaultSave();
}

export function saveProfile(name: string, data: SaveData): void {
  localStorage.setItem(userKey(name), JSON.stringify(data));
}

export function deleteProfileData(name: string): void {
  localStorage.removeItem(userKey(name));
}
