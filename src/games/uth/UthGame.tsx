import { useEffect, useRef, useState, type ReactNode } from 'react';
import { chipLabel, chipValues } from '../../game/chips';
import { newDeck, type Card } from '../../game/cards';
import * as sounds from '../../game/sounds';
import { useCountUp } from '../../hooks/useCountUp';
import type { Profiles } from '../../hooks/useProfiles';
import { Marquee } from '../../components/Marquee';
import { CardView } from '../../components/CardView';
import { StatusBar } from '../../components/StatusBar';
import { WinOverlay, type Celebration } from '../../components/WinOverlay';
import { evaluate7, settleRound } from './engine';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'betting' | 'preflop' | 'flop' | 'river' | 'done';

interface Props {
  profiles: Profiles;
  topbar: ReactNode;
  fmt: (amount: number) => string;
  onInsufficient: (betAmount: number) => void;
  onAddCredits: () => void;
  /** Reports whether a wager is currently unresolved. */
  onRoundLive: (live: boolean) => void;
}

export function UthGame({ profiles, topbar, fmt, onInsufficient, onAddCredits, onRoundLive }: Props) {
  const { credits, setCredits, dollars, denom, uthAnte, setUthAnte, uthTrips, setUthTrips } =
    profiles;

  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [community, setCommunity] = useState<Card[]>([]);
  const [communityUp, setCommunityUp] = useState(0);
  const [dealerUp, setDealerUp] = useState(false);
  const [playBet, setPlayBet] = useState(0);
  const [phase, setPhase] = useState<Phase>('betting');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Set your ante, then press DEAL');
  const [win, setWin] = useState(0);
  const [chip, setChip] = useState(5);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const deckRef = useRef<Card[]>([]);
  const busyRef = useRef(false);
  const celebrationTimer = useRef<number | null>(null);
  const creditsDisplay = useCountUp(credits);

  const chipSet = chipValues(dollars, denom);
  useEffect(() => {
    setChip((c) => (chipValues(dollars, denom).includes(c) ? c : chipValues(dollars, denom)[1]));
  }, [dollars, denom]);

  const betting = phase === 'betting' || phase === 'done';
  const roundLive = busy || !betting;
  useEffect(() => {
    onRoundLive(roundLive);
  }, [roundLive, onRoundLive]);
  useEffect(() => () => onRoundLive(false), [onRoundLive]);

  const drawCard = () => deckRef.current.pop()!;
  const staked = uthAnte * 2 + uthTrips + playBet;

  const addToSpot = (target: 'ante' | 'trips') => {
    if (!betting || busyRef.current) return;
    const delta = target === 'ante' ? chip * 2 : chip; // the blind mirrors the ante
    if (uthAnte * 2 + uthTrips + delta > credits) {
      setMessage('Not enough credits for that chip — add credits first');
      return;
    }
    if (target === 'ante') setUthAnte((a) => a + chip);
    else setUthTrips((t) => t + chip);
    sounds.holdClick();
  };

  const clearBets = () => {
    if (!betting || busyRef.current) return;
    setUthAnte(0);
    setUthTrips(0);
    sounds.blip();
  };

  const revealCommunity = async (upTo: number, from: number) => {
    for (let i = from; i < upTo; i++) {
      setCommunityUp(i + 1);
      sounds.dealTick(i);
      await sleep(240);
    }
  };

  const recordHand = (
    wagered: number,
    returned: number,
    outcome: 'win' | 'lose' | 'push' | 'fold',
  ) =>
    profiles.setUthStats((s) => ({
      hands: s.hands + 1,
      wins: s.wins + (outcome === 'win' ? 1 : 0),
      pushes: s.pushes + (outcome === 'push' ? 1 : 0),
      folds: s.folds + (outcome === 'fold' ? 1 : 0),
      wagered: s.wagered + wagered,
      won: s.won + returned,
      biggestWin: Math.max(s.biggestWin, returned),
    }));

  const showdown = async (play: number, player: Card[], dealer: Card[], board: Card[]) => {
    const ante = uthAnte;
    const trips = uthTrips;
    setDealerUp(true);
    sounds.holdClick();
    await sleep(600);

    const p = evaluate7([...player, ...board]);
    const d = evaluate7([...dealer, ...board]);
    const s = settleRound(p, d, ante, play, trips);
    const wagered = ante * 2 + trips + play;

    setWin(s.returned);
    if (s.returned > 0) setCredits((c) => c + s.returned);
    recordHand(wagered, s.returned, s.outcome);

    let msg =
      s.outcome === 'win'
        ? `Your ${p.name} beats the dealer's ${d.name} — you collect ${fmt(s.returned)}`
        : s.outcome === 'push'
          ? `Push — ${p.name} ties the dealer`
          : `Dealer's ${d.name} beats your ${p.name}${s.dealerQualified ? '' : ' (ante pushes)'}`;
    if (trips > 0) {
      msg += s.tripsReturned > 0 ? ` · Trips pays ${fmt(s.tripsReturned - trips)}` : ' · Trips loses';
    }
    setMessage(msg);

    if (s.returned > wagered) {
      sounds.win(s.returned / Math.max(wagered, 1) >= 6 ? 25 : 2);
      if (s.outcome === 'win' && p.category >= 5) {
        const tier = p.category >= 7 || s.blindWinnings >= ante * 10 ? 'big' : 'nice';
        if (tier === 'big') sounds.jackpot();
        setCelebration({ name: p.name, amount: fmt(s.returned), tier });
        if (celebrationTimer.current !== null) clearTimeout(celebrationTimer.current);
        celebrationTimer.current = window.setTimeout(
          () => setCelebration(null),
          tier === 'big' ? 4500 : 3000,
        );
      }
    } else if (s.outcome === 'push' || s.returned === wagered) {
      sounds.blip();
    } else {
      sounds.lose();
    }
    setPhase('done');
  };

  const deal = async () => {
    if (busyRef.current || !betting) return;
    const ante = uthAnte;
    const trips = uthTrips;
    if (ante <= 0) return;
    const cost = ante * 2 + trips;
    if (credits < cost) {
      onInsufficient(cost);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setCredits((c) => c - cost);
    setWin(0);
    setPlayBet(0);
    setDealerUp(false);
    setCommunityUp(0);
    setPlayerCards([]);
    setDealerCards([]);
    setCommunity([]);
    setMessage('');
    setCelebration(null);
    await sleep(220);

    deckRef.current = newDeck();
    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    const board = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];
    setCommunity(board);
    setPlayerCards([player[0]]);
    sounds.dealTick(0);
    await sleep(220);
    setPlayerCards(player);
    sounds.dealTick(1);
    await sleep(220);
    setDealerCards(dealer);
    sounds.dealTick(2);
    await sleep(320);

    setPhase('preflop');
    setMessage('Check, or raise 3× / 4× your ante');
    busyRef.current = false;
    setBusy(false);
  };

  const makePlay = async (multiplier: number) => {
    if (busyRef.current || phase === 'betting' || phase === 'done') return;
    const play = uthAnte * multiplier;
    if (credits < play) {
      onInsufficient(play);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setCredits((c) => c - play);
    setPlayBet(play);
    sounds.blip();
    await sleep(250);
    await revealCommunity(5, communityUp);
    await sleep(300);
    await showdown(play, playerCards, dealerCards, community);
    busyRef.current = false;
    setBusy(false);
  };

  const check = async () => {
    if (busyRef.current || (phase !== 'preflop' && phase !== 'flop')) return;
    busyRef.current = true;
    setBusy(true);
    if (phase === 'preflop') {
      await revealCommunity(3, 0);
      setPhase('flop');
      setMessage('Check again, or bet 2× your ante');
    } else {
      await revealCommunity(5, 3);
      setPhase('river');
      setMessage('Last chance — bet 1× your ante or fold');
    }
    busyRef.current = false;
    setBusy(false);
  };

  const fold = () => {
    if (busyRef.current || phase !== 'river') return;
    const wagered = uthAnte * 2 + uthTrips;
    recordHand(wagered, 0, 'fold');
    sounds.lose();
    setMessage('Folded — ante, blind & trips forfeited');
    setPhase('done');
  };

  const playerName =
    playerCards.length > 0
      ? evaluate7([...playerCards, ...community.slice(0, communityUp)]).name
      : '';
  const dealerName =
    dealerUp && dealerCards.length > 0
      ? evaluate7([...dealerCards, ...community.slice(0, communityUp)]).name
      : '';

  const cardRow = (cards: Card[], count: number, faceUp: (i: number) => boolean) => (
    <div className="bj-cards">
      {cards.length === 0
        ? Array.from({ length: count }, (_, i) => <div key={i} className="bj-placeholder" />)
        : cards.map((c, i) => (
            <CardView
              key={i}
              card={c}
              faceUp={faceUp(i)}
              held={false}
              hinted={false}
              clickable={false}
              onClick={() => {}}
            />
          ))}
    </div>
  );

  const spot = (label: string, amount: number, target?: 'ante' | 'trips') => (
    <button
      type="button"
      className={`uth-spot${target && betting ? ' active' : ''}`}
      disabled={!target || !betting || busy}
      onClick={target ? () => addToSpot(target) : undefined}
      aria-label={target ? `Add chip to ${label}` : label}
    >
      <span className="uth-spot-label">{label}</span>
      <span className={`uth-spot-amount${amount > 0 ? ' filled' : ''}`}>
        {amount > 0 ? chipLabel(amount, dollars, denom) : '—'}
      </span>
    </button>
  );

  return (
    <main className="machine uth">
      <div className="topbar">{topbar}</div>

      <Marquee title="Ultimate Hold'em" tagline="Heads-up Texas hold'em · Blind pays up to 500:1" />

      <div className="message-area">
        <div className={`message${win > staked ? ' win' : ''}`}>{message || ' '}</div>
      </div>

      <div className="bj-table uth-table">
        <div className="bj-row">
          <div className="bj-row-label">
            Dealer{dealerName && <span className="bj-value"> · {dealerName}</span>}
          </div>
          {cardRow(dealerCards, 2, () => dealerUp)}
        </div>
        <div className="bj-row">
          <div className="bj-row-label">Board</div>
          {cardRow(community, 5, (i) => i < communityUp)}
        </div>
        <div className="bj-row">
          <div className="bj-row-label">
            You{playerName && <span className="bj-value"> · {playerName}</span>}
          </div>
          {cardRow(playerCards, 2, () => true)}
        </div>
      </div>

      <div className="uth-bets">
        {spot('Ante', uthAnte, 'ante')}
        {spot('Blind', uthAnte)}
        {spot('Trips', uthTrips, 'trips')}
        {spot('Play', playBet)}
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

        {betting ? (
          <div className="buttons rl-actions">
            <div className="chip-row" role="radiogroup" aria-label="Chip value">
              {chipSet.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`chip-btn${chip === v ? ' selected' : ''}`}
                  aria-pressed={chip === v}
                  onClick={() => {
                    setChip(v);
                    sounds.blip();
                  }}
                >
                  {chipLabel(v, dollars, denom)}
                </button>
              ))}
            </div>
            <button type="button" disabled={busy || staked === 0} onClick={clearBets}>
              Clear
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy || uthAnte <= 0}
              onClick={() => void deal()}
            >
              DEAL
            </button>
          </div>
        ) : (
          <div className="buttons">
            {phase === 'preflop' && (
              <>
                <button
                  type="button"
                  disabled={busy || credits < uthAnte * 4}
                  onClick={() => void makePlay(4)}
                >
                  Bet 4×
                </button>
                <button
                  type="button"
                  disabled={busy || credits < uthAnte * 3}
                  onClick={() => void makePlay(3)}
                >
                  Bet 3×
                </button>
              </>
            )}
            {phase === 'flop' && (
              <button
                type="button"
                disabled={busy || credits < uthAnte * 2}
                onClick={() => void makePlay(2)}
              >
                Bet 2×
              </button>
            )}
            {phase === 'river' ? (
              <>
                <button type="button" disabled={busy} onClick={fold}>
                  Fold
                </button>
                <button
                  type="button"
                  className="primary"
                  disabled={busy || credits < uthAnte}
                  onClick={() => void makePlay(1)}
                >
                  BET 1×
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary"
                disabled={busy || (phase !== 'preflop' && phase !== 'flop')}
                onClick={() => void check()}
              >
                CHECK
              </button>
            )}
          </div>
        )}
      </div>

      <StatusBar
        soundOn={profiles.soundOn}
        dollars={dollars}
        onToggleSound={() => profiles.setSoundOn((v) => !v)}
        onToggleDollars={() => profiles.setDollars((v) => !v)}
      />

      <p className="disclaimer">
        For entertainment &amp; practice only — play money, no real wagering. Single deck,
        cryptographically shuffled every hand. Dealer qualifies with a pair; blind pays up to
        500:1 on a royal flush; optional trips side bet pays on three of a kind or better.
      </p>

      {celebration && <WinOverlay {...celebration} />}
    </main>
  );
}
