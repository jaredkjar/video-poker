import { useRef, useState } from 'react';
import {
  HAND_NAMES,
  describeHold,
  handRank,
  newDeck,
  payout,
  type Card,
} from '../game/cards';
import * as sounds from '../game/sounds';
import type { StrategyHandle } from './useStrategyWorker';

const HAND_SIZE = 5;
const ALL_FALSE = Array<boolean>(HAND_SIZE).fill(false);
const EMPTY_HAND = Array<Card | null>(HAND_SIZE).fill(null);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface HandResult {
  rank: number;
  amount: number;
  bet: number;
  strategyKnown: boolean;
  wasOptimal: boolean;
}

export interface GameRoundDeps {
  bet: number;
  trainer: boolean;
  strategy: StrategyHandle;
  formatMoney: (credits: number) => string;
  formatEV: (v: number) => string;
  /** Deduct the wager; return false (without deducting) if the balance is short. */
  tryDeduct: (amount: number) => boolean;
  addWinnings: (amount: number) => void;
  onInsufficient: (betAmount: number) => void;
  onHandComplete: (result: HandResult) => void;
}

/** The deal → hold → draw state machine, card animations included. */
export function useGameRound(deps: GameRoundDeps) {
  const [hand, setHand] = useState<(Card | null)[]>(EMPTY_HAND);
  const [faceUp, setFaceUp] = useState(ALL_FALSE);
  const [held, setHeld] = useState(ALL_FALSE);
  const [phase, setPhase] = useState<'idle' | 'holding'>('idle');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Welcome — press DEAL to play');
  const [trainerNote, setTrainerNote] = useState('');
  const [win, setWin] = useState(0);
  const [winRank, setWinRank] = useState<number | null>(null);
  const [hintMask, setHintMask] = useState<number | null>(null);

  const busyRef = useRef(false);
  const deckRef = useRef<Card[]>([]);

  const setCardFace = (i: number, up: boolean) =>
    setFaceUp((f) => f.map((v, j) => (j === i ? up : v)));

  const deal = async (betAmount: number) => {
    if (busyRef.current) return;
    if (!deps.tryDeduct(betAmount)) {
      deps.onInsufficient(betAmount);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setWin(0);
    setWinRank(null);
    setHintMask(null);
    setTrainerNote('');
    setHeld(ALL_FALSE);
    setMessage('');

    if (faceUp.some(Boolean)) {
      setFaceUp(ALL_FALSE);
      await sleep(300);
    }

    const deck = newDeck();
    const dealt = deck.slice(0, HAND_SIZE);
    deckRef.current = deck.slice(HAND_SIZE);
    setHand(dealt);
    await sleep(60);
    for (let i = 0; i < HAND_SIZE; i++) {
      setCardFace(i, true);
      sounds.dealTick(i);
      await sleep(110);
    }
    await sleep(220);

    deps.strategy.request(dealt, betAmount);

    const dealtRank = handRank(dealt);
    if (dealtRank >= 0) {
      setWinRank(dealtRank);
      setMessage(`${HAND_NAMES[dealtRank]} — hold your winners, then DRAW`);
    } else {
      setMessage('Click cards to HOLD, then press DRAW');
    }
    setPhase('holding');
    busyRef.current = false;
    setBusy(false);
  };

  const draw = async () => {
    if (busyRef.current || phase !== 'holding') return;
    busyRef.current = true;
    setBusy(true);
    setHintMask(null);

    const dealtHand = hand as Card[];
    const heldMask = held.reduce((m, h, i) => (h ? m | (1 << i) : m), 0);
    const replace = [0, 1, 2, 3, 4].filter((i) => !held[i]);

    let finalHand = dealtHand;
    if (replace.length > 0) {
      for (const i of replace) {
        setCardFace(i, false);
        await sleep(70);
      }
      await sleep(240);
      let d = 0;
      finalHand = dealtHand.map((c, i) => (held[i] ? c : deckRef.current[d++]));
      setHand(finalHand);
      await sleep(40);
      for (const i of replace) {
        setCardFace(i, true);
        sounds.dealTick(i);
        await sleep(110);
      }
      await sleep(240);
    }

    const rank = handRank(finalHand);
    const amount = payout(rank, deps.bet);
    setWinRank(rank >= 0 ? rank : null);
    setWin(amount);
    if (amount > 0) {
      deps.addWinnings(amount);
      sounds.win(amount / deps.bet);
      setMessage(`${HAND_NAMES[rank]} — you win ${deps.formatMoney(amount)}!`);
    } else {
      sounds.lose();
      setMessage('Game over — press DEAL to play again');
    }

    const strategy = deps.strategy.resultsRef.current;
    const wasOptimal = strategy !== null && strategy[0].mask === heldMask;
    deps.onHandComplete({
      rank,
      amount,
      bet: deps.bet,
      strategyKnown: strategy !== null,
      wasOptimal,
    });

    if (deps.trainer && strategy) {
      if (wasOptimal) {
        setTrainerNote('Trainer: perfect play ✓');
      } else {
        const played = strategy.find((r) => r.mask === heldMask);
        setTrainerNote(
          `Trainer: best play was to ${describeHold(strategy[0].mask, dealtHand)} ` +
            `(EV ${deps.formatEV(strategy[0].ev)} vs your ${played ? deps.formatEV(played.ev) : '?'})`,
        );
      }
    }
    setPhase('idle');
    busyRef.current = false;
    setBusy(false);
  };

  const toggleHold = (i: number) => {
    if (phase !== 'holding' || busyRef.current) return;
    setHeld((h) => h.map((v, j) => (j === i ? !v : v)));
    sounds.holdClick();
  };

  const showHint = () => {
    if (phase !== 'holding' || busyRef.current) return;
    const results = deps.strategy.resultsRef.current;
    if (!results) {
      setMessage('Crunching the odds — try HINT again in a second…');
      return;
    }
    const best = results[0];
    setHintMask(best.mask);
    setMessage(`Suggested: ${describeHold(best.mask, hand as Card[])}`);
    sounds.blip();
  };

  /** Clear the table for a fresh session (login, guest switch). */
  const resetRound = (welcome: string) => {
    setHand(EMPTY_HAND);
    setFaceUp(ALL_FALSE);
    setHeld(ALL_FALSE);
    setPhase('idle');
    setWin(0);
    setWinRank(null);
    setHintMask(null);
    setTrainerNote('');
    setMessage(welcome);
    busyRef.current = false;
    setBusy(false);
  };

  return {
    hand,
    faceUp,
    held,
    phase,
    busy,
    message,
    setMessage,
    trainerNote,
    win,
    winRank,
    hintMask,
    deal,
    draw,
    toggleHold,
    showHint,
    resetRound,
  };
}
