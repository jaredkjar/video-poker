# Jacks or Better

**Play it: [jacksorbetter.dev](https://jacksorbetter.dev)**

I play a lot of video poker at the casino and wanted a way to practice full-pay
9/6 Jacks or Better without feeding a machine — so I built my own. Same
paytable, same odds, play money.

## What it does

- Full-pay 9/6 Jacks or Better with the 4,000-credit royal at max bet
- Player profiles — everyone in the house gets their own bankroll and stats,
  saved in the browser; guest mode saves nothing
- **Hint** computes the mathematically optimal hold for the dealt hand by
  brute-forcing all 32 holds against every possible draw (~2.6M hands, in a
  web worker), and **Trainer** grades every play you make against it
- Per-player stats: win rate, return %, biggest win, hand frequencies, and how
  often you found the optimal hold
- Credits or dollars display with 25¢/50¢/$1 denominations, four table themes,
  adjustable text size, and a How to Play guide
- Works on desktop and phones; keyboard play with 1–5, Space, and H

## The odds are real

Cards come from a full 52-card deck shuffled with rejection-sampled
Fisher–Yates over the crypto RNG, so every ordering is exactly equally likely.
I've verified 500k dealt hands against the exact 5-card poker probabilities,
and the strategy engine's EVs match published 9/6 numbers to four decimal
places (high pair 1.5365, low pair 0.8237). Perfect play returns 99.54%.

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

- `src/game/` — pure logic: hand evaluation, exact-EV strategy, profile
  persistence, sounds
- `src/hooks/` — `useGameRound` (the deal → hold → draw machine),
  `useProfiles`, `useStrategyWorker`, and friends
- `src/components/` — the table, cards, paytable, and modals
- `src/App.tsx` — wires it all together

## License

MIT
