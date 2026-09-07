/* Marginalia are mounted only after reading is ready, and owned by that page's signal. */
window.SecretLayer = (() => {
  const active=new Set(),session={pages:new Set(),shyUsed:false,survivalUsed:false,sixPassed:false,started:false};
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  function scope(parentSignal){
    const controller=new AbortController(),signal=controller.signal,animations=new Set(),owned=new Set();
    const abort=()=>controller.abort();parentSignal?.addEventListener('abort',abort,{once:true});active.add(controller);
    signal.addEventListener('abort',()=>{for(const a of animations)a.cancel();for(const n of owned)n.remove();active.delete(controller);parentSignal?.removeEventListener('abort',abort);},{once:true});
    return {signal,own(n){owned.add(n);return n;},on(n,event,fn){n.addEventListener(event,fn,{signal});},
      async wait(ms){await sleep(ms,signal);return !signal.aborted;},
      async animate(n,frames,duration=420){if(signal.aborted)return;const a=n.animate(frames,{duration:reduced()?1:duration,fill:'forwards',easing:'ease-in-out'});animations.add(a);await a.finished.catch(()=>{});animations.delete(a);},
      abort};
  }
  function button(kind,label){const b=node('button','ink-button '+kind);b.type='button';b.setAttribute('aria-label',label);return b;}
  function ink(kind){
    const n=node('span','ink-art '+kind);n.setAttribute('aria-hidden','true');
    if(kind==='strawberry')n.innerHTML='<svg viewBox="0 0 52 58"><path d="M12 21C6 33 19 49 26 51c8-4 21-20 14-30-7-7-22-7-28 0Z"/><path class="leaf" d="m26 21-11-8 9 1 4-8 2 9 10-1-9 8M27 15l1-10"/><path d="m17 27 1 2m10-5-1 2m8 3-1 2m-13 2 1 2m8 0-1 3m-4 3 1 2"/></svg>';
    if(kind==='scar')n.innerHTML='<svg viewBox="0 0 84 40"><path d="m5 25 12-7 7 3 13-7 8 4 13-7 18 2M19 12l4 15m11-19 4 14m10-13 4 12m10-18 2 15"/></svg>';
    if(kind==='eye')n.innerHTML='<svg viewBox="0 0 62 34"><path d="M4 18Q28-6 57 16 30 39 4 18Z"/><ellipse cx="31" cy="17" rx="7" ry="10"/><path d="M30 12q-4 6 1 10m-16-9-2-4m33 2 3-4"/></svg>';
    if(kind==='shy'){
      const portrait=node('span','shy-portrait');
      Array.from('()acv.,ir()o.o,,uvu()').forEach((char,i)=>{const p=node('i','',char);const t=i/20*Math.PI*2;p.style.left=(24+Math.cos(t)*18)+'px';p.style.top=(23+Math.sin(t)*21)+'px';portrait.append(p);});
      portrait.append(node('span','shy-gaze','· ·'),node('span','shy-hand left','( m'),node('span','shy-hand right','m )'));n.append(portrait);
    }
    return n;
  }
  function slot(article,paragraph,kind,sc){
    const aside=sc.own(node('aside','ink-margin '+kind));
    const anchor=article.querySelectorAll('.narrative > .type-block')[paragraph];
    if(anchor)anchor.after(aside);else article.querySelector('.page-actions').before(aside);
    return aside;
  }
  async function annotation(host,text,sc,ms=SECRETS.timing.annotation){
    if(sc.signal.aborted)return;const n=sc.own(node('p','ink-annotation',text));host.append(n);
    await sc.animate(n,[{opacity:0},{opacity:1}],300);if(!await sc.wait(ms))return;
    await sc.animate(n,[{opacity:1},{opacity:0}],350);n.remove();
  }
  let bookAudio;
  function localTrack(track,cls){const a=node('a',cls);a.href=track.src;a.setAttribute('aria-label','Ouvir '+track.title+' — '+track.artist);return a;}
  function paper(trigger,host,sc,{text,small,track,secret}){
    let overlay=null,working=false,paperScope=null;
    async function close(){if(!overlay||working)return;working=true;const current=overlay,ps=paperScope;await ps.animate(current.querySelector('.folded-paper'),[{opacity:1,transform:'translateY(0) rotate(-2deg)'},{opacity:0,transform:'translateY(45px) rotate(9deg) scale(.7)'}],SECRETS.timing.paper);if(track)bookAudio.closeStrawberry();ps.abort();overlay=null;paperScope=null;working=false;trigger.setAttribute('aria-expanded','false');if(!sc.signal.aborted)trigger.focus({preventScroll:true});}
    trigger.setAttribute('aria-expanded','false');
    sc.on(trigger,'click',async()=>{
      if(working)return;if(overlay){close();return;}
      working=true;BookMemory.discover(secret);trigger.setAttribute('aria-expanded','true');
      paperScope=scope(sc.signal);const ps=paperScope;overlay=ps.own(node('div','paper-pocket'));const sheet=node('section','folded-paper');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label',track?track.title:'Bilhete entre as páginas');
      const dismiss=button('paper-close',SECRETS.labels.close);dismiss.textContent='—';sheet.append(dismiss);
      if(track){const sleeve=localTrack(track,'record-sleeve');sleeve.append(node('span','record'),node('span','record-cover',track.title));sheet.append(sleeve,node('h2','',track.title),node('p','record-artist',track.artist));ps.on(sleeve,'click',event=>{event.preventDefault();bookAudio.startStrawberry();});bookAudio.onStrawberryChange=playing=>sleeve.classList.toggle('is-playing',playing);ps.signal.addEventListener('abort',()=>bookAudio.closeStrawberry(),{once:true});}
      sheet.append(node('p','paper-writing',text));if(small)sheet.append(node('p','paper-small',small));
      overlay.append(sheet);document.body.append(overlay);
      ps.on(dismiss,'click',close);ps.on(overlay,'click',e=>{if(e.target===overlay)close();});
      await ps.animate(sheet,[{opacity:0,transform:'translateY(45px) rotate(9deg) scale(.7)'},{opacity:1,transform:'translateY(0) rotate(-2deg)'}],SECRETS.timing.paper);
      working=false;if(!sc.signal.aborted)dismiss.focus({preventScroll:true});
    });
    sc.on(document,'keydown',e=>{if(e.key==='Escape'&&overlay){e.preventDefault();close();}});
  }
  function strawberry(article,sc){const host=slot(article,5,'strawberry-margin',sc),b=button('strawberry-trigger',SECRETS.labels.strawberry);b.append(ink('strawberry'));host.append(b);paper(b,host,sc,{text:SECRETS.text.strawberry,track:SECRETS.music.strawberry,secret:'strawberry'});}
  function scar(article,sc){
    const host=slot(article,0,'scar-margin',sc),b=button('scar-trigger',SECRETS.labels.scar);b.append(ink('scar'));host.append(b);let running=false;
    sc.on(b,'click',async()=>{if(running)return;running=true;BookMemory.discover('scar');await sc.animate(b,[{transform:'rotate(0)'},{transform:'rotate(-4deg) translateY(-3px)'}],300);await annotation(host,SECRETS.text.scar,sc);await sc.animate(b,[{transform:'rotate(-4deg) translateY(-3px)'},{transform:'rotate(0)'}],300);running=false;});
  }
  function shy(article,sc){
    if(session.shyUsed)return;const host=slot(article,3,'shy-margin',sc),b=button('shy-trigger',SECRETS.labels.shy);b.append(ink('shy'));host.append(b);
    sc.on(b,'click',async()=>{
      if(session.shyUsed)return;session.shyUsed=true;b.disabled=true;BookMemory.discover('shyFace');b.dataset.phase='looking';
      await sc.animate(b.querySelector('.shy-gaze'),[{transform:'translateX(-2px)'},{transform:'translateX(0)'}],SECRETS.timing.shyLook);
      if(sc.signal.aborted)return;b.dataset.phase='covering';
      await Promise.all([...b.querySelectorAll('.shy-hand')].map(hand=>sc.animate(hand,[{transform:'translateY(16px)'},{transform:'translateY(-8px)'}],SECRETS.timing.shyCover)));
      if(!await sc.wait(SECRETS.timing.shyHold))return;b.dataset.phase='shaking';
      await sc.animate(b,[{transform:'rotate(0)'},{transform:'rotate(-3deg)',offset:.2},{transform:'rotate(3deg)',offset:.4},{transform:'rotate(-2deg)',offset:.6},{transform:'rotate(2deg)',offset:.8},{transform:'rotate(0)'}],SECRETS.timing.shyShake);
      b.dataset.phase='evaporating';await sc.animate(b,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-16px) scale(1.15)'}],SECRETS.timing.evaporate);b.remove();await annotation(host,SECRETS.text.shyFace,sc);
    });
  }
  function hiddenNote(article,sc){const host=slot(article,100,'note-margin',sc),b=button('note-tip',SECRETS.labels.note);b.append(node('span','paper-corner'));host.append(b);paper(b,host,sc,{text:SECRETS.text.hiddenNote,small:SECRETS.text.apology,secret:'hiddenNote'});}
  function survival(article,sc){
    if(session.survivalUsed)return;const host=slot(article,6,'survival-margin',sc),b=button('survival-trigger',SECRETS.labels.eye);b.append(ink('eye'));host.append(b);let count=0,moving=false;
    sc.on(b,'click',async()=>{
      if(moving||session.survivalUsed)return;moving=true;count++;b.dataset.attempt=String(count);
      if(count<3){const x=count===1?-54:-12;await sc.animate(b,[{transform:b.style.transform||'translateX(0)'},{transform:`translateX(${reduced()?x/8:x}px)`}],200);b.style.transform=`translateX(${reduced()?x/8:x}px)`;moving=false;return;}
      session.survivalUsed=true;BookMemory.discover('survivalEye');await sc.animate(b,[{transform:b.style.transform},{transform:'translateX(-12px) scale(.8)',offset:.5},{opacity:0,transform:'translateX(-20px) scale(.2)'}],500);b.remove();await annotation(host,SECRETS.text.survival,sc);
    });
  }
  async function signature(article,sc){
    const output=article.querySelector('.narrative > .type-block:last-child .typed');if(!output)return;
    const b=button('signature-trigger',SECRETS.labels.signature);b.textContent=output.textContent;output.replaceChildren(b);output.removeAttribute('aria-hidden');output.closest('p').querySelector('.sr-only').setAttribute('aria-hidden','true');
    const host=sc.own(node('aside','signature-margin'));output.closest('p').after(host);let used=false;
    sc.on(b,'click',async()=>{
      if(used)return;used=true;BookMemory.discover('signature');host.querySelector('.signature-hint')?.remove();
      const first=sc.own(node('p','ink-annotation',SECRETS.text.signature[0]));host.append(first);
      await sc.animate(first,[{opacity:0},{opacity:1}],300);if(!await sc.wait(SECRETS.timing.whisperPause))return;
      const second=sc.own(node('p','ink-annotation',SECRETS.text.signature[1]));host.append(second);await sc.animate(second,[{opacity:0},{opacity:1}],300);
    });
    if(!await sc.wait(SECRETS.timing.signatureDelay)||used)return;
    const hint=sc.own(node('span','signature-hint'));hint.setAttribute('aria-hidden','true');hint.append(ink('eye'),ink('eye'));host.append(hint);
    await sc.animate(hint,[{opacity:0,transform:'translateX(0)'},{opacity:1,transform:'translateX(-3px)',offset:.2},{opacity:1,transform:'translateX(3px)',offset:.55},{opacity:1,transform:'translateX(0)',offset:.8},{opacity:0}],SECRETS.timing.signatureHint);hint.remove();
  }
  function fugitive(question,signal){
    const sc=scope(signal);question.setAttribute('role','button');question.tabIndex=0;question.setAttribute('aria-label',SECRETS.labels.word);let attempts=0,moving=false;
    const act=async()=>{if(moving||attempts>=3)return;moving=true;attempts++;question.dataset.attempt=String(attempts);
      if(attempts<3){const x=(attempts===1?-1:1)*(reduced()?3:Math.min(24,innerWidth*.055));await sc.animate(question,[{transform:question.style.transform||'translateX(0)'},{transform:`translateX(${x}px)`}],220);question.style.transform=`translateX(${x}px)`;}
      else{BookMemory.discover('fugitiveWord');if(await sc.wait(650))await sc.animate(question,[{transform:question.style.transform||'translateX(0)'},{transform:'translateX(0)'}],350);}
      moving=false;
    };
    sc.on(question,'click',act);sc.on(question,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();act();}});
  }
  function cover(article,signal,navigate){
    const sc=scope(signal),load=BookMemory.atLoad;
    if(load.completedOnce&&!BookMemory.has('returnedBookmark')){
      const b=button('cover-bookmark returned-bookmark',SECRETS.labels.returned);article.append(b);let used=false;
      sc.on(b,'click',async()=>{if(used)return;used=true;if(BookMemory.has('returnedBookmark')){b.remove();return;}BookMemory.discover('returnedBookmark');b.classList.add('unfolded');b.append(node('span','',SECRETS.text.returned[0]));if(!await sc.wait(750))return;b.append(node('span','',SECRETS.text.returned[1]));if(!await sc.wait(2200))return;await sc.animate(b,[{opacity:1},{opacity:0,transform:'translateY(-25px)'}],350);b.remove();});
    }
    if(!session.started&&!load.readingFinished&&BookMemory.validPage(load.lastPage)){
      const marker=sc.own(node('div','resume-marker'));const b=button('cover-bookmark resume-bookmark',SECRETS.labels.resume);marker.append(b);article.append(marker);let opened=false;
      sc.on(b,'click',()=>{if(opened)return;opened=true;b.classList.add('unfolded');b.append(node('span','',SECRETS.text.resume));const go=button('resume-action',SECRETS.text.resumeAction);go.textContent=SECRETS.text.resumeAction;marker.append(go);sc.on(go,'click',()=>navigate(load.lastPage));});
    }
  }
  function mount(article,index,signal){
    if(signal.aborted||article.dataset.secretsMounted)return;article.dataset.secretsMounted='true';const sc=scope(signal);
    if(index===1)scar(article,sc);
    if(index===4)strawberry(article,sc);
    if(index===5){shy(article,sc);hiddenNote(article,sc);survival(article,sc);}
    if(index===8)signature(article,sc);
    if(index===6&&session.sixPassed){const host=slot(article,100,'still-margin',sc),b=button('still-trigger',SECRETS.labels.still);b.textContent='ainda';host.append(b);let used=false;sc.on(b,'click',async()=>{if(used)return;used=true;BookMemory.discover('stillWord');b.hidden=true;await annotation(host,SECRETS.text.still,sc);});}
    session.pages.add(index);
  }
  function beforeNavigate(from,to){
    for(const controller of active)controller.abort();
    if(to!==-1)session.started=true;
    if(from===6&&to===10&&!session.sixPassed){
      session.sixPassed=true;const sc=scope();const word=sc.own(node('span','lingering-word','ainda'));document.body.append(word);
      (async()=>{if(!await sc.wait(500))return;await sc.animate(word,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(18px)'}],180);sc.abort();})();
    }
  }
  function music(){
    bookAudio=new BookAudio(SECRETS.music);
  }
  async function setAudioEnabled(enabled){return bookAudio.setEnabled(enabled);}
  return {mount,cover,fugitive,beforeNavigate,music,setAudioEnabled,get activeCount(){return active.size;}};
})();
