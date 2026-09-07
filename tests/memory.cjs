const {chromium,assert}=require('./helpers.cjs');
(async()=>{
 const browser=await chromium.launch();
 for(const mode of ['corrupt','unavailable','future']){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(mode=>{
   if(mode==='unavailable')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Unavailable','SecurityError');}});
   else localStorage.setItem('historias-nunca-escritas',mode==='future'?JSON.stringify({version:90,unknown:'preserve'}):'{invalid json');
  },mode);
  await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(450);await page.getByRole('button',{name:'Começar',exact:true}).click();await page.getByRole('heading',{name:'Para você.',exact:true}).waitFor();
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>BookMemory.state.version),1);
  if(mode==='future')assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('historias-nunca-escritas')).version),90);
  await page.close();
 }
 console.log('PASS memory: corrupted JSON, blocked storage, safe defaults and preservation of unknown future schema.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
