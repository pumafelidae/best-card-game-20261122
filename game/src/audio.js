// Ember & Tide — sound. Tiny WebAudio bleeps, synthesized in the browser,
// no audio files. A soft blip when a card is played, a low thud when
// damage lands, a rising arpeggio on victory. Muted by default until the
// player turns sound on, so the game never surprises anyone.

let context = null;
let enabled = false;

export function setSoundEnabled(on) {
  enabled = on;
  if (on && !context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) context = new AudioContext();
  }
  if (context && context.state === 'suspended') context.resume();
}

export function isSoundEnabled() {
  return enabled;
}

function tone(frequency, seconds, type, volume) {
  if (!enabled || !context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type || 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume || 0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + seconds);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + seconds);
}

export function playCardSound() {
  tone(520, 0.12, 'triangle', 0.08);
}

export function damageSound() {
  tone(140, 0.2, 'sawtooth', 0.07);
}

export function winSound() {
  tone(523, 0.15, 'sine', 0.09);
  window.setTimeout(() => tone(659, 0.15, 'sine', 0.09), 120);
  window.setTimeout(() => tone(784, 0.3, 'sine', 0.09), 240);
}

export function loseSound() {
  tone(392, 0.25, 'sine', 0.08);
  window.setTimeout(() => tone(311, 0.4, 'sine', 0.08), 200);
}
