const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();const results=[];
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  for(const variant of ['before','after']){
   const page=await browser.newPage({viewport,deviceScaleFactor:2});
   await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(450);
   await page.addScriptTag({path:variant==='before'?'tests/fixtures/eyes-resume.js':'js/eyes.js'});
   const report=await page.evaluate(async()=>{
    document.body.dataset.theme='paper';const book=document.querySelector('#book');book.replaceChildren();
    const article=document.createElement('article');article.className='page narrative';book.append(article);
    BOOK.pages[3].paragraphs.forEach(text=>{const p=document.createElement('p');p.className='typed';p.style.position='static';p.textContent=text;article.append(p);});
    const durations=[],gaps=[];const native=requestAnimationFrame;let last=0;
    window.requestAnimationFrame=cb=>native.call(window,ts=>{if(last)gaps.push(ts-last);last=ts;const start=performance.now();cb(ts);durations.push(performance.now()-start);});
    const start=performance.now();const playing=EyesScene.play(article,{signal:new AbortController().signal});const startup=performance.now()-start;
    const particles=EyesScene.diagnostics.particles;const canvas=document.querySelector('.eyes-canvas');const pixels=canvas.width*canvas.height;
    await playing;window.requestAnimationFrame=native;
    const stats=a=>{const sorted=a.slice().sort((a,b)=>a-b);return{mean:a.reduce((x,y)=>x+y,0)/a.length,p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...a)};};
    return{startup,particles,pixels,frame:stats(durations),gap:stats(gaps),over33:gaps.filter(x=>x>33.4).length,frames:durations.length};
   });
   results.push({viewport,variant,...report});await page.close();
  }
 }
 fs.writeFileSync('tests/performance-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
