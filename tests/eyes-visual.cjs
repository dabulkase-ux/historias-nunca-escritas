const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {PNG}=require(path.join(path.dirname(require.resolve(process.env.PLAYWRIGHT_MODULE||'playwright')),'../pngjs'));
(async()=>{
 const browser=await chromium.launch();const reports=[];
 for(const width of [320,1440]){
  const frames={};
  for(const variant of ['before','after']){
   const page=await browser.newPage({viewport:{width,height:width===320?568:1000}});
   await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(450);
   await page.addScriptTag({path:variant==='before'?'tests/fixtures/eyes-resume.js':'js/eyes.js'});
   frames[variant]=await page.evaluate(async()=>{
    document.body.dataset.theme='paper';const book=document.querySelector('#book');book.replaceChildren();
    const article=document.createElement('article');article.className='page narrative';book.append(article);
    BOOK.pages[3].paragraphs.forEach(text=>{const p=document.createElement('p');p.className='typed';p.style.position='static';p.textContent=text;article.append(p);});
    let now=1000,callback;const originalNow=performance.now.bind(performance);
    performance.now=()=>now;window.requestAnimationFrame=cb=>{callback=cb;return 1;};window.cancelAnimationFrame=()=>{};
    const result=[];
    for(const revisit of [false,true]){
     const start=now,controller=new AbortController();const playing=EyesScene.play(article,{signal:controller.signal,revisit});
     const duration=revisit?BOOK.timings.eyesRevisit:BOOK.timings.eyes;
     for(const fraction of revisit?[.5]:[.15,.3,.425,.75]){now=start+fraction*duration;callback(now);result.push(document.querySelector('canvas.eyes-canvas').toDataURL());}
     controller.abort();await playing;
    }
    performance.now=originalNow;return result;
   });await page.close();
  }
  for(let i=0;i<frames.before.length;i++){
   const a=PNG.sync.read(Buffer.from(frames.before[i].split(',')[1],'base64')),b=PNG.sync.read(Buffer.from(frames.after[i].split(',')[1],'base64'));
   let total=0,changed=0;for(let j=0;j<a.data.length;j+=4){let delta=0;for(let c=0;c<4;c++)delta+=Math.abs(a.data[j+c]-b.data[j+c]);total+=delta;if(delta>80)changed++;}
   const report={width,frame:i,meanChannelDifference:total/a.data.length,changedPercent:changed/(a.width*a.height)*100};reports.push(report);
   assert(report.meanChannelDifference<1.5,'Unexpected visual change');
   if(i===3)fs.writeFileSync('tests/screenshots/eyes-comparison-'+width+'-'+i+'.png',Buffer.from(frames.after[i].split(',')[1],'base64'));
  }
 }
 fs.writeFileSync('tests/eyes-visual-results.json',JSON.stringify(reports,null,2));console.log(reports);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
