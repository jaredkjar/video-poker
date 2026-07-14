import { useRef, useState, type ReactNode } from 'react';
import { HISTORY_MAX } from '../../game/stats';
import * as sounds from '../../game/sounds';
import { useCountUp } from '../../hooks/useCountUp';
import type { Profiles } from '../../hooks/useProfiles';
import { Marquee } from '../../components/Marquee';
import { StatusBar } from '../../components/StatusBar';
import { WinOverlay, type Celebration } from '../../components/WinOverlay';
import { colorOf, DOUBLE_ZERO, numberLabel, resolveBets, spinWheel, type Bets } from './engine';
import { RouletteWheel, SPIN_MS } from './RouletteWheel';

const CHIP_VALUES = [1, 5, 10, 25];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const sumBets = (bets: Bets) => Object.values(bets).reduce((a, b) => a + b, 0);

interface Props {
  profiles: Profiles;
  topbar: ReactNode;
  fmt: (amount: number) => string;
  onAddCredits: () => void;
}

export function RouletteGame({ profiles, topbar, fmt, onAddCredits }: Props) {
  const { credits, setCredits, dollars, rouletteHistory, setRouletteHistory } = profiles;

  const [bets, setBets] = useState<Bets>({});
  const [chip, setChip] = useState(5);
  const [spinning, setSpinning] = useState(false);
  const [wheelTarget, setWheelTarget] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState(0);
  const [message, setMessage] = useState('Place your bets, then press SPIN');
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const undoStack = useRef<{ id: string; amount: number }[]>([]);
  const lastBets = useRef<Bets | null>(null);
  const celebrationTimer = useRef<number | null>(null);
  const creditsDisplay = useCountUp(credits);

  const staked = sumBets(bets);

  const placeBet = (id: string) => {
    if (spinning) return;
    if (staked + chip > credits) {
      setMessage('Not enough credits for that chip — add credits or spin');
      return;
    }
    setBets((b) => ({ ...b, [id]: (b[id] ?? 0) + chip }));
    undoStack.current.push({ id, amount: chip });
    sounds.holdClick();
  };

  const undo = () => {
    if (spinning) return;
    const last = undoStack.current.pop();
    if (!last) return;
    setBets((b) => {
      const next = { ...b, [last.id]: (b[last.id] ?? 0) - last.amount };
      if (next[last.id] <= 0) delete next[last.id];
      return next;
    });
    sounds.blip();
  };

  const clearBets = () => {
    if (spinning) return;
    setBets({});
    undoStack.current = [];
    sounds.blip();
  };

  const rebet = () => {
    if (spinning || !lastBets.current) return;
    const total = sumBets(lastBets.current);
    if (total > credits) {
      setMessage('Not enough credits to repeat your last bets');
      return;
    }
    setBets(lastBets.current);
    undoStack.current = Object.entries(lastBets.current).map(([id, amount]) => ({ id, amount }));
    sounds.blip();
  };

  const spin = async () => {
    if (spinning || staked === 0) return;
    setSpinning(true);
    setCredits((c) => c - staked);
    setWin(0);
    setResult(null);
    setMessage('No more bets…');
    if (celebrationTimer.current !== null) clearTimeout(celebrationTimer.current);
    setCelebration(null);

    const final = spinWheel();
    setWheelTarget(final);

    // Tick along with the decelerating wheel, then let it rest a beat
    const spinDone = sleep(SPIN_MS + 650);
    for (let i = 0; i < 24; i++) {
      sounds.blip();
      await sleep(55 + i * i * 0.5);
    }
    await spinDone;
    setWheelTarget(null);
    setResult(final);
    sounds.dealTick(2);
    await sleep(300);

    const returned = resolveBets(bets, final);
    if (returned > 0) setCredits((c) => c + returned);
    setWin(returned);

    profiles.setRouletteStats((s) => ({
      spins: s.spins + 1,
      wins: s.wins + (returned > 0 ? 1 : 0),
      wagered: s.wagered + staked,
      won: s.won + returned,
      biggestWin: Math.max(s.biggestWin, returned),
    }));

    const label = `${numberLabel(final)} ${colorOf(final)}`;
    if (returned > 0) {
      sounds.win(returned / staked >= 10 ? 25 : returned > staked ? 6 : 2);
      setMessage(`${label} — you win ${fmt(returned)}!`);
      if (returned / staked >= 10) {
        sounds.jackpot();
        setCelebration({ name: label.toUpperCase(), amount: fmt(returned), tier: 'big' });
        celebrationTimer.current = window.setTimeout(() => setCelebration(null), 4000);
      }
    } else {
      sounds.lose();
      setMessage(`${label} — no win this time`);
    }

    setRouletteHistory((h) => [final, ...h].slice(0, HISTORY_MAX));
    lastBets.current = bets;
    setBets({});
    undoStack.current = [];
    setSpinning(false);
  };

  const chipOn = (id: string) =>
    bets[id] ? <span className="rb-chip">{bets[id]}</span> : null;

  const numCell = (n: number) => (
    <button
      key={n}
      type="button"
      className={`rb-cell rb-num ${colorOf(n)}${result === n ? ' hit' : ''}`}
      onClick={() => placeBet(`n${n}`)}
      aria-label={`Bet on ${n}`}
    >
      {n}
      {chipOn(`n${n}`)}
    </button>
  );

  const outCell = (id: string, label: ReactNode, extraClass = '') => (
    <button
      type="button"
      className={`rb-cell rb-out ${id} ${extraClass}`.trim()}
      onClick={() => placeBet(id)}
    >
      {label}
      {chipOn(id)}
    </button>
  );

  return (
    <main className="machine roulette">
      <div className="topbar">{topbar}</div>

      <Marquee title="Roulette" tagline="American wheel · 0 and 00" />

      <div className="message-area">
        <div className={`message${win > 0 ? ' win' : ''}`}>{message || ' '}</div>
      </div>

      <div className="rl-history" aria-label="Previous spins">
        <span className="rl-history-label">Last spins</span>
        {rouletteHistory.length === 0 ? (
          <span className="rl-history-empty">no spins yet</span>
        ) : (
          rouletteHistory.map((n, i) => (
            <span key={i} className={`hist-chip ${colorOf(n)}${i === 0 ? ' latest' : ''}`}>
              {numberLabel(n)}
            </span>
          ))
        )}
      </div>

      <div className="rl-board">
        <div className="rb-zeros">
          <button
            type="button"
            className={`rb-cell rb-zero green${result === DOUBLE_ZERO ? ' hit' : ''}`}
            onClick={() => placeBet(`n${DOUBLE_ZERO}`)}
          >
            00{chipOn(`n${DOUBLE_ZERO}`)}
          </button>
          <button
            type="button"
            className={`rb-cell rb-zero green${result === 0 ? ' hit' : ''}`}
            onClick={() => placeBet('n0')}
          >
            0{chipOn('n0')}
          </button>
        </div>
        {/* Number grid: top row 3,6..36; middle 2,5..35; bottom 1,4..34 */}
        <div className="rb-nums">
          {[0, 1, 2].map((row) => (
            <div key={row} className="rb-numrow">
              {Array.from({ length: 12 }, (_, c) => numCell((c + 1) * 3 - row))}
            </div>
          ))}
        </div>
        <div className="rb-colbets">
          {outCell('c3', '2:1')}
          {outCell('c2', '2:1')}
          {outCell('c1', '2:1')}
        </div>
        <div className="rb-dozens">
          {outCell('d1', '1st 12')}
          {outCell('d2', '2nd 12')}
          {outCell('d3', '3rd 12')}
        </div>
        <div className="rb-evens">
          {outCell('low', '1–18')}
          {outCell('even', 'Even')}
          {outCell('red', '', 'red-diamond')}
          {outCell('black', '', 'black-diamond')}
          {outCell('odd', 'Odd')}
          {outCell('high', '19–36')}
        </div>
      </div>

      <div className="console">
        <div className="displays">
          <div
            className="display clickable"
            title={dollars ? 'Show credits' : 'Show dollars'}
            onClick={() => profiles.setDollars((d) => !d)}
          >
            <label>{dollars ? 'Balance' : 'Credits'}</label>
            <strong className="amber">{fmt(creditsDisplay)}</strong>
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
            <strong className="amber">{fmt(staked)}</strong>
          </div>
          <div className="display">
            <label>Win</label>
            <strong className="green">{fmt(win)}</strong>
          </div>
        </div>

        <div className="buttons rl-actions">
          <div className="chip-row" role="radiogroup" aria-label="Chip value">
            {CHIP_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                className={`chip-btn${chip === v ? ' selected' : ''}${dollars ? ' small' : ''}`}
                aria-pressed={chip === v}
                onClick={() => {
                  setChip(v);
                  sounds.blip();
                }}
              >
                {fmt(v)}
              </button>
            ))}
          </div>
          <button type="button" disabled={spinning || staked === 0} onClick={undo}>
            Undo
          </button>
          <button type="button" disabled={spinning || staked === 0} onClick={clearBets}>
            Clear
          </button>
          <button
            type="button"
            disabled={spinning || staked > 0 || !lastBets.current}
            onClick={rebet}
          >
            Rebet
          </button>
          <button
            type="button"
            className="primary"
            disabled={spinning || staked === 0}
            onClick={() => void spin()}
          >
            SPIN
          </button>
        </div>
      </div>

      <StatusBar
        soundOn={profiles.soundOn}
        dollars={dollars}
        onToggleSound={() => profiles.setSoundOn((v) => !v)}
        onToggleDollars={() => profiles.setDollars((v) => !v)}
      />

      <p className="disclaimer">
        For entertainment &amp; practice only — play money, no real wagering. American
        double-zero wheel driven by a cryptographic RNG; straight-up pays 35:1, dozens and
        columns 2:1, even-money bets 1:1.
      </p>

      {wheelTarget !== null && <RouletteWheel target={wheelTarget} />}
      {celebration && <WinOverlay {...celebration} />}
    </main>
  );
}
