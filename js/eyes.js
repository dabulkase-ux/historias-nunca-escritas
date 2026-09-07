/* A single canvas, one RAF, and one measurement pass per geometry change.
   All visible marks are glyphs; there are no painted eye outlines or circles. */
window.EyesScene = (() => {
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const chars = Array.from('MaduholharesSerá?aeiosuvcnrt');
  const palette = ['#49302e','#6f4940','#997060','#b69a7b','#39272a'];
  const diagnostics = { active:0, frames:0, listeners:0, particles:0 };
  let sharedAtlas;
  const atlasSurface=(width,height)=>{
    if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
  };
  const freezeAtlas=canvas=>canvas.transferToImageBitmap?canvas.transferToImageBitmap():canvas;

  function makeAtlas() {
    if (sharedAtlas) return sharedAtlas;
    const cell = 40;
    const canvas = atlasSurface(chars.length*cell,palette.length*cell);
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '26px Georgia, serif';
    palette.forEach((color,row) => { ctx.fillStyle = color; chars.forEach((char,col) => ctx.fillText(char,col * cell + 20,row * cell + 20)); });
    sharedAtlas=freezeAtlas(canvas);return sharedAtlas;
  }
  function sourceAtlas(sources) {
    const glyphs=[...new Set(sources.map(source=>source.char))];
    const canvas=atlasSurface(Math.max(1,glyphs.length)*80,palette.length*80);
    const ctx=canvas.getContext('2d');ctx.font='52px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let row=0;row<palette.length;row++){
      ctx.fillStyle=palette[row];
      for(let col=0;col<glyphs.length;col++)ctx.fillText(glyphs[col],col*80+40,row*80+40);
    }
    const indices=new Map(glyphs.map((char,i)=>[char,i*80]));
    for(const source of sources)source.atlasX=indices.get(source.char);
    return freezeAtlas(canvas);
  }
  // Deterministic scatter: revisits retain the same face instead of regenerating it.
  function random(seed) { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function buildParticles(mobile) {
    const particles = [];
    const density = mobile ? .72 : 1;
    function add(side, x, y, kind, color, size = 1, angle = 0, radius = 0) {
      const id = particles.length;
      const rotation=(random(id)-.5)*.55,offset=random(id+9)*.19*.25;
      particles.push({ side,x,y,kind,color,size,angle,radius, glyph:id % chars.length, rotation,
        cos:Math.cos(angle),sin:Math.sin(angle),cosRotation:Math.cos(rotation),sinRotation:Math.sin(rotation),
        inner:kind==='iris'||kind==='pupil',offset,span:.25-offset,curl:(random(id+77)-.5)*.9,
        atlasX:(id%chars.length)*40,atlasY:color*40,ex:x,ey:y,alpha:1 });
    }
    [-1,1].forEach(side => {
      // Almond-shaped lids with a thicker upper edge, tear ducts and a soft crease.
      const count = Math.round(110 * density);
      for (let j=0;j<3;j++) for (let i=0;i<count;i++) {
        const u = i/(count-1), x = u*2-1, arch = Math.pow(Math.sin(Math.PI*u),.78);
        const tilt = side*x*.055;
        add(side,x,-.49*arch+tilt-j*.021,'lid',j === 0 ? 0 : 1,.88 + random(i)*.23);
        if(j<2) add(side,x,.35*arch+tilt+j*.022,'lid',j === 0 ? 1 : 2,.76);
        if(j===0 && i%2===0) add(side,x*.97,-.64*arch+tilt-.05,'crease',3,.75);
      }
      // Fine lashes point outward, with unequal lengths rather than a repeated fringe.
      for(let i=0;i<13;i++) {
        const u=.05+i*.071,x=u*2-1,y=-.49*Math.pow(Math.sin(Math.PI*u),.78)+side*x*.055;
        const length=.055+random(i+side+50)*.07;
        for(let j=1;j<=4;j++) add(side,x+(x*.07)*j/4,y-length*j/4,'lash',1,.7);
      }
      // Radial fibres and concentric rings make the iris read as a circular volume.
      for(let ring=0;ring<12;ring++) {
        const radius=.15+ring*.026;
        const count=Math.round((36+ring*5)*density);
        for(let i=0;i<count;i++) {
          const angle=i/count*Math.PI*2+ring*.057;
          const r=radius+(random(i+ring*81)-.5)*.013;
          add(side,Math.cos(angle)*r,Math.sin(angle)*r,'iris',ring>9 ? 0 : [1,2,3,2][ring%4],.7+random(i+ring)*.35,angle,r);
        }
      }
      // A dense spiral of dark glyphs, expanded only after the blink has finished.
      const pupilCount=Math.round(250*density);
      for(let i=0;i<pupilCount;i++) {
        const radius=Math.sqrt(i/pupilCount),angle=i*2.399963;
        add(side,Math.cos(angle)*radius*.14,Math.sin(angle)*radius*.14,'pupil',4,.87,angle,radius);
      }
      // Sparse eyebrow-like shading adds a subtle, asymmetric expression.
      for(let i=0;i<Math.round(60*density);i++) {
        const u=i/(60*density),x=(u*2-1)*.9;
        add(side,x,-.81+.15*x*x+side*x*.075,'brow',2,.82);
      }
    });
    return particles;
  }
  function measureSources(container, limit) {
    const outputs=[...container.querySelectorAll('.typed')], sources=[];
    const candidates=[];
    outputs.forEach(output=>{
      const rect=output.getBoundingClientRect();
      if(rect.bottom<0 || rect.top>innerHeight) return;
      const node=output.firstChild;
      if(!node) return;
      const fontSize=parseFloat(getComputedStyle(output).fontSize);
      for(let i=0;i<node.length;i++) if(node.textContent[i].trim()) candidates.push({node,i,fontSize});
    });
    const stride=Math.max(1,Math.ceil(candidates.length/limit));
    // All Range reads precede canvas writes; no DOM mutation per glyph.
    for(let i=0;i<candidates.length;i+=stride) {
      const {node,i:offset,fontSize}=candidates[i], range=document.createRange();
      range.setStart(node,offset);range.setEnd(node,offset+1);
      const r=range.getBoundingClientRect();
      if(r.bottom<0 || r.top>innerHeight)continue;
      sources.push({x:r.left+r.width/2,y:r.top+r.height/2,size:fontSize,char:node.textContent[offset]});
    }
    return sources;
  }
  async function play(container, { signal, reduced=false, revisit=false, onBack, pupilAvailable=false, pupilText='', onPupilSecret }={}) {
    if(signal.aborted)return false;
    const scene=document.createElement('div');scene.className='eyes-scene';scene.dataset.revisit=String(revisit);
    const canvas=document.createElement('canvas');canvas.className='eyes-canvas';canvas.setAttribute('aria-hidden','true');
    const back=document.createElement('button');back.className='text-button eyes-back';back.textContent=`← ${BOOK.ui.back}`;back.type='button';back.onclick=onBack;
    scene.append(canvas,back);document.body.append(scene);
    const ctx=canvas.getContext('2d');
    if(!ctx){scene.remove();return false;}
    const atlas=makeAtlas();const particles=buildParticles(innerWidth<600);
    const outputs=[...container.querySelectorAll('.typed')];
    let width,height,half,cx,cy,dpr,sources,originAtlas,shade,raf=0,dirty=true,started=performance.now();
    let previousDilation=-1,previousGazeX=-1,previousGazeY=-1,previousPhase='';
    const originalVisibility=outputs.map(node=>node.style.visibility);
    const savedFocus=document.activeElement;
    const pupilButtons=[],secretAnimations=[];
    let pausedAt=0,pauseTotal=0,touchedSide=0,secretUsed=false,message=null;
    if(revisit&&pupilAvailable){
      for(const side of [-1,1]){
        const hit=document.createElement('button');hit.type='button';hit.className='pupil-hit';hit.hidden=true;hit.setAttribute('aria-label',SECRETS.labels.pupil+(side===-1?' esquerda':' direita'));scene.append(hit);pupilButtons.push({hit,side});
        hit.onclick=()=>{
          if(secretUsed||hit.hidden||signal.aborted)return;
          if(onPupilSecret?.()===false)return;
          secretUsed=true;touchedSide=side;pausedAt=performance.now();scene.dataset.pupilSecret='active';pupilButtons.forEach(({hit})=>{hit.hidden=true;});
          message=document.createElement('p');message.className='pupil-message';message.style.top=`${cy+half*.8}px`;scene.append(message);
          Array.from(pupilText).forEach((char,i)=>{
            const glyph=document.createElement('span');glyph.textContent=char;message.append(glyph);
            const a=glyph.animate([{opacity:0,transform:reduced?'none':`translate(${i%2?-50:50}px,-35px)`},{opacity:0,offset:.25},{opacity:1,transform:'translate(0,0)',offset:.48},{opacity:1,offset:.8},{opacity:0,transform:reduced?'none':`translate(${i%2?35:-35}px,-25px)`}],{duration:SECRETS.timing.pupilHold,fill:'both',easing:'ease-in-out'});secretAnimations.push(a);
          });
        };
      }
    }
    diagnostics.active++;diagnostics.particles=particles.length;
    function geometry() {
      const resized=width!==innerWidth||height!==innerHeight;
      width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);
      // Cap backing pixels as well as DPR on unusually large screens.
      dpr=Math.min(dpr,Math.sqrt(2400000/(width*height)));
      if(resized){
        canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
        canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
      }
      half=Math.min(172,(width-36)*.215,(height-100)*.65);cx=width/2;cy=height*.46;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      if(resized){
        shade=ctx.createRadialGradient(cx,cy,half*.6,cx,cy,Math.max(width,height)*.7);
        shade.addColorStop(0,'#f8f3ea');shade.addColorStop(1,'#e3d8c8');
      }
      sources=measureSources(container,Math.min(360,particles.length));
      originAtlas?.close?.();originAtlas=sourceAtlas(sources);
      outputs.forEach(output=>{output.style.visibility='hidden';});
      particles.forEach((p,i)=>{
        const sourceIndex=Math.floor(i*sources.length/particles.length);
        const source=Math.floor((i+1)*sources.length/particles.length)>sourceIndex ? sources[sourceIndex] : null;p.source=source;
        if(source){p.sx=source.x;p.sy=source.y;}
        else { const edge=i%4,t=random(i+29);p.sx=edge===0?-30:edge===1?width+30:t*width;p.sy=edge===2?-30:edge===3?height+30:t*height; }
        p.baseSize=Math.max(3.1,half*.044)*p.size;p.originSize=source?.size||9;
        p.image=source?originAtlas:atlas;p.cell=source?80:40;p.ratio=40/26;
        p.glyphX=source?source.atlasX:p.atlasX;p.glyphY=source?p.color*80:p.atlasY;
        p.center=cx+p.side*half*1.25;
      });
      dirty=false;
    }
    function change(){dirty=true;}
    window.addEventListener('resize',change);window.addEventListener('orientationchange',change);window.addEventListener('scroll',change,{passive:true});
    diagnostics.listeners+=3;
    const duration=reduced?BOOK.timings.eyesReduced:revisit?BOOK.timings.eyesRevisit:BOOK.timings.eyes;
    let ended=false;
    return await new Promise(resolve=>{
      function finish(complete) {
        if(ended)return;ended=true;cancelAnimationFrame(raf);
        signal.removeEventListener('abort',abort);
        window.removeEventListener('resize',change);window.removeEventListener('orientationchange',change);window.removeEventListener('scroll',change);
        outputs.forEach((node,i)=>{node.style.visibility=originalVisibility[i];});
        secretAnimations.forEach(a=>a.cancel());scene.remove();originAtlas?.close?.();diagnostics.active--;diagnostics.listeners-=3;diagnostics.particles=0;diagnostics.frames=0;
        if(complete && savedFocus?.isConnected && document.activeElement===document.body)savedFocus.focus({preventScroll:true});
        resolve(complete);
      }
      const abort=()=>finish(false);signal.addEventListener('abort',abort,{once:true});
      function draw(now) {
        if(signal.aborted){finish(false);return;}
        if(dirty)geometry();
        let secretProgress=pausedAt?(now-pausedAt)/SECRETS.timing.pupilHold:0;
        if(pausedAt&&secretProgress>=1){pauseTotal+=now-pausedAt;pausedAt=0;message?.remove();scene.dataset.pupilSecret='done';previousGazeX=-9;}
        const t=clamp(((pausedAt||now)-started-pauseTotal)/duration);
        let formation=1,disperse=0,blink=0,dilation=0,gazeX=0,gazeY=0,phase='formed';
        if(reduced){disperse=ease((t-.7)/.3);phase='reduced';}
        else if(revisit){
          if(t<.16){gazeX=-.22*ease(t/.12);phase='look-left';}
          else if(t<.34){gazeX=mix(-.22,.22,ease((t-.16)/.14));phase='look-right';}
          else if(t<.66){
            const u=ease((t-.34)/.32);
            gazeX=.22*Math.cos(u*Math.PI);gazeY=-.29*Math.sin(u*Math.PI);phase='eye-roll';
          } else {gazeX=mix(-.22,0,ease((t-.66)/.08));phase='revisit-hold';}
          disperse=ease((t-.78)/.22);
          if(t>.78)phase='returning';
        } else {
          formation=ease(t/.25);disperse=ease((t-.82)/.18);
          if(t<.25)phase='forming';
          else if(t<.38)phase='formed';
          else if(t<.465){blink=Math.sin(clamp((t-.38)/.085)*Math.PI);phase='blink';}
          else if(t<.51)phase='open';
          else if(t<.69)phase='dilating';
          else if(t<.82)phase='holding';
          else phase='returning';
          dilation=ease((t-.51)/.18);
        }
        if(phase!==previousPhase){scene.dataset.phase=phase;previousPhase=phase;}
        if(pupilButtons.length&&!secretUsed){
          const available=reduced?(t>.1&&t<.7):(t>.6&&t<.78);
          for(const {hit,side} of pupilButtons){if(hit.hidden===available)hit.hidden=!available;if(available){hit.style.left=`${cx+side*half*1.25+gazeX*half-22}px`;hit.style.top=`${cy+gazeY*half-22}px`;}}
        }
        diagnostics.dilation=dilation;
        const secretGaze=pausedAt?(secretProgress<.28?ease(secretProgress/.2):1-ease((secretProgress-.28)/.17)):0;
        if(pausedAt||dilation!==previousDilation||gazeX!==previousGazeX||gazeY!==previousGazeY){
          // Normalized eye anatomy is recomputed only while the expression changes.
          for(let i=0;i<particles.length;i++){
            const p=particles[i];if(!p.inner)continue;
            const r=p.kind==='pupil'?p.radius*mix(.14,.225,dilation):p.radius+dilation*(.455-p.radius)*.18;
            const eyeX=pausedAt?(p.side===touchedSide?0:touchedSide*.25*secretGaze):gazeX,eyeY=pausedAt?0:gazeY;
            const x=p.cos*r+eyeX,y=p.sin*r+eyeY;
            const arch=Math.pow(Math.max(0,Math.sin(Math.PI*(x+1)/2)),.78),tilt=p.side*x*.055;
            p.ex=x;p.ey=y;p.alpha=y<-.49*arch+tilt||y>.35*arch+tilt?0:1;
            if((x-eyeX+.095)**2+(y-eyeY+.12)**2<.0035||(x-eyeX-.075)**2+(y-eyeY-.11)**2<.00055)p.alpha=0;
          }
          previousDilation=dilation;previousGazeX=gazeX;previousGazeY=gazeY;
        }
        const veil=revisit?1-disperse:formation*(1-disperse);
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.clearRect(0,0,width,height);
        ctx.globalAlpha=veil;ctx.fillStyle='#f2ede3';ctx.fillRect(0,0,width,height);
        ctx.fillStyle=shade;ctx.globalAlpha=veil*.52;ctx.fillRect(0,0,width,height);
        ctx.globalAlpha=1;
        // Origin glyphs include their actual characters, even if absent from the atlas.
        for(let i=0;i<particles.length;i++){
          const p=particles[i];let x=p.ex,y=p.ey;
          if(p.kind!=='brow'&&p.kind!=='crease')y=mix(y,-.025,blink*.97);
          else if(p.kind==='crease')y+=blink*.09;
          const tx=p.center+x*half,ty=cy+y*half;
          const localFormation=revisit||reduced?1:ease((t-p.offset)/p.span);
          const travel=localFormation*(1-disperse);
          const arc=Math.sin(travel*Math.PI),curl=arc*p.curl*half;
          const px=mix(p.sx,tx,travel)+curl,py=mix(p.sy,ty,travel)-arc*half*.25;
          const size=mix(p.originSize,p.baseSize*(p.kind==='pupil'?mix(1,1.6,dilation):1),travel);
          const originAlpha=p.source?1:Math.min(1,travel*4);
          ctx.globalAlpha=originAlpha*mix(1,p.alpha,travel);
          if(ctx.globalAlpha<=.01)continue;
          const cos=travel===1?p.cosRotation:Math.cos(p.rotation*travel),sin=travel===1?p.sinRotation:Math.sin(p.rotation*travel);
          ctx.setTransform(dpr*cos,dpr*sin,-dpr*sin,dpr*cos,px*dpr,py*dpr);
          const rendered=size*p.ratio;
          ctx.drawImage(p.image,p.glyphX,p.glyphY,p.cell,p.cell,-rendered/2,-rendered/2,rendered,rendered);
        }
        ctx.globalAlpha=1;diagnostics.frames++;
        if(t>=1)finish(true);else raf=requestAnimationFrame(draw);
      }
      // Revisited eyes are painted synchronously before the next browser paint.
      draw(started);
    });
  }
  return {play,diagnostics};
})();
