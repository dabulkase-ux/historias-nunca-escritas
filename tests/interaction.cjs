const {chromium,assert,open,reveal,ready,next,goEyes,noLeaks,noOverflow}=require('./helpers.cjs');
(async()=>{
 const browser=await chromium.launch();const {page,errors}=await open(browser,{viewport:{width:320,height:568},hasTouch:true});
 await noOverflow(page);await page.screenshot({path:'tests/screenshots/v2-cover-320.png'});
 await page.locator('#sound').tap();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 await page.locator('#book').focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(450);await page.keyboard.press(' ');await ready(page);
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(450);await page.keyboard.press('ArrowLeft');await page.waitForTimeout(450);assert.equal(await page.locator('h1').textContent(),'Para você.');await ready(page);
 for(const title of ['Cicatrizes','Sem perceber','Os olhos']){await next(page,title);if(title!=='Os olhos')await ready(page);}
 await page.locator('.eyes-scene[data-phase="forming"]').waitFor();await page.locator('.eyes-back').tap();await page.getByRole('heading',{name:'Sem perceber',exact:true}).waitFor();await noLeaks(page);await ready(page);
 await next(page,'Os olhos');await page.locator('.eyes-scene[data-revisit="false"]').waitFor();
 await page.locator('.eyes-scene[data-phase="formed"]').waitFor();await page.screenshot({path:'tests/screenshots/v2-eyes-320.png'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);assert.equal(await page.locator('.eyes-canvas').evaluate(c=>c.width),844);
 await ready(page);await noLeaks(page);
 for(let visit=0;visit<3;visit++){
  await next(page,'Você já sabia');await page.locator('.back').click();
  await page.locator('.eyes-scene[data-revisit="true"][data-phase="look-left"]').waitFor();
  assert.equal(await page.locator('.narrative .typed').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await page.locator('.eyes-scene[data-phase="look-right"]').waitFor();await page.locator('.eyes-scene[data-phase="eye-roll"]').waitFor();
  if(visit===1){await page.locator('.eyes-back').click();await page.getByRole('heading',{name:'Sem perceber',exact:true}).waitFor();await ready(page);await next(page,'Os olhos');await page.locator('.eyes-scene[data-revisit="true"]').waitFor();}
  if(visit===2){await page.waitForTimeout(350);await page.screenshot({path:'tests/screenshots/v2-eye-roll-landscape.png'});}
  await ready(page);await noLeaks(page);assert.equal(await page.locator('.narrative .typed').first().evaluate(e=>getComputedStyle(e).visibility),'visible');
 }
 await page.locator('#home').click();await page.getByRole('button',{name:'Começar',exact:true}).waitFor();await page.getByRole('button',{name:'Começar',exact:true}).dblclick();await page.waitForTimeout(450);assert.equal(await page.locator('h1').textContent(),'Para você.');await ready(page);
 await page.locator('.next').dblclick();await page.waitForTimeout(450);assert.equal(await page.locator('h1').textContent(),'Cicatrizes');
 await page.locator('.skip').tap();await ready(page);await noOverflow(page);assert.deepEqual(errors,[]);
 console.log('PASS interaction: 320px, touch, audio, keyboard, skip, interrupted first visit, three revisits, eye-roll, interrupted revisit, resize/orientation, rapid clicks, cleanup.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

