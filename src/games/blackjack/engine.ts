// Blackjack hand math. Cards reuse the shared 0..51 encoding from game/cards.

import { rankOf, type Card } from '../../game/cards';

export interface HandValue {
  total: number;
  /** True when an ace is currently counted as 11. */
  soft: boolean;
}

/** Best total for a hand, demoting aces from 11 to 1 as needed. */
export function handValue(cards: readonly Card[]): HandValue {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    const r = rankOf(c);
    if (r === 14) {
      aces++;
      total += 11;
    } else {
      total += Math.min(r, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export const isBust = (cards: readonly Card[]) => handValue(cards).total > 21;

/** A natural: 21 on the first two cards. */
export const isBlackjack = (cards: readonly Card[]) =>
  cards.length === 2 && handValue(cards).total === 21;

/** "17", "soft 17", "blackjack", or "bust" for hand labels. */
export function valueLabel(cards: readonly Card[]): string {
  if (cards.length === 0) return '';
  if (isBlackjack(cards)) return 'blackjack';
  const { total, soft } = handValue(cards);
  if (total > 21) return 'bust';
  return soft ? `soft ${total}` : String(total);
}

/** Blackjack pays 3:2, rounded down to whole credits. */
export const blackjackWinnings = (bet: number) => Math.floor(bet * 1.5);

export type Outcome = 'blackjack' | 'win' | 'push' | 'lose';

export interface Settlement {
  outcome: Outcome;
  /** Total credits returned to the player (stake included). */
  returned: number;
}

/** Settle a finished round. Assumes the player didn't bust unless pv > 21. */
export function settle(player: readonly Card[], dealer: readonly Card[], bet: number): Settlement {
  const pv = handValue(player).total;
  const dv = handValue(dealer).total;
  const playerBJ = isBlackjack(player);
  const dealerBJ = isBlackjack(dealer);

  if (playerBJ && dealerBJ) return { outcome: 'push', returned: bet };
  if (playerBJ) return { outcome: 'blackjack', returned: bet + blackjackWinnings(bet) };
  if (dealerBJ) return { outcome: 'lose', returned: 0 };
  if (pv > 21) return { outcome: 'lose', returned: 0 };
  if (dv > 21 || pv > dv) return { outcome: 'win', returned: bet * 2 };
  if (pv === dv) return { outcome: 'push', returned: bet };
  return { outcome: 'lose', returned: 0 };
}
