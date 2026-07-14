import type { ReactNode } from 'react';
import { MAX_BET } from '../../game/cards';
import * as sounds from '../../game/sounds';
import { useCountUp } from '../../hooks/useCountUp';
import type { Profiles } from '../../hooks/useProfiles';
import { useStrategyWorker } from '../../hooks/useStrategyWorker';
import { useGameRound } from '../../hooks/useGameRound';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { Marquee } from '../../components/Marquee';
import { CardView } from '../../components/CardView';
import { Paytable } from '../../components/Paytable';
import { Console } from '../../components/Console';
import { StatusBar } from '../../components/StatusBar';
import { WinOverlay } from '../../components/WinOverlay';

interface Props {
  profiles: Profiles;
  /** Topbar contents (back button, settings, account menu) supplied by the shell. */
  topbar: ReactNode;
  /** False while any app-level modal is open, so shortcuts don't fire underneath. */
  keyboardActive: boolean;
  fmt: (amount: number) => string;
  fmtEV: (v: number) => string;
  onInsufficient: (betAmount: number) => void;
  onAddCredits: () => void;
}

/** The original Jacks or Better machine, now one game among several. */
export function PokerGame({
  profiles,
  topbar,
  keyboardActive,
  fmt,
  fmtEV,
  onInsufficient,
  onAddCredits,
}: Props) {
  const { credits, setCredits, bet, setBet, dollars, trainer } = profiles;

  const strategy = useStrategyWorker();

  const game = useGameRound({
    bet,
    trainer,
    strategy,
    formatMoney: fmt,
    formatEV: fmtEV,
    tryDeduct: (amount) => {
      if (credits < amount) return false;
      setCredits((c) => c - amount);
      return true;
    },
    addWinnings: (amount) => setCredits((c) => c + amount),
    onInsufficient,
    onHandComplete: ({ rank, amount, bet: wager, strategyKnown, wasOptimal }) =>
      profiles.setStats((s) => ({
        ...s,
        hands: s.hands + 1,
        handsWon: s.handsWon + (amount > 0 ? 1 : 0),
        wagered: s.wagered + wager,
        won: s.won + amount,
        biggestWin: Math.max(s.biggestWin, amount),
        perfectHolds: s.perfectHolds + (wasOptimal ? 1 : 0),
        holdsEvaluated: s.holdsEvaluated + (strategyKnown ? 1 : 0),
        handCounts:
          rank >= 0 ? s.handCounts.map((c, i) => (i === rank ? c + 1 : c)) : s.handCounts,
      })),
  });

  const creditsDisplay = useCountUp(credits);

  const betOne = () => {
    if (game.phase === 'holding' || game.busy) return;
    setBet((b) => (b % MAX_BET) + 1);
    sounds.blip();
  };

  const betMax = () => {
    if (game.phase === 'holding' || game.busy) return;
    setBet(MAX_BET);
    void game.deal(MAX_BET);
  };

  const dealOrDraw = () => (game.phase === 'holding' ? void game.draw() : void game.deal(bet));

  useKeyboardControls({
    active: keyboardActive,
    onHold: game.toggleHold,
    onPrimary: dealOrDraw,
    onHint: game.showHint,
  });

  return (
    <main className="machine poker">
      <div className="topbar">{topbar}</div>

      <Marquee tagline="9 / 6 Video Poker" />

      <Paytable bet={bet} winRank={game.winRank} />

      <div className="message-area">
        <div className={`message${game.win > 0 ? ' win' : ''}`}>{game.message || ' '}</div>
        <div className="trainer-note">{game.trainerNote || ' '}</div>
      </div>

      <div className="cards">
        {game.hand.map((c, i) => (
          <CardView
            key={i}
            card={c}
            faceUp={game.faceUp[i]}
            held={game.held[i]}
            hinted={game.hintMask !== null && (game.hintMask & (1 << i)) !== 0}
            clickable={game.phase === 'holding' && !game.busy}
            onClick={() => game.toggleHold(i)}
          />
        ))}
      </div>

      <Console
        balanceLabel={fmt(creditsDisplay)}
        betLabel={fmt(bet)}
        winLabel={fmt(game.win)}
        dollars={dollars}
        phase={game.phase}
        busy={game.busy}
        onToggleDollars={() => profiles.setDollars((d) => !d)}
        onAddCredits={onAddCredits}
        onBetOne={betOne}
        onBetMax={betMax}
        onHint={game.showHint}
        onPrimary={dealOrDraw}
      />

      <StatusBar
        soundOn={profiles.soundOn}
        trainer={trainer}
        dollars={dollars}
        onToggleSound={() => profiles.setSoundOn((v) => !v)}
        onToggleTrainer={() => profiles.setTrainer((v) => !v)}
        onToggleDollars={() => profiles.setDollars((v) => !v)}
      />

      <p className="disclaimer">
        For entertainment &amp; practice only — play money, no real wagering. Cards are dealt
        from a full 52-card deck with a cryptographic shuffle; the 9/6 paytable returns 99.54%
        with optimal play.
      </p>

      {game.celebration && <WinOverlay {...game.celebration} />}
    </main>
  );
}
