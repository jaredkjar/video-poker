import { useEffect, useRef, type RefObject } from 'react';
import type { Card } from '../game/cards';
import type { HoldEV } from '../game/strategy';
import type { StrategyRequest, StrategyResponse } from '../game/strategy.worker';

export interface StrategyHandle {
  /** Kick off an EV calculation for a freshly dealt hand. */
  request: (cards: Card[], bet: number) => void;
  /** Latest results, or null while calculating / before any request. */
  resultsRef: RefObject<HoldEV[] | null>;
}

/** Owns the strategy web worker; stale responses are dropped by sequence number. */
export function useStrategyWorker(): StrategyHandle {
  const workerRef = useRef<Worker | null>(null);
  const seqRef = useRef(0);
  const resultsRef = useRef<HoldEV[] | null>(null);

  useEffect(() => {
    const w = new Worker(new URL('../game/strategy.worker.ts', import.meta.url), {
      type: 'module',
    });
    w.onmessage = (e: MessageEvent<StrategyResponse>) => {
      if (e.data.seq === seqRef.current) resultsRef.current = e.data.results;
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  const request = (cards: Card[], bet: number) => {
    const seq = ++seqRef.current;
    resultsRef.current = null;
    workerRef.current?.postMessage({ seq, cards, bet } satisfies StrategyRequest);
  };

  return { request, resultsRef };
}
