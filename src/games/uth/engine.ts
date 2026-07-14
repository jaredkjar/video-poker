// Ultimate Texas Hold'em: best-5-of-7 hand evaluation with full tiebreakers,
// the blind/trips paytables, and round settlement.

import { rankOf, suitOf, type Card } from '../../game/cards';

/** Category indices, low to high. Royal gets its own slot for the paytables. */
export const CATEGORY_NAMES = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
] as const;

export interface Evaluated {
  category: number;
  /** Fully comparable strength: category plus up to five 4-bit tiebreak ranks. */
  score: number;
  name: string;
}

/** Highest straight top-card in a rank bitmask (aces high and low), or 0. */
function straightHigh(rankBits: number): number {
  let bits = rankBits;
  if (bits & (1 << 14)) bits |= 1 << 1; // the ace also plays low for the wheel
  for (let hi = 14; hi >= 5; hi--) {
    const run = 0b11111 << (hi - 4);
    if ((bits & run) === run) return hi;
  }
  return 0;
}

function make(category: number, tiebreaks: number[]): Evaluated {
  let score = category;
  for (let i = 0; i < 5; i++) score = (score << 4) | (tiebreaks[i] ?? 0);
  return { category, score, name: CATEGORY_NAMES[category] };
}

/**
 * Evaluate the best 5-card hand from up to 7 cards. Scores compare directly:
 * a higher score always beats a lower one, kickers included. Fewer than five
 * cards evaluate too (used for live hand labels while the board runs out).
 */
export function evaluate7(cards: readonly Card[]): Evaluated {
  const counts = new Array<number>(15).fill(0);
  const suitRanks: number[][] = [[], [], [], []];
  let rankBits = 0;
  for (const c of cards) {
    const r = rankOf(c);
    counts[r]++;
    rankBits |= 1 << r;
    suitRanks[suitOf(c)].push(r);
  }

  let flushRanks: number[] | null = null;
  for (const sr of suitRanks) {
    if (sr.length >= 5) flushRanks = sr.sort((a, b) => b - a);
  }

  if (flushRanks) {
    let bits = 0;
    for (const r of flushRanks) bits |= 1 << r;
    const high = straightHigh(bits);
    if (high === 14) return make(9, [high]);
    if (high) return make(8, [high]);
  }

  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  const singles: number[] = [];
  for (let r = 14; r >= 2; r--) {
    if (counts[r] === 4) quads.push(r);
    else if (counts[r] === 3) trips.push(r);
    else if (counts[r] === 2) pairs.push(r);
    else if (counts[r] === 1) singles.push(r);
  }

  if (quads.length) {
    let kicker = 0;
    for (let r = 14; r >= 2; r--) {
      if (r !== quads[0] && counts[r] > 0) {
        kicker = r;
        break;
      }
    }
    return make(7, [quads[0], kicker]);
  }

  // A second trip plays as the pair of a full house
  if (trips.length && (trips.length > 1 || pairs.length)) {
    return make(6, [trips[0], trips.length > 1 ? trips[1] : pairs[0]]);
  }

  if (flushRanks) return make(5, flushRanks.slice(0, 5));

  const high = straightHigh(rankBits);
  if (high) return make(4, [high]);

  if (trips.length) return make(3, [trips[0], ...singles.slice(0, 2)]);

  if (pairs.length >= 2) {
    // With three pairs the odd one out competes with the singles for kicker
    const kicker = Math.max(pairs[2] ?? 0, singles[0] ?? 0);
    return make(2, [pairs[0], pairs[1], kicker]);
  }

  if (pairs.length) return make(1, [pairs[0], ...singles.slice(0, 3)]);

  return make(0, singles.slice(0, 5));
}

/** The dealer needs a pair or better to open. */
export const dealerQualifies = (d: Evaluated) => d.category >= 1;

/** Blind winnings per credit staked when the player wins (0 = the blind pushes). */
export function blindMultiplier(category: number): number {
  switch (category) {
    case 9:
      return 500;
    case 8:
      return 50;
    case 7:
      return 10;
    case 6:
      return 3;
    case 5:
      return 1.5;
    case 4:
      return 1;
    default:
      return 0;
  }
}

/** Trips winnings per credit staked (0 = lose), on the player's hand alone. */
export function tripsMultiplier(category: number): number {
  switch (category) {
    case 9:
      return 50;
    case 8:
      return 40;
    case 7:
      return 30;
    case 6:
      return 8;
    case 5:
      return 7;
    case 4:
      return 4;
    case 3:
      return 3;
    default:
      return 0;
  }
}

export interface Settlement {
  outcome: 'win' | 'lose' | 'push';
  /** Total credits returned across ante, blind, play, and trips (stakes included). */
  returned: number;
  /** Portion of `returned` that came from the trips side bet. */
  tripsReturned: number;
  /** Portion of `returned` beyond stake that the blind paid (0 unless a big win). */
  blindWinnings: number;
  dealerQualified: boolean;
}

/**
 * Settle a hand that reached showdown. The blind always equals the ante.
 * Rules: ante pushes when the dealer doesn't qualify (win or lose); play pays
 * even money; the blind pays by paytable on a win with a straight or better,
 * otherwise pushes on a win; everything pushes on a tie. Trips is independent.
 */
export function settleRound(
  player: Evaluated,
  dealer: Evaluated,
  ante: number,
  play: number,
  trips: number,
): Settlement {
  const blind = ante;
  const qualified = dealerQualifies(dealer);
  const outcome = player.score > dealer.score ? 'win' : player.score < dealer.score ? 'lose' : 'push';

  let returned = 0;
  let blindWinnings = 0;
  if (outcome === 'win') {
    returned += qualified ? ante * 2 : ante;
    returned += play * 2;
    blindWinnings = Math.floor(blind * blindMultiplier(player.category));
    returned += blind + blindWinnings;
  } else if (outcome === 'push') {
    returned += ante + blind + play;
  } else if (!qualified) {
    returned += ante; // ante pushes even on a loss when the dealer can't open
  }

  const tripsReturned = tripsMultiplier(player.category) > 0 ? trips * (1 + tripsMultiplier(player.category)) : 0;
  returned += tripsReturned;

  return { outcome, returned, tripsReturned, blindWinnings, dealerQualified: qualified };
}
