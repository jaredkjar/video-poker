# Jacks or Better · Video Poker

A personal video poker game — full-pay 9/6 Jacks or Better, the same game as the
casino machines. Built with React + TypeScript + Vite.

**Play it live: https://jaredkjar.github.io/video-poker/**

## Deploy

Hosted on GitHub Pages. To ship a new version:

```
npm run deploy
```

(builds and pushes `dist/` to the `gh-pages` branch — live in about a minute)

## Run locally

```
npm install
npm run dev
```

Then open http://localhost:5173.

To play on your phone or tablet, run `npm run dev:lan` instead and open the
"Network" URL Vite prints (your PC and phone must be on the same Wi-Fi).

## Features

- **Player profiles** — pick your name on the login screen and your credits,
  settings, and stats are saved per player (locally, in the browser). The last
  player is remembered between visits. Guest mode plays without saving anything.
- **Per-player stats** — hands played and won with win rate, total wagered/won
  with return %, biggest win, how often you made the optimal hold, and a count
  of every winning hand type you've hit. Open with the "Stats" link in the footer.
- **Full-pay 9/6 paytable** with the 4000-credit royal at max bet (5 coins)
- **Credits persist** in localStorage — add more anytime with the `+` button next
  to the credits display (it's all play money)
- **Hint button** — computes the mathematically optimal hold by exhaustively
  evaluating all 32 hold combinations against every possible draw (~2.6M hands,
  runs in a web worker so it's ready almost instantly after each deal)
- **Trainer mode** (off by default) — after every draw, tells you whether your
  hold was optimal, and if not, what the best play was and how much EV you gave up
- **Credits or dollars** — click the credits meter (or use the footer toggle) to
  switch the displays between credits and real-money amounts, with a selectable
  denomination (25¢ / 50¢ / $1 per credit)
- **Session stats** — hands played, wagered, won, and your return percentage
- **Settings (⚙)** — four table themes (Emerald, Midnight, Ruby, Amethyst),
  three text sizes for readability, and the dollar denomination. Saved on the
  device, shared across profiles.
- **Works on phones and tablets** — responsive layout with large touch targets
- Keyboard play: `1`–`5` toggle holds, `Space`/`Enter` deals/draws, `H` for hint

## Code layout

- `src/game/` — pure game logic: cards/hand evaluation (`cards.ts`), exact EV
  strategy (`strategy.ts` + worker), profiles/stats persistence (`stats.ts`),
  display prefs (`prefs.ts`), sounds
- `src/hooks/` — stateful building blocks: `useGameRound` (deal → hold → draw
  state machine with animations), `useProfiles` (sign-in + persistence),
  `useStrategyWorker`, `usePrefs`, `useKeyboardControls`, `useCountUp`
- `src/components/` — presentational pieces: cards, paytable, console,
  status bar, login screen, and the modals
- `src/App.tsx` — thin composition layer wiring hooks to components
