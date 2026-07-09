let enabled = true;
let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function setEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null; // audio unavailable — play silently
  }
}

/** A short buffer of white noise, reused for every card sound. */
function noise(context: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(context.sampleRate * 0.3);
  const buf = context.createBuffer(1, len, context.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

interface ToneOpts {
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  when?: number;
}

function tone(freq: number, { dur = 0.08, type = 'triangle', gain = 0.05, when = 0 }: ToneOpts = {}) {
  const context = audio();
  if (!enabled || !context) return;
  const t = context.currentTime + when;
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(context.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/**
 * A dealt card: a quick filtered-noise "fwip" (the card sliding off the deck)
 * layered with a soft low "tap" as it lands on the felt — like the flick of a
 * real card, not a beep. Pitch varies slightly per position for realism.
 */
export function dealTick(i: number) {
  const context = audio();
  if (!enabled || !context) return;
  const t = context.currentTime;

  const src = context.createBufferSource();
  src.buffer = noise(context);
  src.playbackRate.value = 0.92 + i * 0.05;
  const hp = context.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1300;
  const bp = context.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2500 + i * 130;
  bp.Q.value = 0.7;
  const g = context.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.14, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  src.connect(hp).connect(bp).connect(g).connect(context.destination);
  src.start(t);
  src.stop(t + 0.12);

  const thump = context.createOscillator();
  const tg = context.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(190, t);
  thump.frequency.exponentialRampToValueAtTime(95, t + 0.06);
  tg.gain.setValueAtTime(0.07, t);
  tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  thump.connect(tg).connect(context.destination);
  thump.start(t);
  thump.stop(t + 0.1);
}

/** Holding/releasing a card — a soft, short chip-like click. */
export function holdClick() {
  const context = audio();
  if (!enabled || !context) return;
  const t = context.currentTime;
  const src = context.createBufferSource();
  src.buffer = noise(context);
  src.playbackRate.value = 1.6;
  const hp = context.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2200;
  const g = context.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(hp).connect(g).connect(context.destination);
  src.start(t);
  src.stop(t + 0.06);
  tone(420, { dur: 0.05, type: 'sine', gain: 0.03 });
}

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

/** Extra flourish layered under a big win — a bright rising arpeggio sparkle. */
export const jackpot = () => {
  const rising = [784, 988, 1175, 1568, 1976, 2637];
  rising.forEach((f, i) => tone(f, { dur: 0.18, type: 'triangle', gain: 0.05, when: 0.5 + i * 0.08 }));
};
