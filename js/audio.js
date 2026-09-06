window.KeyboardAudio = class {
  constructor() { this.enabled = false; this.context = null; this.last = 0; }
  async toggle() {
    try {
      if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') await this.context.resume();
      this.enabled = !this.enabled;
    } catch { this.enabled = false; }
    return this.enabled;
  }
  click(backspace = false) {
    if (!this.enabled || !this.context || performance.now() - this.last < 45) return;
    this.last = performance.now();
    const ctx = this.context, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(backspace ? 380 : 720, ctx.currentTime);
    gain.gain.setValueAtTime(0.012, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.023);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.025);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
};
