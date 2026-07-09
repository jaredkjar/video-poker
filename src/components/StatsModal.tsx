import type { ReactNode } from 'react';
import { HAND_NAMES } from '../game/cards';
import type { Stats } from '../game/stats';

interface Props {
  user: string;
  stats: Stats;
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

export function StatsModal({ user, stats, format, onReset, onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal stats-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{user}'s Stats</h2>

        <div className="stats-columns">
          <div>
            <h3>Session</h3>
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
        </div>

        <p className="odds-note">
          Every hand is dealt from a full 52-card deck shuffled with a cryptographic RNG — the
          same odds as a real full-pay 9/6 Jacks or Better machine, which returns 99.54% with
          perfect strategy. For entertainment and practice only; play money has no cash value.
        </p>

        <button type="button" className="modal-link" onClick={onReset}>
          Reset {user}'s stats
        </button>
      </div>
    </div>
  );
}
