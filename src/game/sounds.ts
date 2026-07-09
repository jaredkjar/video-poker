let enabled = true;
let ctx: AudioContext | null = null;

export function setEnabled(on: boolean) {
  enabled = on;
}

interface ToneOpts {
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  when?: number;
}

function tone(freq: number, { dur = 0.08, type = 'triangle', gain = 0.05, when = 0 }: ToneOpts = {}) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch {
    // audio unavailable — play silently
  }
}

export const dealTick = (i: number) => tone(520 + i * 55, { dur: 0.06, type: 'square', gain: 0.025 });
export const holdClick = () => tone(340, { dur: 0.07, type: 'sine', gain: 0.06 });
export const blip = () => tone(620, { dur: 0.05, type: 'sine', gain: 0.04 });

export const lose = () => {
  tone(220, { dur: 0.16, type: 'sine', gain: 0.035 });
  tone(165, { dur: 0.26, type: 'sine', gain: 0.035, when: 0.13 });
};

export const win = (multiplier: number) => {
  const notes =
    multiplier >= 25
      ? [523, 659, 784, 1047, 1319, 1568, 2093]
      : multiplier >= 6
        ? [523, 659, 784, 1047, 1319]
        : [523, 659, 784];
  notes.forEach((f, i) => tone(f, { dur: 0.13, type: 'triangle', gain: 0.06, when: i * 0.09 }));
};
