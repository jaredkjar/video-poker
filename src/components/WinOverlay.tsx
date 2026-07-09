export interface Celebration {
  name: string;
  amount: string;
  tier: 'nice' | 'big';
}

/** Celebratory flourish over the table for a notable win. Non-interactive. */
export function WinOverlay({ name, amount, tier }: Celebration) {
  return (
    <div className={`win-overlay ${tier}`} aria-hidden="true">
      <div className="win-burst">
        {tier === 'big' && <div className="win-tag">BIG WIN</div>}
        <div className="win-hand">{name}</div>
        <div className="win-amount">+{amount}</div>
      </div>
    </div>
  );
}
