interface Props {
  onClose: () => void;
}

const HANDS: { name: string; desc: string; pays: string }[] = [
  { name: 'Royal Flush', desc: '10-J-Q-K-A, all one suit', pays: '250 / 4,000*' },
  { name: 'Straight Flush', desc: 'Five in a row, one suit', pays: '50' },
  { name: 'Four of a Kind', desc: 'All four of one rank', pays: '25' },
  { name: 'Full House', desc: 'Three of a kind plus a pair', pays: '9' },
  { name: 'Flush', desc: 'Any five of one suit', pays: '6' },
  { name: 'Straight', desc: 'Five in a row, mixed suits', pays: '4' },
  { name: 'Three of a Kind', desc: 'Three of one rank', pays: '3' },
  { name: 'Two Pair', desc: 'Two different pairs', pays: '2' },
  { name: 'Jacks or Better', desc: 'A pair of jacks, queens, kings, or aces', pays: '1' },
];

export function HowToPlayModal({ onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal howto-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>How to Play</h2>
        <p className="modal-sub">
          Jacks or Better is five-card draw poker against a paytable — no dealer, no bluffing.
          Land a pair of jacks or anything better and you get paid.
        </p>

        <h3>Each hand</h3>
        <ol className="howto-steps">
          <li>
            <strong>Bet</strong> — Bet One cycles your wager from 1 to 5 credits; Bet Max wagers
            5 and deals immediately.
          </li>
          <li>
            <strong>Deal</strong> — you're dealt five cards.
          </li>
          <li>
            <strong>Hold</strong> — click (or press 1–5) to keep the cards you want.
          </li>
          <li>
            <strong>Draw</strong> — everything you didn't hold is replaced. Your final hand is
            paid per the table below.
          </li>
        </ol>

        <h3>Winning hands</h3>
        <div className="howto-hands">
          {HANDS.map((h) => (
            <div className="howto-hand" key={h.name}>
              <span className="hh-name">{h.name}</span>
              <span className="hh-desc">{h.desc}</span>
              <span className="hh-pays">{h.pays}</span>
            </div>
          ))}
        </div>
        <p className="howto-note">
          Payouts are per credit bet — the highlighted paytable column matches your current bet.
          *The royal pays 4,000 only at max bet (5 credits).
        </p>

        <h3>Strategy tips</h3>
        <ul className="howto-tips">
          <li>Bet max if you're chasing the royal — 4,000 beats 5×250 by a mile.</li>
          <li>Keep any paying pair (jacks or better) over almost everything else.</li>
          <li>A low pair beats holding two high cards or chasing most straights.</li>
          <li>Never hold a "kicker" — a lone high card next to a pair adds nothing.</li>
          <li>
            Not sure? Press <strong>Hint</strong> for the mathematically best hold, or turn on
            <strong> Trainer</strong> to get graded after every hand. Played perfectly, this
            game returns 99.54%.
          </li>
        </ul>

        <h3>Keyboard</h3>
        <p className="howto-keys">
          <kbd>1</kbd>–<kbd>5</kbd> hold · <kbd>Space</kbd>/<kbd>Enter</kbd> deal &amp; draw ·{' '}
          <kbd>H</kbd> hint
        </p>
      </div>
    </div>
  );
}
