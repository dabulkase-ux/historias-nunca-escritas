const {chromium,assert,open,goEyes,ready,next,noLeaks}=require('./helpers.cjs');
(async()=>{
 const browser=await chromium.launch();const {page,errors}=await open(browser,{viewport:{width:390,height:844},hasTouch:true});
 await goEyes(page);await page.waitForFunction(()=>!!document.querySelector('.eyes-scene'));assert.equal(await page.locator('.pupil-hit').count(),0);await ready(page);
 await next(page,'Você já sabia');await page.locator('.back').click();await page.waitForFunction(()=>!!document.querySelector('.pupil-hit:not([hidden])'));
 const target=page.locator('.pupil-hit').first(),box=await target.boundingBox();await page.touchscreen.tap(box.x+22,box.y+22);
 await page.waitForFunction(()=>document.querySelector('.eyes-scene')?.dataset.pupilSecret==='active');
 await page.waitForTimeout(2000);assert.equal(await page.locator('.pupil-message').textContent(),'eu avisei que reparava demais.');await page.screenshot({path:'tests/screenshots/v3-pupil-secret.png'});
 await ready(page);await noLeaks(page);assert.equal(await page.evaluate(()=>BookMemory.state.secrets.pupilSecret),true);
 await next(page,'Você já sabia');await page.locator('.back').click();await page.waitForFunction(()=>!!document.querySelector('.eyes-scene'));assert.equal(await page.locator('.pupil-hit').count(),0);await ready(page);
 await page.reload();await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>BookMemory.state.secrets.pupilSecret),true);
 await goEyes(page);await page.waitForFunction(()=>!!document.querySelector('.eyes-scene'));assert.equal(await page.locator('.eyes-scene').getAttribute('data-revisit'),'true');assert.equal(await page.locator('.pupil-hit').count(),0);await ready(page);
 assert.deepEqual(errors,[]);console.log('PASS pupil: no first-visit target, touch hit, held sequence/message/resume, once-only persistence, unchanged later revisits.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
