interface Props {
  soundOn: boolean;
  dollars: boolean;
  /** Poker-only strategy trainer — omit to hide the pill. */
  trainer?: boolean;
  onToggleSound: () => void;
  onToggleDollars: () => void;
  onToggleTrainer?: () => void;
}

function TogglePill({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
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
}: Props) {
  return (
    <footer className="statusbar">
      <div className="pill-group">
        <TogglePill label="Sound" on={soundOn} onClick={onToggleSound} />
        {onToggleTrainer && (
          <TogglePill label="Trainer" on={trainer ?? false} onClick={onToggleTrainer} />
        )}
        <TogglePill label="Dollars" on={dollars} onClick={onToggleDollars} />
      </div>
    </footer>
  );
}
