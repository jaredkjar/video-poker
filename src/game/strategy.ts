import { BASE_PAY, MAX_BET, ROYAL_MAX_BET_PAY, handRank, type Card } from './cards.ts';

export interface HoldEV {
  /** Bitmask over hand positions 0..4; bit set = hold that card */
  mask: number;
  /** Expected payout in credits at the given bet */
  ev: number;
}

/**
 * Exact expected value for every one of the 32 possible holds, by enumerating
 * all draws from the remaining 47 cards. ~2.6M hand evaluations total — run it
 * in a worker.
 */
export function bestHolds(cards: readonly Card[], bet: number): HoldEV[] {
  const inHand = new Set(cards);
  const rest: Card[] = [];
  for (let c = 0; c < 52; c++) if (!inHand.has(c)) rest.push(c);
  const n = rest.length;

  const pay = BASE_PAY.map((p, rank) =>
    rank === 0 && bet === MAX_BET ? ROYAL_MAX_BET_PAY : p * bet,
  );

  const results: HoldEV[] = [];
  const hand = new Array<Card>(5);

  for (let mask = 0; mask < 32; mask++) {
    let heldCount = 0;
    for (let i = 0; i < 5; i++) {
      if (mask & (1 << i)) hand[heldCount++] = cards[i];
    }
    const need = 5 - heldCount;

    if (need === 0) {
      const r = handRank(hand);
      results.push({ mask, ev: r < 0 ? 0 : pay[r] });
      continue;
    }

    // Enumerate C(47, need) draw combinations via an index array
    const idx = Array.from({ length: need }, (_, j) => j);
    let total = 0;
    let count = 0;
    for (;;) {
      for (let j = 0; j < need; j++) hand[heldCount + j] = rest[idx[j]];
      const r = handRank(hand);
      if (r >= 0) total += pay[r];
      count++;

      let j = need - 1;
      while (j >= 0 && idx[j] === n - need + j) j--;
      if (j < 0) break;
      idx[j]++;
      for (let k = j + 1; k < need; k++) idx[k] = idx[k - 1] + 1;
    }
    results.push({ mask, ev: total / count });
  }

  results.sort((a, b) => b.ev - a.ev);
  return results;
}
