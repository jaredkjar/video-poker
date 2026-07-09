import type { Prefs, TextSizeId, ThemeId } from '../game/prefs';

interface Props {
  prefs: Prefs;
  denom: number;
  onPrefs: (prefs: Prefs) => void;
  onDenom: (denom: number) => void;
  onClose: () => void;
}

const THEMES: { id: ThemeId; name: string; swatch: string }[] = [
  { id: 'emerald', name: 'Emerald', swatch: '#2b4a3c' },
  { id: 'midnight', name: 'Midnight', swatch: '#31436b' },
  { id: 'ruby', name: 'Ruby', swatch: '#6b3247' },
  { id: 'amethyst', name: 'Amethyst', swatch: '#4d3579' },
];

const SIZES: { id: TextSizeId; label: string }[] = [
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Large' },
  { id: 'xl', label: 'Extra large' },
];

export function SettingsModal({ prefs, denom, onPrefs, onDenom, onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Settings</h2>

        <h3>Table theme</h3>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-option${prefs.theme === t.id ? ' selected' : ''}`}
              onClick={() => onPrefs({ ...prefs, theme: t.id })}
            >
              <span className="theme-swatch" style={{ background: t.swatch }} />
              {t.name}
            </button>
          ))}
        </div>

        <h3>Text size</h3>
        <div className="size-row">
          {SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`size-option${prefs.textSize === s.id ? ' selected' : ''}`}
              onClick={() => onPrefs({ ...prefs, textSize: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>

        <h3>Denomination</h3>
        <div className="size-row">
          {[
            { value: 0.25, label: '25¢' },
            { value: 0.5, label: '50¢' },
            { value: 1, label: '$1' },
          ].map((d) => (
            <button
              key={d.value}
              type="button"
              className={`size-option${denom === d.value ? ' selected' : ''}`}
              onClick={() => onDenom(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="modal-sub settings-note">
          Denomination applies when displays are switched to dollars.
        </p>
      </div>
    </div>
  );
}
