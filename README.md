# Lucky Jack's Casino

**Play it: [jacksorbetter.dev](https://jacksorbetter.dev)**

I play a lot of video poker at the casino and wanted a way to practice full-pay
9/6 Jacks or Better without feeding a machine — so I built my own. Then it grew
a lobby, a blackjack table, and a roulette wheel. Same odds as the real thing,
play money.

## The games

**Video Poker** — full-pay 9/6 Jacks or Better with the 4,000-credit royal at
max bet. **Hint** computes the mathematically optimal hold for the dealt hand
by brute-forcing all 32 holds against every possible draw (~2.6M hands, in a
web worker), and **Trainer** grades every play you make against it.

**Blackjack** — single deck, shuffled every hand. Dealer stands on all 17s,
blackjack pays 3:2, double down on any first two cards.

**Roulette** — American double-zero table with straight-up, color, odd/even,
high/low, dozen, and column bets. An animated wheel (authentic pocket order)
spins every result, and the table keeps a persistent last-spins history.

**Ultimate Texas Hold'em** — heads-up hold'em against the dealer with the
real betting structure: raise 3×/4× preflop, 2× on the flop, or bet 1× / fold
at the river. Blind pays up to 500:1, optional Trips side bet, and a
best-five-of-seven evaluator with full kicker-level tiebreakers.

## Shared across every game

- Player profiles — everyone in the house gets their own bankroll, settings,
  and stats, saved in the browser; guest mode saves nothing
- One balance follows you from game to game
- Per-game stats: win rates, return %, biggest wins, poker hand frequencies,
  blackjacks, and how often you found the optimal hold
- Credits or dollars display with 25¢/50¢/$1 denominations — betting chips
  come in round amounts in whichever unit you're viewing
- Four table themes, adjustable text size, and a How to Play guide per game
- Works on desktop and phones (installable PWA); poker plays from the
  keyboard with 1–5, Space, and H

## The odds are real

Everything random comes from the browser's crypto RNG with rejection sampling,
so no outcome is ever biased. Cards are dealt from a full 52-card deck
shuffled with Fisher–Yates — I've verified 500k dealt hands against the exact
5-card poker probabilities, and the strategy engine's EVs match published 9/6
numbers to four decimal places (high pair 1.5365, low pair 0.8237). Perfect
play returns 99.54%. The roulette wheel is a uniform draw over all 38 pockets
(house edge 5.26%, like Vegas).

For entertainment and practice only — no real wagering.

## Development

React + TypeScript + Vite, no backend.

```
npm install
npm run dev      # local dev at localhost:5173
npm run dev:lan  # play from your phone on the same network
npm run deploy   # build + publish to GitHub Pages
```

Layout:

- `src/game/` — shared logic: cards, chips, profile persistence, sounds,
  and the poker hand evaluator / exact-EV strategy
- `src/games/` — one folder per game: `poker/`, `blackjack/`, `roulette/`,
  `uth/` (each with its own engine and table screen)
- `src/hooks/` — `useGameRound` (poker's deal → hold → draw machine),
  `useProfiles`, `useStrategyWorker`, and friends
- `src/components/` — the lobby, login screen, cards, paytable, and modals
- `src/App.tsx` — the shell: login → game select → game, plus shared modals

The version shown on the landing page comes from `package.json` at build time.

## License

MIT
