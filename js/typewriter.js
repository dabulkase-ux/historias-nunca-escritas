window.sleep = (ms, signal) => new Promise(resolve => {
  if (signal?.aborted) return resolve();
  const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', done); resolve(); };
  const timer = setTimeout(done, ms); signal?.addEventListener('abort', done, { once: true });
});
window.Typewriter = class {
  constructor(audio) { this.audio = audio; this.active = false; this.skipRequested = false; this.runId = 0; }
  skip() { this.skipRequested = true; }
  async write(elements, { signal, speed = BOOK.timings.fast, reduced = false, paragraphPause = BOOK.timings.paragraph } = {}) {
    const runId = ++this.runId;
    this.active = true; this.skipRequested = false;
    for (const element of elements) {
      if (signal.aborted) break;
      const text = element.dataset.text;
      const output = element.querySelector('.typed');
      element.classList.add('writing');
      let count = 0; let previous = performance.now();
      while (count < text.length && !signal.aborted) {
        if (this.skipRequested || reduced) count = text.length;
        else { const now = performance.now(); count = Math.min(text.length, count + Math.max(1, Math.floor((now - previous) / speed))); previous = now; }
        output.textContent = text.slice(0, count);
        if (!this.skipRequested && !reduced) this.audio.click();
        if (count < text.length) await sleep(Math.max(16, speed), signal);
      }
      element.classList.remove('writing');
      if (!this.skipRequested && !reduced) await sleep(paragraphPause, signal);
    }
    if (runId === this.runId) this.active = false;
  }
};
