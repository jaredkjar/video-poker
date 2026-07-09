import { useEffect, useState } from 'react';
import { loadPrefs, savePrefs } from '../game/prefs';

/** Display preferences (theme, text size) applied to the document and persisted. */
export function usePrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.textsize = prefs.textSize;
    savePrefs(prefs);
  }, [prefs]);
  return [prefs, setPrefs] as const;
}
