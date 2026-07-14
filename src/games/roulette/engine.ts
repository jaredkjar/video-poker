// European (single-zero) roulette: bet resolution and the wheel RNG.

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type RouletteColor = 'red' | 'black' | 'green';

export const colorOf = (n: number): RouletteColor =>
  n === 0 ? 'green' : RED_NUMBERS.has(n) ? 'red' : 'black';

/**
 * Bet ids: `n0`..`n36` straight up, `red`/`black`, `even`/`odd`, `low`(1-18)/
 * `high`(19-36), `d1`/`d2`/`d3` dozens, `c1`/`c2`/`c3` columns (c1 = 1,4,…34).
 */
export type BetId = string;

/** Credits returned per credit staked on `id` when `n` hits (0 = bet lost, stake included). */
export function betReturn(id: BetId, n: number): number {
  if (id.startsWith('n')) return Number(id.slice(1)) === n ? 36 : 0;
  if (n === 0) return 0; // zero beats every outside bet
  switch (id) {
    case 'red':
      return RED_NUMBERS.has(n) ? 2 : 0;
    case 'black':
      return RED_NUMBERS.has(n) ? 0 : 2;
    case 'even':
      return n % 2 === 0 ? 2 : 0;
    case 'odd':
      return n % 2 === 1 ? 2 : 0;
    case 'low':
      return n <= 18 ? 2 : 0;
    case 'high':
      return n >= 19 ? 2 : 0;
    case 'd1':
      return n <= 12 ? 3 : 0;
    case 'd2':
      return n >= 13 && n <= 24 ? 3 : 0;
    case 'd3':
      return n >= 25 ? 3 : 0;
    case 'c1':
      return n % 3 === 1 ? 3 : 0;
    case 'c2':
      return n % 3 === 2 ? 3 : 0;
    case 'c3':
      return n % 3 === 0 ? 3 : 0;
    default:
      return 0;
  }
}

export type Bets = Record<BetId, number>;

/** Total credits returned for a spin of `n` across all placed bets. */
export function resolveBets(bets: Bets, n: number): number {
  let returned = 0;
  for (const [id, amount] of Object.entries(bets)) returned += amount * betReturn(id, n);
  return returned;
}

/** Uniform 0..36 from the cryptographic RNG (rejection sampling avoids modulo bias). */
export function spinWheel(): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / 37) * 37;
  let r: number;
  do {
    crypto.getRandomValues(buf);
    r = buf[0];
  } while (r >= limit);
  return r % 37;
}
