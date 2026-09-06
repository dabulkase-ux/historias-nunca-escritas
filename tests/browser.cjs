const {chromium,assert,open,reveal,ready,next,goEyes,noLeaks,noOverflow}=require('./helpers.cjs');
(async()=>{
 const browser=await chromium.launch();const {page,errors}=await open(browser,{viewport:{width:1440,height:1000}});
 await page.screenshot({path:'tests/screenshots/v2-cover-desktop.png'});
 await goEyes(page);
 await page.locator('.eyes-scene[data-phase="formed"]').waitFor();await page.screenshot({path:'tests/screenshots/v2-eyes-formed-desktop.png'});
 await page.waitForFunction(()=>document.querySelector('.eyes-scene')?.dataset.phase==='blink');assert.equal(await page.evaluate(()=>EyesScene.diagnostics.dilation),0);
 await page.waitForFunction(()=>document.querySelector('.eyes-scene')?.dataset.phase==='open');assert.equal(await page.evaluate(()=>EyesScene.diagnostics.dilation),0);
 await page.waitForFunction(()=>document.querySelector('.eyes-scene')?.dataset.phase==='holding');assert.equal(await page.evaluate(()=>EyesScene.diagnostics.dilation),1);
 await page.screenshot({path:'tests/screenshots/v2-eyes-dilated-desktop.png'});
 await ready(page);await noLeaks(page);
 assert.equal(await page.locator('.narrative .typed').first().textContent(),'“Por que sempre que você me encara, suas pupilas dilatam?”');
 await next(page,'Você já sabia');await page.getByRole('button',{name:'Sim',exact:true}).waitFor();
 await page.getByRole('button',{name:'Sim',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.choice-button').disabled);
 assert.equal(await page.locator('.branch-result .typed').last().textContent(),'Você está pulando uma parte da história.');
 assert.equal(await page.locator('.next:visible').count(),0);
 await page.getByRole('button',{name:'Obviamente não',exact:true}).click();await ready(page);
 assert(await page.getByRole('button',{name:'Obviamente não',exact:true}).isDisabled());
 assert.equal(await page.locator('.chain').count(),2);assert.equal(await page.locator('.lock').count(),1);
 await page.screenshot({path:'tests/screenshots/v2-chains-desktop.png'});
 for(const title of ['A gente','Nem todo capítulo termina como a gente queria','Entre Dúvidas']){await next(page,title);await ready(page);}
 await page.locator('.poem-isolation').waitFor();assert.equal(await page.locator('.poem-question').textContent(),'“Será?”');
 await page.screenshot({path:'tests/screenshots/v2-interlude-isolated-desktop.png'});
 await page.getByRole('button',{name:'reler os versos'}).click();await page.screenshot({path:'tests/screenshots/v2-interlude-desktop.png',fullPage:true});
 for(const title of ['Ainda','Entre as linhas.']){await next(page,title);await ready(page);}
 const finalText=await page.locator('.narrative .typed').allTextContents();assert.equal(finalText.at(-1),'— Arthur');
 await next(page);await page.waitForFunction(()=>document.querySelector('.epilogue-line')?.textContent==='Fim.');
 await page.waitForTimeout(1000);assert.equal(await page.locator('.epilogue-line').textContent(),'Fim.');
 await page.getByRole('button',{name:'continuar',exact:true}).waitFor({timeout:20000});
 await page.waitForTimeout(1400);assert.equal(await page.locator('.epilogue-line').textContent(),'Ainda não sei.');
 await page.screenshot({path:'tests/screenshots/v2-epilogue-desktop.png'});
 const styled=await page.screenshot({animations:'disabled'});
 await page.locator('link[href="css/edition.css"]').evaluate(link=>{link.disabled=true;});
 const originalStyle=await page.screenshot({animations:'disabled'});
 assert(styled.equals(originalStyle),'V2 stylesheet changed the epilogue appearance');
 await page.locator('link[href="css/edition.css"]').evaluate(link=>{link.disabled=false;});
 await page.getByRole('button',{name:'continuar',exact:true}).click();await page.getByRole('heading',{name:'Obrigado por fazer parte da minha história.',exact:true}).waitFor();await ready(page);
 await next(page);await page.getByRole('button',{name:'Começar',exact:true}).waitFor();
 await goEyes(page);await page.locator('.eyes-scene[data-revisit="false"]').waitFor();await ready(page);await noLeaks(page);
 await noOverflow(page);assert.deepEqual(errors,[]);
 console.log('PASS browser: full story, approved new pages, both choices, blink before dilation, interlude/re-read, unchanged epilogue flow, closing and restart.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

