import { useEffect } from 'react';

interface Options {
  /** When false (modal open, signed out), all game keys are ignored. */
  active: boolean;
  onHold: (index: number) => void;
  onPrimary: () => void;
  onHint: () => void;
}

/** 1–5 toggle holds, Space/Enter deals or draws, H shows the hint. */
export function useKeyboardControls(opts: Options) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || !opts.active) return;
      if (e.key >= '1' && e.key <= '5') opts.onHold(Number(e.key) - 1);
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        opts.onPrimary();
      } else if (e.key.toLowerCase() === 'h') opts.onHint();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
}
