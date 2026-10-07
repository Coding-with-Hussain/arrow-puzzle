/**
 * Tiny synthesized sound kit. No audio files are needed, and the AudioContext
 * is only created or resumed from a user gesture to respect autoplay rules.
 */
let context = null;
let master = null;
let enabled = true;

function getContext() {
  if (context) return context;
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0.9;
    master.connect(context.destination);
  } catch {
    context = null;
  }
  return context;
}

export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

/** Call from a pointer/keyboard handler so later sounds are allowed to play. */
export function unlockAudio() {
  if (!enabled) return;
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(ctx, { type = 'sine', from, to = from, duration, volume, delay = 0, filter }) {
  const start = ctx.currentTime + delay;
  const end = start + duration;

  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, end);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.012, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  let output = gain;
  if (filter) {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = filter;
    gain.connect(lowpass);
    output = lowpass;
  }

  oscillator.connect(gain);
  output.connect(master);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

const SOUNDS = {
  click: (ctx) => tone(ctx, { type: 'sine', from: 720, to: 520, duration: 0.05, volume: 0.05 }),
  // `progress` (0–1) raises the pitch as the board empties, which feels like momentum.
  move: (ctx, { progress = 0 } = {}) => {
    const base = 340 + progress * 260;
    tone(ctx, { type: 'triangle', from: base, to: base * 2.4, duration: 0.16, volume: 0.07 });
    tone(ctx, { type: 'sine', from: base * 2, to: base * 3, duration: 0.09, volume: 0.025, delay: 0.03 });
  },
  blocked: (ctx) => {
    tone(ctx, { type: 'square', from: 150, to: 90, duration: 0.13, volume: 0.05, filter: 700 });
    tone(ctx, { type: 'sine', from: 110, to: 70, duration: 0.12, volume: 0.07 });
  },
  hint: (ctx) => {
    tone(ctx, { type: 'sine', from: 880, duration: 0.12, volume: 0.045 });
    tone(ctx, { type: 'sine', from: 1320, duration: 0.18, volume: 0.04, delay: 0.08 });
  },
  star: (ctx, { index = 0 } = {}) =>
    tone(ctx, { type: 'triangle', from: 660 * 1.26 ** index, duration: 0.18, volume: 0.06 }),
  complete: (ctx) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) =>
      tone(ctx, { type: 'triangle', from: frequency, duration: 0.32, volume: 0.06, delay: i * 0.085 }),
    );
  },
};

export function playSound(name, options) {
  if (!enabled) return;
  const ctx = getContext();
  const sound = SOUNDS[name];
  if (!ctx || !sound || ctx.state !== 'running') return;
  try {
    sound(ctx, options);
  } catch {
    // Audio is decoration; never let it break gameplay.
  }
}
