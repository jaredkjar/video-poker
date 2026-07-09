// Card encoding: 0..51 where suit = floor(c / 13), rank = (c % 13) + 2 (2..14, ace high)
export type Card = number;

export const SUIT_CHARS = ['♠', '♥', '♦', '♣'] as const;
const RANK_LABELS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const suitOf = (c: Card) => Math.floor(c / 13);
export const rankOf = (c: Card) => (c % 13) + 2;
export const rankLabel = (c: Card) => RANK_LABELS[c % 13];
export const suitChar = (c: Card) => SUIT_CHARS[suitOf(c)];
export const isRed = (c: Card) => suitOf(c) === 1 || suitOf(c) === 2;
export const cardLabel = (c: Card) => rankLabel(c) + suitChar(c);

// Paytable order — index doubles as hand rank (0 = best)
export const HAND_NAMES = [
  'Royal Flush',
  'Straight Flush',
  'Four of a Kind',
  'Full House',
  'Flush',
  'Straight',
  'Three of a Kind',
  'Two Pair',
  'Jacks or Better',
];

// Full-pay 9/6 Jacks or Better, per coin
export const BASE_PAY = [250, 50, 25, 9, 6, 4, 3, 2, 1];
export const MAX_BET = 5;
export const ROYAL_MAX_BET_PAY = 4000;

export function payout(rank: number, bet: number): number {
  if (rank < 0) return 0;
  if (rank === 0 && bet === MAX_BET) return ROYAL_MAX_BET_PAY;
  return BASE_PAY[rank] * bet;
}

/**
 * Fisher–Yates shuffle driven by the cryptographic RNG, with rejection
 * sampling so every one of the 52! orderings is exactly equally likely
 * (a plain `% n` on random words would very slightly favor low indices).
 */
export function newDeck(): Card[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  const buf = new Uint32Array(64);
  let idx = buf.length;
  const nextWord = () => {
    if (idx >= buf.length) {
      crypto.getRandomValues(buf);
      idx = 0;
    }
    return buf[idx++];
  };
  for (let i = 51; i > 0; i--) {
    const bound = i + 1;
    const limit = Math.floor(0x100000000 / bound) * bound;
    let r = nextWord();
    while (r >= limit) r = nextWord();
    const j = r % bound;
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Rank a 5-card hand: 0..8 (paytable index) or -1 for a losing hand. */
export function handRank(cards: readonly Card[]): number {
  const counts = new Array<number>(15).fill(0);
  const suitCounts = [0, 0, 0, 0];
  let bits = 0;
  for (let i = 0; i < 5; i++) {
    const c = cards[i];
    const r = (c % 13) + 2;
    counts[r]++;
    suitCounts[Math.floor(c / 13)]++;
    bits |= 1 << r;
  }

  let pairs = 0;
  let trips = 0;
  let quads = 0;
  let highPair = false;
  for (let r = 2; r <= 14; r++) {
    const n = counts[r];
    if (n === 2) {
      pairs++;
      if (r >= 11) highPair = true; // J, Q, K, A
    } else if (n === 3) trips++;
    else if (n === 4) quads++;
  }

  const flush =
    suitCounts[0] === 5 || suitCounts[1] === 5 || suitCounts[2] === 5 || suitCounts[3] === 5;

  let straight = false;
  let royal = false;
  if (pairs === 0 && trips === 0 && quads === 0) {
    const WHEEL = (1 << 14) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5);
    if (bits === WHEEL) straight = true;
    else {
      let lo = 2;
      while (!(bits & (1 << lo))) lo++;
      let hi = 14;
      while (!(bits & (1 << hi))) hi--;
      if (hi - lo === 4) {
        straight = true;
        if (lo === 10) royal = true;
      }
    }
  }

  if (straight && flush) return royal ? 0 : 1;
  if (quads) return 2;
  if (trips && pairs) return 3;
  if (flush) return 4;
  if (straight) return 5;
  if (trips) return 6;
  if (pairs === 2) return 7;
  if (pairs === 1 && highPair) return 8;
  return -1;
}

export function describeHold(mask: number, cards: readonly Card[]): string {
  if (mask === 0) return 'hold nothing';
  if (mask === 31) return 'hold everything';
  const names = cards.filter((_, i) => mask & (1 << i)).map(cardLabel);
  return 'hold ' + names.join(' · ');
}
