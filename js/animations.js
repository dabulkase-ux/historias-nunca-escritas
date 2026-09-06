window.BookAnimations = {
  eyes(container, options) { return EyesScene.play(container, options); },
  async chains(button, signal, reduced) {
    button.classList.add('locked');
    for (const name of ['chain', 'chain second', 'lock']) { const el = document.createElement('span'); el.className = name; el.setAttribute('aria-hidden','true'); button.append(el); }
    if (!reduced) await sleep(BOOK.timings.chain, signal);
  }
};
