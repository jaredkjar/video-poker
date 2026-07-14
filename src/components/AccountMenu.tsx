import { useState } from 'react';
import { ChevronDownIcon } from './icons';

interface Props {
  userLabel: string;
  isGuest: boolean;
  statsSummary?: string;
  onStats: () => void;
  /** Game-specific help — omit on screens with no game (the lobby). */
  onHowTo?: () => void;
  onFeedback: () => void;
  onSignOut: () => void;
}

/** Top-right account control: shows who's playing and opens the app menu. */
export function AccountMenu({
  userLabel,
  isGuest,
  statsSummary,
  onStats,
  onHowTo,
  onFeedback,
  onSignOut,
}: Props) {
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="account">
      <button
        type="button"
        className="account-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="account-avatar">{userLabel[0]?.toUpperCase()}</span>
        <span className="account-name">{userLabel}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="account-menu" role="menu">
            <div className="account-menu-head">
              <span className="account-menu-name">{userLabel}</span>
              {statsSummary && <span className="account-menu-sub">{statsSummary}</span>}
            </div>
            <button type="button" role="menuitem" onClick={run(onStats)}>
              Statistics
            </button>
            {onHowTo && (
              <button type="button" role="menuitem" onClick={run(onHowTo)}>
                How to play
              </button>
            )}
            <button type="button" role="menuitem" onClick={run(onFeedback)}>
              Send feedback
            </button>
            <div className="menu-sep" />
            <button type="button" role="menuitem" className="menu-danger" onClick={run(onSignOut)}>
              {isGuest ? 'Sign in' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
