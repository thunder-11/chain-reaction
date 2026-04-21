/**
 * SoundEngine — synthesized sounds via Web Audio API. No audio files needed.
 * Provides sound effects for orb placement, chain reactions, explosions,
 * win fanfare, and invalid move feedback.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('cr-sound') !== 'off';
  }

  /**
   * Lazy-initialize the AudioContext (must be triggered by user gesture).
   */
  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  }

  /**
   * Soft sine plop at 440 Hz, 80 ms — played when an orb is placed.
   */
  playPlace() {
    if (!this.enabled) return;
    const ctx = this._ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Rising pitch: 300 + step*80 Hz, 60 ms — played on each chain step.
   */
  playChain(step) {
    if (!this.enabled) return;
    const ctx = this._ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 300 + step * 80;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  /**
   * Noise burst + low sine 80 Hz, 200 ms — played on explosion.
   */
  playExplode() {
    if (!this.enabled) return;
    const ctx = this._ctx();

    // Low sine
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 80;
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.2);
  }

  /**
   * Win fanfare: C5→E5→G5 each 150 ms.
   */
  playWin() {
    if (!this.enabled) return;
    const ctx = this._ctx();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.15);
    });
  }

  /**
   * Short low buzz, 60 ms — played on invalid move.
   */
  playInvalidMove() {
    if (!this.enabled) return;
    const ctx = this._ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 120;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  /**
   * Toggle sound on/off and persist to localStorage.
   */
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('cr-sound', this.enabled ? 'on' : 'off');
  }
}
