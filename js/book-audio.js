window.BookAudio = class {
  constructor(tracks) {
    this.main = this.create(tracks.main.src, .34);
    this.strawberry = this.create(tracks.strawberry.src, .42);
    this.mainWasPlaying = false;
    this.strawberrySession = false;
    this.enabled = false;
    this.onMainChange = () => {};
    this.onStrawberryChange = () => {};
    this.strawberry.addEventListener('ended', () => this.finishStrawberry());
  }
  create(src, volume) {
    const audio = new Audio(src);
    audio.preload = 'metadata';
    audio.volume = volume;
    return audio;
  }
  async play(audio) {
    try { await audio.play(); return true; }
    catch { return false; }
  }
  async toggleMain() {
    if (!this.enabled) return false;
    if (!this.main.paused) { this.main.pause(); this.onMainChange(false); return false; }
    if (!this.strawberry.paused) this.pauseStrawberry();
    const playing = await this.play(this.main);
    this.onMainChange(playing && !this.main.paused);
    return playing && !this.main.paused;
  }
  async startStrawberry() {
    if (!this.enabled) return false;
    if (!this.strawberry.paused) { this.strawberry.pause(); this.onStrawberryChange(false); return false; }
    if (!this.strawberrySession) {
      this.mainWasPlaying = !this.main.paused;
      if (this.mainWasPlaying) { this.main.pause(); this.onMainChange(false); }
      this.strawberrySession = true;
    }
    const playing = await this.play(this.strawberry);
    if (!playing) {
      this.strawberrySession = false;
      if (this.mainWasPlaying) this.resumeMain();
      this.mainWasPlaying = false;
    }
    this.onStrawberryChange(playing && !this.strawberry.paused);
    return playing && !this.strawberry.paused;
  }
  pauseStrawberry() {
    if (this.strawberry.paused) return;
    this.strawberry.pause();
    this.onStrawberryChange(false);
  }
  resumeMain() {
    if (!this.enabled) return;
    this.play(this.main).then(playing => this.onMainChange(playing && !this.main.paused));
  }
  async setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.main.pause();
      this.pauseStrawberry();
      this.strawberrySession = false;
      this.mainWasPlaying = false;
      this.onMainChange(false);
      return false;
    }
    const playing = await this.play(this.main);
    this.onMainChange(playing && !this.main.paused);
    return playing && !this.main.paused;
  }
  finishStrawberry() {
    this.strawberry.pause();
    this.onStrawberryChange(false);
    if (this.strawberrySession && this.mainWasPlaying) this.resumeMain();
    this.strawberrySession = false;
    this.mainWasPlaying = false;
  }
  closeStrawberry() {
    this.pauseStrawberry();
    if (this.strawberrySession && this.mainWasPlaying) this.resumeMain();
    this.strawberrySession = false;
    this.mainWasPlaying = false;
  }
};
