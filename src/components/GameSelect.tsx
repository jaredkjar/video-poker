import type { ReactNode } from 'react';
import { Marquee } from './Marquee';

export type GameId = 'poker' | 'blackjack' | 'roulette' | 'uth';

interface GameTile {
  id: GameId;
  name: string;
  blurb: string;
  visual: ReactNode;
}

const GAMES: GameTile[] = [
  {
    id: 'poker',
    name: 'Video Poker',
    blurb: 'Jacks or Better · full-pay 9/6 with an exact-EV trainer',
    visual: (
      <span className="tile-cards" aria-hidden="true">
        <span className="tile-card red">
          J<small>♥</small>
        </span>
        <span className="tile-card black">
          A<small>♠</small>
        </span>
      </span>
    ),
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    blurb: 'Beat the dealer to 21 · blackjack pays 3:2',
    visual: (
      <span className="tile-cards" aria-hidden="true">
        <span className="tile-card black">
          A<small>♣</small>
        </span>
        <span className="tile-card red">
          K<small>♦</small>
        </span>
        <span className="tile-badge">21</span>
      </span>
    ),
  },
  {
    id: 'roulette',
    name: 'Roulette',
    blurb: 'American wheel · straight-up pays 35:1',
    visual: (
      <span className="tile-wheel" aria-hidden="true">
        <span className="tile-wheel-hub" />
      </span>
    ),
  },
  {
    id: 'uth',
    name: "Ultimate Hold'em",
    blurb: 'Heads-up Texas hold’em · blind pays up to 500:1',
    visual: (
      <span className="tile-cards" aria-hidden="true">
        <span className="tile-card black">
          Q<small>♠</small>
        </span>
        <span className="tile-card red">
          Q<small>♥</small>
        </span>
        <span className="tile-badge">500:1</span>
      </span>
    ),
  },
];

interface Props {
  /** Topbar contents (settings, account menu) supplied by the shell. */
  topbar: ReactNode;
  balanceLabel: string;
  dollars: boolean;
  onToggleDollars: () => void;
  onPick: (game: GameId) => void;
  onAddCredits: () => void;
}

/** The casino floor: pick a game to play. Shown right after choosing a profile. */
export function GameSelect({
  topbar,
  balanceLabel,
  dollars,
  onToggleDollars,
  onPick,
  onAddCredits,
}: Props) {
  return (
    <main className="machine lobby">
      <div className="topbar">{topbar}</div>

      <Marquee
        title={
          <>
            Lucky Jack's <em>Casino</em>
          </>
        }
        tagline="Video Poker · Blackjack · Roulette · Hold'em"
      />

      <div
        className="display clickable lobby-balance"
        title={dollars ? 'Show credits' : 'Show dollars'}
        onClick={onToggleDollars}
      >
        <label>{dollars ? 'Balance' : 'Credits'}</label>
        <strong className="amber">{balanceLabel}</strong>
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

      <h2 className="lobby-heading">Choose your game</h2>

      <div className="game-grid">
        {GAMES.map((g) => (
          <button type="button" key={g.id} className="game-tile" onClick={() => onPick(g.id)}>
            <span className="tile-visual">{g.visual}</span>
            <span className="tile-text">
              <span className="tile-name">{g.name}</span>
              <span className="tile-blurb">{g.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="lobby-foot">
        One balance, shared across every game. For entertainment &amp; practice only; play
        money has no cash value.
      </p>
    </main>
  );
}
