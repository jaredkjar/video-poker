import { useEffect, useState, type CSSProperties } from 'react';
import { Marquee } from './Marquee';

const COUNTER = 'https://abacus.jasoncameron.dev';
const COUNTER_KEY = 'jacksorbetter.dev/visits';

// One increment per page load — signing out remounts this screen, and dev
// StrictMode runs effects twice, so the flag lives at module scope.
let counted = false;

/**
 * Site-wide visit total from the Abacus counter service. Only the live
 * domain increments; localhost/dev just reads the current value. Stays
 * null (and the label stays hidden) if the service is unreachable.
 */
function useVisitCount() {
  const [visits, setVisits] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const increment = location.hostname === 'jacksorbetter.dev' && !counted;
    counted = true;
    fetch(`${COUNTER}/${increment ? 'hit' : 'get'}/${COUNTER_KEY}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.value === 'number' && data.value > 0)
          setVisits(data.value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return visits;
}

export interface ProfileSummary {
  name: string;
  /** e.g. "1,234 credits · $308.50" */
  balanceLabel: string;
}

interface Props {
  users: ProfileSummary[];
  onLogin: (name: string) => void;
  onGuest: () => void;
  onDelete: (name: string) => void;
  onSettings: () => void;
  onHowTo: () => void;
}

const FAN_CARDS = [
  { label: '10', rot: -32 },
  { label: 'J', rot: -16 },
  { label: 'Q', rot: 0 },
  { label: 'K', rot: 16 },
  { label: 'A', rot: 32 },
];

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
    </svg>
  );
}

export function LoginScreen({ users, onLogin, onGuest, onDelete, onSettings, onHowTo }: Props) {
  const [name, setName] = useState('');
  const visits = useVisitCount();
  const trimmed = name.trim();
  const existing = trimmed
    ? users.find((u) => u.name.toLowerCase() === trimmed.toLowerCase())
    : undefined;

  return (
    <main className="machine login">
      <button
        type="button"
        className="corner-gear"
        title="Settings"
        aria-label="Settings"
        onClick={onSettings}
      >
        <GearIcon />
      </button>

      <Marquee />

      <div className="fan" aria-hidden="true">
        {FAN_CARDS.map((c) => (
          <div
            key={c.label}
            className="fan-card"
            style={{ '--rot': `${c.rot}deg` } as CSSProperties}
          >
            <div className="fc-corner">
              <span>{c.label}</span>
              <span>♥</span>
            </div>
            <div className="fc-pip">♥</div>
            <div className="fc-corner br">
              <span>{c.label}</span>
              <span>♥</span>
            </div>
          </div>
        ))}
      </div>

      <div className="login-panel">
        <h2>{users.length > 0 ? "Who's playing?" : 'Create your player'}</h2>

        {users.length > 0 && (
          <div className="profiles">
            {users.map((u) => (
              <div className="profile-row" key={u.name}>
                <button type="button" className="profile-btn" onClick={() => onLogin(u.name)}>
                  <span className="avatar">{u.name[0].toUpperCase()}</span>
                  <span className="profile-info">
                    <span className="profile-name">{u.name}</span>
                    <span className="profile-balance">{u.balanceLabel}</span>
                  </span>
                  <span className="profile-go" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </span>
                </button>
                <button
                  type="button"
                  className="profile-del"
                  title={`Delete profile "${u.name}"`}
                  aria-label={`Delete profile ${u.name}`}
                  onClick={() => onDelete(u.name)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="new-profile"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onLogin(trimmed);
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={users.length > 0 ? 'New player name' : 'Your name'}
            maxLength={20}
            autoFocus={users.length === 0}
          />
          <button type="submit" disabled={!trimmed}>
            {existing ? 'Sign in' : users.length > 0 ? 'Create' : "Let's play"}
          </button>
        </form>
        {existing && (
          <p className="existing-note">
            "{existing.name}" already exists — this signs in to that player's profile.
          </p>
        )}

        <div className="login-divider">or</div>

        <button type="button" className="guest-btn" onClick={onGuest}>
          Play as Guest
        </button>
        <p className="guest-note">Guest credits and stats aren't saved.</p>

        <button type="button" className="modal-link howto-link" onClick={onHowTo}>
          New to video poker? How to play
        </button>

        <p className="login-foot">
          For entertainment &amp; practice only — play money, no cash value.
          {visits !== null && (
            <>
              {' '}
              · {visits.toLocaleString()} visit{visits === 1 ? '' : 's'}
            </>
          )}
        </p>
      </div>
    </main>
  );
}
