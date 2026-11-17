export function createAudio(onEnable) {
  let context = null;
  let musicClock = 0;
  let beat = 0;
  let enabled = false;
  function enable() {
    if (enabled) return;
    context = new (window.AudioContext || window.webkitAudioContext)();
    context.resume(); enabled = true; onEnable?.();
  }
  function tone(frequency, duration, type = 'sine', volume = 0.04, slide = 0) {
    if (!context || !enabled) return;
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), start + duration);
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + duration);
  }
  return {
    get enabled() { return enabled; },
    unlock() { enable(); },
    toggle() { if (enabled) { enabled = false; } else enable(); },
    pulse() { tone(540, 0.11, 'triangle', 0.025, -220); },
    hit() { tone(170, 0.24, 'sawtooth', 0.045, -110); },
    dash() { tone(290, 0.35, 'sine', 0.055, 620); },
    collect() { tone(780, 0.2, 'sine', 0.035, 360); },
    tick(dt) {
      if (!enabled) return;
      musicClock += dt;
      if (musicClock < 0.42) return;
      musicClock -= 0.42;
      const notes = [110, 164.81, 220, 164.81, 130.81, 196, 261.63, 196];
      tone(notes[beat % notes.length], 0.75, 'sine', 0.012);
      if (beat % 4 === 0) tone(notes[(beat + 2) % notes.length] * 2, 0.22, 'triangle', 0.008);
      beat++;
    },
  };
}
