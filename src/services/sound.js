// Synthesised sound effects with the Web Audio API — no audio files to load.
let ctx = null;
let enabled = true;
let volume = 0.7;

function context() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, start, duration, { type = 'sine', gain = 0.25, slideTo = null } = {}) {
  const ac = context();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * volume, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

const EFFECTS = {
  click: () => tone(660, 0, 0.06, { type: 'triangle', gain: 0.12 }),
  correct: () => {
    tone(523, 0, 0.12, { type: 'triangle' });
    tone(659, 0.09, 0.12, { type: 'triangle' });
    tone(784, 0.18, 0.22, { type: 'triangle' });
  },
  wrong: () => {
    tone(196, 0, 0.32, { type: 'sawtooth', gain: 0.16 });
    tone(185, 0.02, 0.32, { type: 'square', gain: 0.08 });
  },
  timeout: () => tone(520, 0, 0.5, { type: 'square', gain: 0.14, slideTo: 140 }),
  tick: () => tone(1100, 0, 0.04, { type: 'square', gain: 0.07 }),
  power: () => tone(440, 0, 0.18, { type: 'triangle', gain: 0.18, slideTo: 990 }),
  steal: () => {
    tone(392, 0, 0.1, { type: 'square', gain: 0.12 });
    tone(392, 0.13, 0.1, { type: 'square', gain: 0.12 });
  },
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3, { type: 'triangle', gain: 0.22 }));
    tone(1047, 0.55, 0.6, { type: 'sine', gain: 0.18 });
  },
};

export const sound = {
  configure({ sound: on, volume: v }) {
    enabled = on !== false;
    if (typeof v === 'number') volume = v;
  },
  play(name) {
    if (!enabled) return;
    try {
      EFFECTS[name]?.();
    } catch {
      /* audio blocked */
    }
  },
  unlock() {
    if (enabled) context();
  },
};
