// Mode-aware betting chips. Bets are always stored in credits; only the
// increments offered (and their labels) follow the active display mode, so
// the amounts read as round numbers in whichever unit the player is viewing.

/**
 * Chip increments in credits for the active display mode.
 *
 * Credits mode: the classic 1 / 5 / 10 / 25.
 * Dollars mode: one credit (the smallest possible bet), then $1 / $5 / $25
 * converted to credits. Every denomination divides $1 evenly, so these are
 * always whole credits. At a $1 denomination credits already are round
 * dollars, so the credit set is kept as-is.
 */
export function chipValues(dollars: boolean, denom: number): number[] {
  if (!dollars || denom >= 1) return [1, 5, 10, 25];
  return [1, Math.round(1 / denom), Math.round(5 / denom), Math.round(25 / denom)];
}

/**
 * Compact label for a chip or staked amount: "25" in credits mode;
 * "25¢", "$1", "$6.25" in dollars mode (no trailing ".00").
 */
export function chipLabel(credits: number, dollars: boolean, denom: number): string {
  if (!dollars) return String(credits);
  const d = credits * denom;
  if (d < 1) return `${Math.round(d * 100)}¢`;
  return Number.isInteger(d) ? `$${d}` : `$${d.toFixed(2)}`;
}
