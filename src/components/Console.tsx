interface Props {
  balanceLabel: string;
  betLabel: string;
  winLabel: string;
  dollars: boolean;
  phase: 'idle' | 'holding';
  busy: boolean;
  onToggleDollars: () => void;
  onAddCredits: () => void;
  onBetOne: () => void;
  onBetMax: () => void;
  onHint: () => void;
  onPrimary: () => void;
}

/** The credit/bet/win displays and the main action buttons. */
export function Console({
  balanceLabel,
  betLabel,
  winLabel,
  dollars,
  phase,
  busy,
  onToggleDollars,
  onAddCredits,
  onBetOne,
  onBetMax,
  onHint,
  onPrimary,
}: Props) {
  return (
    <div className="console">
      <div className="displays">
        <div
          className="display clickable"
          title={dollars ? 'Show credits' : 'Show dollars'}
          onClick={onToggleDollars}
        >
          <label>{dollars ? 'Balance' : 'Credits'}</label>
          <strong className="amber">{balanceLabel}</strong>
          <button
            type="button"
            className="add-btn"
            title="Add credits"
            onClick={(e) => {
              e.stopPropagation();
              onAddCredits();
            }}
          >
            +
          </button>
        </div>
        <div className="display">
          <label>Bet</label>
          <strong className="amber">{betLabel}</strong>
        </div>
        <div className="display">
          <label>Win</label>
          <strong className="green">{winLabel}</strong>
        </div>
      </div>
      <div className="buttons">
        <button type="button" disabled={busy || phase === 'holding'} onClick={onBetOne}>
          Bet One
        </button>
        <button type="button" disabled={busy || phase === 'holding'} onClick={onBetMax}>
          Bet Max
        </button>
        <button type="button" disabled={busy || phase !== 'holding'} onClick={onHint}>
          Hint
        </button>
        <button type="button" className="primary" disabled={busy} onClick={onPrimary}>
          {phase === 'holding' ? 'DRAW' : 'DEAL'}
        </button>
      </div>
    </div>
  );
}
