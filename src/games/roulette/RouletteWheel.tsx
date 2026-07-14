import { useEffect, useState, type CSSProperties } from 'react';
import { colorOf } from './engine';

/** Pocket order around a real European wheel, clockwise from the zero. */
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const SEG = 360 / 37;

/** How long the wheel takes to come to rest — keep the game loop in sync. */
export const SPIN_MS = 4000;

const POCKET_FILL = { green: '#1d6b45', red: '#8f2231', black: '#191d24' } as const;

const point = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
};

// Donut segment centered on pocket i (angles measured clockwise from 12 o'clock)
function segPath(i: number): string {
  const a0 = (i - 0.5) * SEG;
  const a1 = (i + 0.5) * SEG;
  return (
    `M ${point(100, a0)} A 100 100 0 0 1 ${point(100, a1)} ` +
    `L ${point(62, a1)} A 62 62 0 0 0 ${point(62, a0)} Z`
  );
}

const VIEW = '-114 -114 228 228';

interface Props {
  /** The pocket the ball must land in. */
  target: number;
}

/**
 * Full-screen flourish while the ball is in play: the wheel spins clockwise,
 * the ball counter-rotates, and both decelerate so the winning pocket ends
 * under the pointer (with the ball inside it) after SPIN_MS.
 *
 * The rotating parts are whole stacked <svg> elements rather than inner
 * <g> groups — CSS transform-origin on SVG groups is unreliable in some
 * browsers, but on the svg elements themselves it behaves like any HTML box.
 */
export function RouletteWheel({ target }: Props) {
  const [going, setGoing] = useState(false);

  // Two frames after mount so the initial transforms paint before transitioning
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setGoing(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const index = Math.max(0, WHEEL_ORDER.indexOf(target));
  // Four full clockwise turns, ending with the winning pocket at 12 o'clock
  const wheelDeg = going ? 4 * 360 + (360 - index * SEG) : 0;
  // The ball orbits the other way and settles at the pointer
  const ballDeg = going ? 0 : 3 * 360;

  const spin = (deg: number): CSSProperties => ({
    transform: `rotate(${deg}deg)`,
    transition: `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.28, 1)`,
  });

  return (
    <div className="wheel-overlay" aria-hidden="true">
      <div className="wheel-stack">
        <svg viewBox={VIEW}>
          <circle r="106" fill="#0b0e14" stroke="#3a4150" strokeWidth="3" />
        </svg>
        <svg viewBox={VIEW} style={spin(wheelDeg)}>
          {WHEEL_ORDER.map((n, i) => (
            <path
              key={n}
              d={segPath(i)}
              fill={POCKET_FILL[colorOf(n)]}
              stroke="#0b0e14"
              strokeWidth="1"
            />
          ))}
          {WHEEL_ORDER.map((n, i) => (
            <text
              key={`t${n}`}
              transform={`rotate(${i * SEG}) translate(0 -83)`}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#f2f4f7"
            >
              {n}
            </text>
          ))}
          <circle r="62" fill="#0b0e14" />
          <circle r="56" fill="none" stroke="#a8895a" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1="0"
              y1="-14"
              x2="0"
              y2="-54"
              stroke="#a8895a"
              strokeWidth="3"
              transform={`rotate(${a})`}
            />
          ))}
          <circle r="14" fill="#e9bd5a" />
          <circle r="5" fill="#0b0e14" />
        </svg>
        <svg viewBox={VIEW} style={spin(ballDeg)}>
          <circle cy="-72" r="5" fill="#f5f2ea" />
        </svg>
        <svg viewBox={VIEW}>
          <path d="M -8 -113 L 8 -113 L 0 -97 Z" fill="#e9bd5a" />
        </svg>
      </div>
    </div>
  );
}
