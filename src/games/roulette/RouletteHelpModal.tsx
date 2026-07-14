interface Props {
  onClose: () => void;
}

export function RouletteHelpModal({ onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal howto-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>How to Play</h2>
        <p className="modal-sub">European roulette — one zero, 37 pockets</p>

        <h3>A spin</h3>
        <ol className="howto-steps">
          <li>
            Pick a <strong>chip value</strong>, then click anywhere on the board to place it —
            numbers, colors, dozens, columns. Stack as many bets as you like.
          </li>
          <li>
            Press <strong>SPIN</strong>. The ball lands on 0–36 and every bet covering that
            number pays out.
          </li>
          <li>
            <strong>Rebet</strong> puts your previous bets back on the board with one click.
          </li>
        </ol>

        <h3>Payouts</h3>
        <div className="howto-hands">
          <div className="howto-hand">
            <span className="hh-name">Straight up</span>
            <span className="hh-desc">A single number, including 0</span>
            <span className="hh-pays">pays 35:1</span>
          </div>
          <div className="howto-hand">
            <span className="hh-name">Dozen / Column</span>
            <span className="hh-desc">Twelve numbers at once</span>
            <span className="hh-pays">pays 2:1</span>
          </div>
          <div className="howto-hand">
            <span className="hh-name">Even money</span>
            <span className="hh-desc">Red/Black, Even/Odd, 1–18/19–36</span>
            <span className="hh-pays">pays 1:1</span>
          </div>
        </div>
        <p className="howto-note">
          Zero is green and beats every outside bet — that's the whole house edge (2.7%). Each
          spin comes from a cryptographic RNG; every pocket is exactly equally likely.
        </p>

        <button type="button" className="modal-link howto-link" onClick={onClose}>
          Got it — let's play
        </button>
      </div>
    </div>
  );
}
