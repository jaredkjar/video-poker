import { HAND_NAMES, MAX_BET, payout } from '../game/cards';

interface Props {
  bet: number;
  winRank: number | null;
}

const BETS = Array.from({ length: MAX_BET }, (_, i) => i + 1);

export function Paytable({ bet, winRank }: Props) {
  return (
    <div className="paytable">
      {HAND_NAMES.map((name, rank) => (
        <div key={name} className={`pt-row${winRank === rank ? ' hit' : ''}`}>
          <div className="pt-name">{name}</div>
          {BETS.map((b) => (
            <div key={b} className={`pt-pay${b === bet ? ' active' : ''}`}>
              {payout(rank, b)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
