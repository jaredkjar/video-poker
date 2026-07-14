interface Props {
  onClose: () => void;
}

export function BlackjackHelpModal({ onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal howto-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>How to Play</h2>
        <p className="modal-sub">Blackjack — beat the dealer without going over 21</p>

        <h3>A round</h3>
        <ol className="howto-steps">
          <li>
            <strong>Bet</strong> — add chips to set your wager, then press <strong>DEAL</strong>.
          </li>
          <li>
            You get two cards face up; the dealer gets one up and one face down. Number cards
            count face value, <strong>J / Q / K count 10</strong>, and an{' '}
            <strong>ace counts 11 or 1</strong> — whichever helps.
          </li>
          <li>
            <strong>Hit</strong> to take another card, <strong>Stand</strong> to keep your total,
            or <strong>Double</strong> on your first two cards to double the bet and take exactly
            one more card.
          </li>
          <li>
            Go over 21 and you <strong>bust</strong> — the bet is lost. Otherwise the dealer
            reveals the hole card and hits until reaching 17 (stands on all 17s).
          </li>
          <li>Closest to 21 wins. A tie is a push and your bet comes back.</li>
        </ol>

        <h3>Payouts</h3>
        <div className="howto-hands">
          <div className="howto-hand">
            <span className="hh-name">Blackjack</span>
            <span className="hh-desc">Ace + ten-value card on the deal</span>
            <span className="hh-pays">pays 3:2</span>
          </div>
          <div className="howto-hand">
            <span className="hh-name">Win</span>
            <span className="hh-desc">Beat the dealer's total, or dealer busts</span>
            <span className="hh-pays">pays 1:1</span>
          </div>
          <div className="howto-hand">
            <span className="hh-name">Push</span>
            <span className="hh-desc">Same total as the dealer</span>
            <span className="hh-pays">bet returned</span>
          </div>
        </div>
        <p className="howto-note">
          Single deck, shuffled with a cryptographic RNG before every hand. No splits or
          insurance at this table.
        </p>

        <button type="button" className="modal-link howto-link" onClick={onClose}>
          Got it — let's play
        </button>
      </div>
    </div>
  );
}
