import type { ReactNode } from 'react';
import { HAND_NAMES } from '../game/cards';
import type { BlackjackStats, RouletteStats, Stats } from '../game/stats';

interface Props {
  user: string;
  stats: Stats;
  bjStats: BlackjackStats;
  rouletteStats: RouletteStats;
  format: (amount: number) => string;
  onReset: () => void;
  onClose: () => void;
}

const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '—');

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function StatsModal({ user, stats, bjStats, rouletteStats, format, onReset, onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal stats-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{user}'s Stats</h2>

        <div className="stats-columns">
          <div>
            <h3>Video Poker</h3>
            <div className="stat-section">
              <Row label="Hands played" value={stats.hands} />
              <Row
                label="Hands won"
                value={
                  stats.hands > 0 ? `${stats.handsWon} (${pct(stats.handsWon, stats.hands)})` : 0
                }
              />
              <Row label="Total wagered" value={format(stats.wagered)} />
              <Row label="Total won" value={format(stats.won)} />
              <Row label="Return" value={pct(stats.won, stats.wagered)} />
              <Row label="Biggest win" value={format(stats.biggestWin)} />
              <Row label="Optimal holds" value={pct(stats.perfectHolds, stats.holdsEvaluated)} />
            </div>
          </div>
          <div>
            <h3>Winning hands</h3>
            <div className="stat-section">
              {HAND_NAMES.map((name, rank) => (
                <Row key={name} label={name} value={stats.handCounts[rank]} />
              ))}
            </div>
          </div>
          <div>
            <h3>Blackjack</h3>
            <div className="stat-section">
              <Row label="Hands played" value={bjStats.hands} />
              <Row
                label="Hands won"
                value={
                  bjStats.hands > 0 ? `${bjStats.wins} (${pct(bjStats.wins, bjStats.hands)})` : 0
                }
              />
              <Row label="Pushes" value={bjStats.pushes} />
              <Row label="Blackjacks" value={bjStats.blackjacks} />
              <Row label="Total wagered" value={format(bjStats.wagered)} />
              <Row label="Total won" value={format(bjStats.won)} />
              <Row label="Return" value={pct(bjStats.won, bjStats.wagered)} />
              <Row label="Biggest win" value={format(bjStats.biggestWin)} />
            </div>
          </div>
          <div>
            <h3>Roulette</h3>
            <div className="stat-section">
              <Row label="Spins" value={rouletteStats.spins} />
              <Row
                label="Winning spins"
                value={
                  rouletteStats.spins > 0
                    ? `${rouletteStats.wins} (${pct(rouletteStats.wins, rouletteStats.spins)})`
                    : 0
                }
              />
              <Row label="Total wagered" value={format(rouletteStats.wagered)} />
              <Row label="Total won" value={format(rouletteStats.won)} />
              <Row label="Return" value={pct(rouletteStats.won, rouletteStats.wagered)} />
              <Row label="Biggest win" value={format(rouletteStats.biggestWin)} />
            </div>
          </div>
        </div>

        <p className="odds-note">
          Every game runs on a cryptographic RNG with true casino odds: 9/6 Jacks or Better
          returns 99.54% with perfect strategy, single-deck blackjack roughly 99.7% with basic
          strategy, and double-zero roulette 94.74%. For entertainment and practice only; play
          money has no cash value.
        </p>

        <button type="button" className="modal-link" onClick={onReset}>
          Reset {user}'s stats
        </button>
      </div>
    </div>
  );
}
