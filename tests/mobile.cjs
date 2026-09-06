const {chromium,devices,assert,open,reveal,ready,next,start,noLeaks,noOverflow}=require('./helpers.cjs');
const {webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch(),safari=await webkit.launch();
 const cases=[
  ['small',{viewport:{width:320,height:568},hasTouch:true}],
  ['android',devices['Pixel 7']],
  ['iphone',devices['iPhone 13']],
  ['landscape',{viewport:{width:844,height:390},hasTouch:true,deviceScaleFactor:2}],
  ['reduced',{viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true}]
 ];
 for(const [name,options] of cases){
  const {page,errors}=await open(name==='iphone'?safari:browser,options);await noOverflow(page);await start(page);
  for(const title of ['Cicatrizes','Sem perceber','Os olhos','Você já sabia','A gente','Nem todo capítulo termina como a gente queria','Entre Dúvidas','Ainda','Entre as linhas.']){
   await next(page,title);
   if(title==='Os olhos'){
    await page.waitForFunction(()=>!!document.querySelector('.eyes-scene'));
    assert.equal(await page.locator('.eyes-scene').count(),1);
    if(name==='reduced')assert.equal(await page.locator('.eyes-scene').getAttribute('data-phase'),'reduced');
    else await page.waitForFunction(()=>document.querySelector('.eyes-scene')?.dataset.phase==='formed');
    if(name==='iphone'||name==='android')await page.screenshot({path:'tests/screenshots/v2-eyes-'+name+'.png'});
   }
   if(title==='Você já sabia'){
    const yes=page.getByRole('button',{name:'Sim',exact:true});await yes.click();await page.waitForFunction(()=>!document.querySelector('.choice-button').disabled);
    await page.getByRole('button',{name:'Obviamente não',exact:true}).click();await reveal(page);
   }
   await ready(page);await noOverflow(page);await noLeaks(page);
   if(title==='Entre Dúvidas'){
    await page.screenshot({path:'tests/screenshots/v2-interlude-'+name+'.png'});
    await page.getByRole('button',{name:'reler os versos',exact:true}).click();
    if(name==='iphone')await page.screenshot({path:'tests/screenshots/v2-poem-iphone.png',fullPage:true});
   }
   if(title==='Ainda'&&(name==='iphone'||name==='small'))await page.screenshot({path:'tests/screenshots/v2-ainda-'+name+'.png',fullPage:true});
  }
  await next(page);await page.getByRole('button',{name:'continuar',exact:true}).waitFor({timeout:20000});await page.waitForTimeout(1350);await noOverflow(page);
  await page.screenshot({path:'tests/screenshots/v2-epilogue-'+name+'.png'});
  await page.getByRole('button',{name:'continuar',exact:true}).click();await page.getByRole('heading',{name:'Obrigado por fazer parte da minha história.',exact:true}).waitFor();await ready(page);await noOverflow(page);
  await next(page);await page.getByRole('button',{name:'Começar',exact:true}).waitFor();assert.deepEqual(errors,[]);
  console.log('PASS mobile complete story: '+name);await page.close();
 }
 await browser.close();await safari.close();
})().catch(e=>{console.error(e);process.exit(1)});
