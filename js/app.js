(() => {
  'use strict';
  const root = document.querySelector('#book'), audio = new KeyboardAudio(), writer = new Typewriter(audio);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = -1, controller = new AbortController(), busy = false, nextReady = false, branchChoice = null;
  // Stable V1 addresses keep the frozen epilogue's closing destination intact.
  const EPILOGUE = 11, INTERLUDE = 10, LAST_PAGE = 8, CLOSING = 9;
  const order = [-1,0,1,2,3,4,5,6,INTERLUDE,7,LAST_PAGE,EPILOGUE,CLOSING];
  let eyesSequenceSeen = BookMemory.state.eyesSequenceSeen;
  const visited = new Set();
  const forward = () => index === CLOSING ? -1 : order[order.indexOf(index)+1];
  const backward = () => index === CLOSING ? LAST_PAGE : order[order.indexOf(index)-1];
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  function typeBlock(text, cls = '') {
    const p = el('p', `type-block ${cls}`); p.dataset.text = text;
    const ghost = el('span', 'ghost', text); ghost.setAttribute('aria-hidden', 'true');
    const typed = el('span', 'typed'); typed.setAttribute('aria-hidden','true');
    p.append(ghost, typed, el('span','sr-only',text)); return p;
  }
  function button(label, cls, action) { const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', action); return b; }
  function nextButton(label, action) { const b = button(label, 'text-button next', action); const arrow = el('span','arrow','→'); arrow.setAttribute('aria-hidden','true'); b.append(arrow); return b; }
  function updateChrome(theme) {
    document.body.dataset.theme = theme || 'paper';
    const value = order.indexOf(index), total = order.length-1;
    const progress = document.querySelector('.progress'); progress.setAttribute('aria-valuenow',value);
    progress.setAttribute('aria-valuemax',total);
    progress.querySelector('i').style.width = `${value / total * 100}%`;
    document.querySelector('#page-number').textContent = index < 0 ? 'PRÓLOGO' : index === INTERLUDE ? 'INTERLÚDIO' : `${String(value).padStart(2,'0')} / ${total}`;
    document.querySelector('#footer-label').textContent = index < 0 ? 'ESCRITO PARA VOCÊ' : 'MADUH · ARTHUR';
  }
  async function navigate(target) {
    if (busy) return;
    busy = true; nextReady = false;
    SecretLayer.beforeNavigate(index,target);
    if (target === -1 && root.childElementCount) { branchChoice = null; eyesSequenceSeen = false; visited.clear(); BookMemory.restart(); }
    controller.abort(); controller = new AbortController(); const signal = controller.signal;
    if (root.childElementCount && !motion.matches) await root.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: BOOK.timings.transition, fill:'forwards' }).finished;
    root.getAnimations().forEach(a => a.cancel()); root.replaceChildren(); index = target;
    window.scrollTo({ top:0, behavior:'instant' });
    if (index === -1) renderCover();
    else if (index === EPILOGUE) { updateChrome('epilogue'); busy = false; await epilogue(signal); return; }
    else { BookMemory.page(index); renderPage(BOOK.pages[index], signal); }
    if (!motion.matches) root.animate([{ opacity:0, transform:'translateY(9px)' }, { opacity:1, transform:'translateY(0)' }], { duration:BOOK.timings.transition });
    root.focus({ preventScroll:true }); busy = false;
  }
  function renderCover() {
    updateChrome('cover');
    const cover = el('article','cover');
    cover.append(el('p','cover-kicker',BOOK.decoration.kicker), el('h1','',BOOK.cover.title), el('p','subtitle',BOOK.cover.subtitle), button(BOOK.ui.start,'start',()=>navigate(0)), el('p','cover-note',BOOK.cover.note));
    const star = el('span','cover-mark','✳'); star.setAttribute('aria-hidden','true');
    const orbit = el('span','orbit'); orbit.setAttribute('aria-hidden','true'); cover.append(star,orbit); root.append(cover);
    SecretLayer.cover(cover,controller.signal,navigate);
  }
  async function renderPage(data, signal) {
    updateChrome(data.theme);
    const revisitEyes = data.effect === 'eyes' && eyesSequenceSeen;
    const article = el('article',`page ${data.theme === 'dedication' ? 'dedication' : ''} ${data.title.length > 35 ? 'long-title' : ''} ${data.effect === 'poem' ? 'poem' : ''} ${data.clean ? 'clean-page' : ''}`);
    article.dataset.visited = String(visited.has(index));
    article.dataset.phase = 'writing';
    article.setAttribute('aria-labelledby','chapter-title');
    const title = el('h1','',data.title); title.id = 'chapter-title';
    const side = el('span','page-side',BOOK.decoration.margin); side.setAttribute('aria-hidden','true');
    const star = el('span','little-star','✳'); star.setAttribute('aria-hidden','true');
    article.append(el('p','eyebrow',data.label),title);
    if (!data.clean && data.effect !== 'poem') article.append(side,star);
    const narrative = el('div','narrative');
    const paragraphs = data.paragraphs.map((t,i)=>typeBlock(t, i === data.emphasis ? 'emphasis' : data.effect === 'poem' && t === '“Será?”' ? 'poem-pivot' : '')); narrative.append(...paragraphs); article.append(narrative);
    let note;
    if (data.note) { note = typeBlock(data.note,'handwritten'); article.append(note); }
    const actions = el('nav','page-actions'); actions.setAttribute('aria-label','Navegação do livro');
    const back = button(`← ${BOOK.ui.back}`,'text-button back',()=>navigate(backward())); actions.append(back);
    const skip = button(BOOK.ui.skip,'skip',()=>writer.skip()); actions.append(skip);
    const next = nextButton(index === LAST_PAGE ? BOOK.ui.epilogue : index === CLOSING ? BOOK.ui.restart : BOOK.ui.next,()=>navigate(forward())); next.hidden = true; actions.append(next); article.append(actions); root.append(article);
    const finish = () => { if (signal.aborted) return; visited.add(index); article.dataset.phase='ready'; nextReady = true; skip.hidden = true; next.hidden = false; next.classList.add('ready'); if(index===CLOSING)BookMemory.complete();else SecretLayer.mount(article,index,signal); };
    if (revisitEyes) paragraphs.forEach(p=>{p.querySelector('.typed').textContent=p.dataset.text;});
    else await writer.write(paragraphs, { signal, reduced:motion.matches, ...(data.effect === 'poem' ? {speed:BOOK.timings.poemSpeed,paragraphPause:BOOK.timings.poemParagraph} : {}) });
    if (signal.aborted) return;
    skip.hidden = true;
    if (data.effect === 'eyes') {
      article.dataset.phase='eyes';
      if(!revisitEyes) await sleep(motion.matches ? 0 : 350,signal);
      if (signal.aborted) return;
      const complete = await BookAnimations.eyes(narrative,{signal,reduced:motion.matches,revisit:revisitEyes,onBack:()=>navigate(backward()),pupilAvailable:revisitEyes&&!BookMemory.has('pupilSecret'),pupilText:SECRETS.text.pupil,onPupilSecret:()=>{if(BookMemory.has('pupilSecret'))return false;BookMemory.discover('pupilSecret');return true;}});
      if (complete && !signal.aborted) { eyesSequenceSeen = true; BookMemory.eyes(); if(revisitEyes)BookMemory.discover('eyeRoll'); }
    }
    if (signal.aborted) return;
    if (data.effect === 'choice') {
      SecretLayer.mount(article,index,signal);
      const choice = el('section','choice ready'); choice.setAttribute('aria-label',BOOK.ui.question);
      choice.append(el('p','choice-label',BOOK.ui.question));
      const buttons = el('div','choice-buttons');
      const result = el('div','branch-result narrative');
      let answered = false;
      async function answer(value) {
        if (answered || signal.aborted) return; answered = true;
        yes.disabled = true; no.disabled = true;
        result.replaceChildren();
        if(value === 'yes') {
          const blocks=BOOK.branch.yes.map(t=>typeBlock(t)); result.append(...blocks);
          skip.hidden=false;
          await writer.write(blocks,{signal,reduced:motion.matches,paragraphPause:BOOK.timings.choicePause});
          if(signal.aborted)return;
          skip.hidden=true;yes.disabled=false;no.disabled=false;answered=false;
          no.focus({preventScroll:true});
          return;
        }
        branchChoice = value;
        if (value === 'no') await BookAnimations.chains(no,signal,motion.matches);
        if (signal.aborted) return;
        const blocks = BOOK.branch[value].map(t=>typeBlock(t)); result.append(...blocks);
        skip.hidden = false;
        await writer.write(blocks,{ signal,reduced:motion.matches }); finish();
      }
      const yes = button(BOOK.ui.yes,'choice-button',()=>answer('yes')), no = button(BOOK.ui.no,'choice-button',()=>answer('no'));
      buttons.append(yes,no); choice.append(buttons,result); article.insertBefore(choice,actions);
      if (branchChoice) answer(branchChoice);
      return;
    }
    if(data.effect === 'poem') {
      article.dataset.phase='poem-isolation';
      const isolation=el('section','poem-isolation');isolation.setAttribute('aria-label',data.title);
      const question=el('p','poem-question',data.paragraphs.find(t=>t==='“Será?”'));
      isolation.append(question,actions);document.body.append(isolation);
      article.inert=true;article.setAttribute('aria-hidden','true');
      const cleanup=()=>{isolation.remove();article.inert=false;article.removeAttribute('aria-hidden');};
      signal.addEventListener('abort',cleanup,{once:true});
      await sleep(motion.matches ? 700 : BOOK.timings.poemIsolate,signal);
      if(signal.aborted)return;
      const reread=button(BOOK.ui.readPoem,'text-button poem-reread',()=>{
        article.append(actions);cleanup();signal.removeEventListener('abort',cleanup);
        window.scrollTo({top:0,behavior:'instant'});root.focus({preventScroll:true});
      });
      isolation.append(reread);finish();root.focus({preventScroll:true});
      SecretLayer.fugitive(question,signal);
      return;
    }
    if (note) { skip.hidden = false; await writer.write([note],{signal,reduced:motion.matches}); }
    finish();
  }
  async function epilogue(signal) {
    const scene = el('section','epilogue'); scene.setAttribute('aria-label','Epílogo');
    const line = el('h1','epilogue-line'), text = el('span'), cursor = el('span','epilogue-cursor'); cursor.setAttribute('aria-hidden','true');
    line.append(text); scene.append(line); root.append(scene); root.focus({preventScroll:true});
    await sleep(BOOK.timings.black,signal); if (signal.aborted) return; line.append(cursor);
    async function write(value) { for (const char of value) { if (signal.aborted) return; text.textContent += char; audio.click(); await sleep(BOOK.timings.dramatic,signal); } }
    await write(BOOK.epilogue.first); await sleep(BOOK.timings.endingHold,signal);
    while(text.textContent.length && !signal.aborted) { text.textContent = text.textContent.slice(0,-1); audio.click(true); await sleep(BOOK.timings.backspace,signal); }
    await sleep(BOOK.timings.rethink,signal); await write(BOOK.epilogue.second); await sleep(BOOK.timings.endingHold,signal);
    if (signal.aborted) return;
    const below = el('div','epilogue-below'); below.append(el('p','epilogue-note',BOOK.epilogue.note)); scene.append(below);
    await sleep(BOOK.timings.reveal,signal); if(signal.aborted) return;
    below.append(button(BOOK.ui.continue,'text-button',()=>navigate(9))); nextReady = true;
  }
  root.addEventListener('click',event=>{ if (!event.target.closest('button,a') && index !== EPILOGUE && writer.active) writer.skip(); });
  document.querySelector('#home').addEventListener('click',event=>{ event.preventDefault(); if(index === EPILOGUE)return; navigate(-1); });
  document.querySelector('#sound').addEventListener('click',async()=>{ const enabled = await audio.toggle(); const control = document.querySelector('#sound'); await SecretLayer.setAudioEnabled(enabled); const label = enabled ? 'Som ligado' : 'Som desligado'; control.setAttribute('aria-pressed',String(enabled)); control.setAttribute('aria-label',label); control.title=label; document.querySelector('#sound-label').textContent = label; });
  document.addEventListener('keydown',event=>{
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('button,a')) return;
    if (index === EPILOGUE && !nextReady) return;
    if (['ArrowRight','ArrowLeft',' '].includes(event.key)) event.preventDefault();
    if (event.key === 'ArrowLeft' && index >= 0 && index !== EPILOGUE) navigate(backward());
    else if (event.key === 'ArrowRight' || event.key === ' ') {
      if (writer.active && index !== EPILOGUE) writer.skip();
      else if(index === -1) navigate(0);
      else if(nextReady) navigate(forward());
    }
  });
  // Algumas variáveis não precisam de um valor definitivo. Ainda.
  SecretLayer.music();
  navigate(-1);
})();
