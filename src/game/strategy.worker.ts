import { bestHolds, type HoldEV } from './strategy.ts';
import type { Card } from './cards.ts';

export interface StrategyRequest {
  seq: number;
  cards: Card[];
  bet: number;
}

export interface StrategyResponse {
  seq: number;
  results: HoldEV[];
}

self.onmessage = (e: MessageEvent<StrategyRequest>) => {
  const { seq, cards, bet } = e.data;
  const results = bestHolds(cards, bet);
  postMessage({ seq, results } satisfies StrategyResponse);
};
