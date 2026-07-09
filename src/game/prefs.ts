// Device-level display preferences (shared across player profiles).

export type ThemeId = 'emerald' | 'midnight' | 'ruby' | 'amethyst';
export type TextSizeId = 'md' | 'lg' | 'xl';

export interface Prefs {
  theme: ThemeId;
  textSize: TextSizeId;
}

const PREFS_KEY = 'video-poker-prefs-v1';
const THEME_IDS: ThemeId[] = ['emerald', 'midnight', 'ruby', 'amethyst'];
const SIZE_IDS: TextSizeId[] = ['md', 'lg', 'xl'];

export const DEFAULT_PREFS: Prefs = { theme: 'emerald', textSize: 'md' };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      return {
        theme: THEME_IDS.includes(p.theme as ThemeId) ? (p.theme as ThemeId) : DEFAULT_PREFS.theme,
        textSize: SIZE_IDS.includes(p.textSize as TextSizeId)
          ? (p.textSize as TextSizeId)
          : DEFAULT_PREFS.textSize,
      };
    }
  } catch {
    // corrupted prefs — fall back to defaults
  }
  return DEFAULT_PREFS;
}

export function savePrefs(prefs: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
