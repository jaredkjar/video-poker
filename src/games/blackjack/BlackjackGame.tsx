import { useRef, useState, type ReactNode } from 'react';
import { newDeck, type Card } from '../../game/cards';
import * as sounds from '../../game/sounds';
import { useCountUp } from '../../hooks/useCountUp';
import type { Profiles } from '../../hooks/useProfiles';
import { Marquee } from '../../components/Marquee';
import { CardView } from '../../components/CardView';
import { StatusBar } from '../../components/StatusBar';
import { handValue, isBlackjack, settle, valueLabel, type Settlement } from './engine';

const CHIP_VALUES = [1, 5, 10, 25];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'betting' | 'player' | 'dealer' | 'done';

interface Props {
  profiles: Profiles;
  topbar: ReactNode;
  fmt: (amount: number) => string;
  onInsufficient: (betAmount: number) => void;
  onAddCredits: () => void;
}

export function BlackjackGame({ profiles, topbar, fmt, onInsufficient, onAddCredits }: Props) {
  const { credits, setCredits, bjBet, setBjBet, dollars } = profiles;

  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [holeUp, setHoleUp] = useState(false);
  const [phase, setPhase] = useState<Phase>('betting');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Set your bet, then press DEAL');
  const [win, setWin] = useState(0);
  const [wager, setWager] = useState(0);

  const deckRef = useRef<Card[]>([]);
  const busyRef = useRef(false);
  const creditsDisplay = useCountUp(credits);

  const drawCard = () => deckRef.current.pop()!;

  const recordHand = (bet: number, s: Settlement) =>
    profiles.setBjStats((prev) => ({
      hands: prev.hands + 1,
      wins: prev.wins + (s.outcome === 'win' || s.outcome === 'blackjack' ? 1 : 0),
      pushes: prev.pushes + (s.outcome === 'push' ? 1 : 0),
      blackjacks: prev.blackjacks + (s.outcome === 'blackjack' ? 1 : 0),
      wagered: prev.wagered + bet,
      won: prev.won + s.returned,
      biggestWin: Math.max(prev.biggestWin, s.returned),
    }));

  const finish = (player: Card[], dealer: Card[], bet: number) => {
    const s = settle(player, dealer, bet);
    setWin(s.returned);
    if (s.returned > 0) setCredits((c) => c + s.returned);
    recordHand(bet, s);

    const dv = handValue(dealer).total;
    const pv = handValue(player).total;
    if (s.outcome === 'blackjack') {
      sounds.win(6);
      setMessage(`Blackjack! You win ${fmt(s.returned - bet)}`);
    } else if (s.outcome === 'win') {
      sounds.win(2);
      setMessage(dv > 21 ? `Dealer busts — you win ${fmt(bet)}!` : `You win ${fmt(bet)}!`);
    } else if (s.outcome === 'push') {
      sounds.blip();
      setMessage('Push — your bet is returned');
    } else {
      sounds.lose();
      if (pv > 21) setMessage('Bust — dealer wins');
      else if (isBlackjack(dealer)) setMessage('Dealer blackjack');
      else setMessage(`Dealer wins, ${dv} to ${pv}`);
    }
    setPhase('done');
  };

  const dealerPlay = async (player: Card[], dealer: Card[], bet: number) => {
    setPhase('dealer');
    setMessage('Dealer plays…');
    setHoleUp(true);
    sounds.holdClick();
    await sleep(500);
    let cur = dealer;
    while (handValue(cur).total < 17) {
      cur = [...cur, drawCard()];
      setDealerCards(cur);
      sounds.dealTick(cur.length);
      await sleep(480);
    }
    await sleep(250);
    finish(player, cur, bet);
  };

  const deal = async () => {
    if (busyRef.current || (phase !== 'betting' && phase !== 'done')) return;
    const bet = bjBet;
    if (bet <= 0) return;
    if (credits < bet) {
      onInsufficient(bet);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setCredits((c) => c - bet);
    setWager(bet);
    setWin(0);
    setMessage('');
    setHoleUp(false);
    setPlayerCards([]);
    setDealerCards([]);
    await sleep(220);

    deckRef.current = newDeck();
    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();
    setPlayerCards([p1]);
    sounds.dealTick(0);
    await sleep(230);
    setDealerCards([d1]);
    sounds.dealTick(1);
    await sleep(230);
    setPlayerCards([p1, p2]);
    sounds.dealTick(2);
    await sleep(230);
    setDealerCards([d1, d2]);
    sounds.dealTick(3);
    await sleep(320);

    const player = [p1, p2];
    const dealer = [d1, d2];
    if (isBlackjack(player) || isBlackjack(dealer)) {
      setHoleUp(true);
      await sleep(350);
      finish(player, dealer, bet);
    } else {
      setPhase('player');
      setMessage('Hit, stand, or double down');
    }
    busyRef.current = false;
    setBusy(false);
  };

  const hit = async () => {
    if (busyRef.current || phase !== 'player') return;
    busyRef.current = true;
    setBusy(true);
    const cards = [...playerCards, drawCard()];
    setPlayerCards(cards);
    sounds.dealTick(cards.length);
    await sleep(360);
    const total = handValue(cards).total;
    if (total > 21) {
      setHoleUp(true);
      await sleep(300);
      finish(cards, dealerCards, wager);
    } else if (total === 21) {
      await dealerPlay(cards, dealerCards, wager);
    } else {
      setMessage('Hit or stand');
    }
    busyRef.current = false;
    setBusy(false);
  };

  const stand = async () => {
    if (busyRef.current || phase !== 'player') return;
    busyRef.current = true;
    setBusy(true);
    await dealerPlay(playerCards, dealerCards, wager);
    busyRef.current = false;
    setBusy(false);
  };

  const canDouble = phase === 'player' && playerCards.length === 2 && credits >= wager;

  const doubleDown = async () => {
    if (busyRef.current || !canDouble) return;
    busyRef.current = true;
    setBusy(true);
    setCredits((c) => c - wager);
    const doubled = wager * 2;
    setWager(doubled);
    sounds.blip();
    const cards = [...playerCards, drawCard()];
    setPlayerCards(cards);
    sounds.dealTick(cards.length);
    await sleep(420);
    if (handValue(cards).total > 21) {
      setHoleUp(true);
      await sleep(300);
      finish(cards, dealerCards, doubled);
    } else {
      await dealerPlay(cards, dealerCards, doubled);
    }
    busyRef.current = false;
    setBusy(false);
  };

  const addChip = (v: number) => {
    if (phase !== 'betting' && phase !== 'done') return;
    setBjBet((b) => Math.min(b + v, Math.max(credits, 1)));
    sounds.blip();
  };

  const clearBet = () => {
    if (phase !== 'betting' && phase !== 'done') return;
    setBjBet(0);
    sounds.blip();
  };

  const betting = phase === 'betting' || phase === 'done';
  const dealerLabel = holeUp
    ? valueLabel(dealerCards)
    : valueLabel(dealerCards.slice(0, 1));

  return (
    <main className="machine blackjack">
      <div className="topbar">{topbar}</div>

      <Marquee title="Blackjack" tagline="Dealer stands on all 17s · Blackjack pays 3:2" />

      <div className="message-area">
        <div className={`message${win > wager ? ' win' : ''}`}>{message || ' '}</div>
      </div>

      <div className="bj-table">
        <div className="bj-row">
          <div className="bj-row-label">
            Dealer{dealerCards.length > 0 && <span className="bj-value"> · {dealerLabel}</span>}
          </div>
          <div className="bj-cards">
            {dealerCards.map((c, i) => (
              <CardView
                key={i}
                card={c}
                faceUp={i !== 1 || holeUp}
                held={false}
                hinted={false}
                clickable={false}
                onClick={() => {}}
              />
            ))}
            {dealerCards.length === 0 && <div className="bj-placeholder" />}
          </div>
        </div>

        <div className="bj-row">
          <div className="bj-row-label">
            You{playerCards.length > 0 && <span className="bj-value"> · {valueLabel(playerCards)}</span>}
          </div>
          <div className="bj-cards">
            {playerCards.map((c, i) => (
              <CardView
                key={i}
                card={c}
                faceUp
                held={false}
                hinted={false}
                clickable={false}
                onClick={() => {}}
              />
            ))}
            {playerCards.length === 0 && <div className="bj-placeholder" />}
          </div>
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
            <strong className="amber">{fmt(betting ? bjBet : wager)}</strong>
          </div>
          <div className="display">
            <label>Win</label>
            <strong className="green">{fmt(win)}</strong>
          </div>
        </div>

        {betting ? (
          <div className="buttons">
            {CHIP_VALUES.map((v) => (
              <button key={v} type="button" disabled={busy} onClick={() => addChip(v)}>
                +{v}
              </button>
            ))}
            <button type="button" disabled={busy || bjBet === 0} onClick={clearBet}>
              Clear
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy || bjBet === 0}
              onClick={() => void deal()}
            >
              DEAL
            </button>
          </div>
        ) : (
          <div className="buttons">
            <button
              type="button"
              disabled={busy || !canDouble}
              onClick={() => void doubleDown()}
            >
              Double
            </button>
            <button
              type="button"
              disabled={busy || phase !== 'player'}
              onClick={() => void stand()}
            >
              Stand
            </button>
            <button
              type="button"
              className="primary"
              disabled={busy || phase !== 'player'}
              onClick={() => void hit()}
            >
              HIT
            </button>
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
        cryptographically shuffled every hand. Dealer stands on all 17s; blackjack pays 3:2;
        double down on any first two cards.
      </p>
    </main>
  );
}
