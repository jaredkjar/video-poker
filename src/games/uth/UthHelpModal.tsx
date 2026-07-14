interface Props {
  onClose: () => void;
}

export function UthHelpModal({ onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal howto-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>How to Play</h2>
        <p className="modal-sub">Ultimate Texas Hold'em — you and the dealer, best five of seven</p>

        <h3>A hand</h3>
        <ol className="howto-steps">
          <li>
            Place equal <strong>Ante</strong> and <strong>Blind</strong> bets (one click on the
            Ante spot covers both), plus an optional <strong>Trips</strong> side bet.
          </li>
          <li>
            You and the dealer each get two hole cards. The earlier you raise, the more you can
            bet: <strong>3× or 4×</strong> your ante before the flop, <strong>2×</strong> after
            the flop, or <strong>1×</strong> once all five board cards are out. You raise once
            per hand — after that the cards just run out.
          </li>
          <li>
            If you never raised, the last decision is <strong>bet 1× or fold</strong> (folding
            forfeits ante, blind, and trips).
          </li>
          <li>
            Best five-card hand from your seven wins. The dealer needs <strong>a pair or
            better</strong> to "qualify" — if they can't, your ante is returned no matter what.
          </li>
        </ol>

        <h3>Payouts</h3>
        <div className="howto-hands">
          <div className="howto-hand">
            <span className="hh-name">Play &amp; Ante</span>
            <span className="hh-desc">Beat the dealer (ante needs a qualified dealer)</span>
            <span className="hh-pays">pays 1:1</span>
          </div>
          <div className="howto-hand">
            <span className="hh-name">Blind</span>
            <span className="hh-desc">
              Win with a straight or better: 1:1 up to 500:1 for a royal — otherwise it pushes
            </span>
            <span className="hh-pays">up to 500:1</span>
          </div>
          <div className="howto-hand">
            <span className="hh-name">Trips</span>
            <span className="hh-desc">
              Your hand makes trips or better, win or lose: 3:1 up to 50:1
            </span>
            <span className="hh-pays">up to 50:1</span>
          </div>
        </div>
        <p className="howto-note">
          Blind table: royal 500:1, straight flush 50:1, quads 10:1, full house 3:1, flush 3:2,
          straight 1:1. Trips table: trips 3:1, straight 4:1, flush 7:1, full house 8:1, quads
          30:1, straight flush 40:1, royal 50:1. Ties push everything.
        </p>

        <button type="button" className="modal-link howto-link" onClick={onClose}>
          Got it — let's play
        </button>
      </div>
    </div>
  );
}
