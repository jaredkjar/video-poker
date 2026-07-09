interface Props {
  soundOn: boolean;
  trainer: boolean;
  dollars: boolean;
  onToggleSound: () => void;
  onToggleTrainer: () => void;
  onToggleDollars: () => void;
  statsSummary?: string;
  userLabel: string;
  isGuest: boolean;
  onStats: () => void;
  onSettings: () => void;
  onFeedback: () => void;
  onSignOut: () => void;
}

function TogglePill({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pill toggle-pill${on ? ' on' : ''}`}
      aria-pressed={on}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function StatusBar({
  soundOn,
  trainer,
  dollars,
  onToggleSound,
  onToggleTrainer,
  onToggleDollars,
  statsSummary,
  userLabel,
  isGuest,
  onStats,
  onSettings,
  onFeedback,
  onSignOut,
}: Props) {
  return (
    <footer className="statusbar">
      <div className="pill-group">
        <TogglePill label="Sound" on={soundOn} onClick={onToggleSound} />
        <TogglePill label="Trainer" on={trainer} onClick={onToggleTrainer} />
        <TogglePill label="Dollars" on={dollars} onClick={onToggleDollars} />
      </div>
      <div className="pill-group">
        <button type="button" className="pill" title={statsSummary} onClick={onStats}>
          Stats
        </button>
        <button type="button" className="pill" onClick={onSettings}>
          ⚙ Settings
        </button>
        <button type="button" className="pill" onClick={onFeedback}>
          Feedback
        </button>
        <button type="button" className="pill" onClick={onSignOut}>
          <span className="pill-user">{userLabel}</span>
          {isGuest ? ' · Sign in' : ' · Sign out'}
        </button>
      </div>
    </footer>
  );
}
