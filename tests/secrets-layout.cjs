const {chromium,devices,assert,open,start,next,ready,noOverflow}=require('./helpers.cjs');
const {webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch(),safari=await webkit.launch();
 for(const [name,options] of [['320',{viewport:{width:320,height:568},hasTouch:true}],['android',devices['Pixel 7']],['iphone',devices['iPhone 13']],['desktop',{viewport:{width:1440,height:1000}}]]){
  const {page,errors}=await open(name==='iphone'?safari:browser,{...options,reducedMotion:'reduce'});await start(page);
  for(const title of ['Cicatrizes','Sem perceber','Os olhos','Você já sabia','A gente']){
   await next(page,title);
   if(title==='Você já sabia'){
    await page.getByRole('button',{name:'Morango desenhado na margem',exact:true}).click();await page.waitForTimeout(30);const count=await page.evaluate(()=>SecretLayer.activeCount);
    await page.getByRole('button',{name:'Recolher o papel',exact:true}).click();await page.locator('.paper-pocket').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>SecretLayer.activeCount),count-1);
    await page.getByRole('button',{name:'Obviamente não',exact:true}).click();
   }
   await ready(page);
  }
  const layout=await page.evaluate(()=>{
   const controls=[...document.querySelectorAll('.shy-trigger,.survival-trigger,.note-tip')];const paragraphs=[...document.querySelectorAll('.narrative>.type-block')].map(p=>p.getBoundingClientRect());
   return controls.map(c=>{const r=c.getBoundingClientRect();return{safeX:r.left>=0&&r.right<=innerWidth,overlap:paragraphs.some(p=>r.left<p.right&&r.right>p.left&&r.top<p.bottom&&r.bottom>p.top)};});
  });assert(layout.every(item=>item.safeX&&!item.overlap));await noOverflow(page);
  if(name==='320')await page.screenshot({path:'tests/screenshots/v3-layout-320.png',fullPage:true});
  await page.getByRole('button',{name:'Pequena figura na margem',exact:true}).click();await page.locator('.next').click();await page.getByRole('heading',{name:'Nem todo capítulo termina como a gente queria',exact:true}).waitFor();await page.waitForTimeout(2500);
  assert.equal(await page.locator('.shy-trigger,.paper-pocket').count(),0);assert.equal(await page.getByText('ela faz isso também.',{exact:true}).count(),0);assert.deepEqual(errors,[]);
  console.log('PASS secret margins, no overlap and interrupted animation: '+name);await page.close();
 }
 await browser.close();await safari.close();
})().catch(e=>{console.error(e);process.exit(1)});
