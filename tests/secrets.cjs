const {chromium,assert,open,reveal,ready,next,start,noOverflow,noLeaks}=require('./helpers.cjs');
const getMemory=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('historias-nunca-escritas')));
(async()=>{
 const browser=await chromium.launch();const {page,errors}=await open(browser,{viewport:{width:390,height:844},hasTouch:true});
 await page.evaluate(()=>{localStorage.setItem('unrelated','keep');localStorage.setItem('historias-nunca-escritas',JSON.stringify({version:1,completedOnce:true,visits:40,lastPage:5,secrets:{strawberry:true}}));});
 await page.goto('http://127.0.0.1:4173/?reset=1&keep=yes');await page.waitForTimeout(450);
 assert(!page.url().includes('reset='));assert(page.url().includes('keep=yes'));assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated')),'keep');
 let memory=await getMemory(page);assert.equal(memory.visits,1);assert.equal(memory.completedOnce,false);assert.equal(memory.secrets.strawberry,false);
 await page.reload();await page.waitForTimeout(450);assert.equal((await getMemory(page)).visits,2);
 await start(page);await next(page,'Cicatrizes');await ready(page);
 const scar=page.getByRole('button',{name:'Marca no papel',exact:true});const before=await page.locator('.narrative').boundingBox();
 await scar.tap();await page.getByText('foi aqui que começou.',{exact:true}).waitFor();const after=await page.locator('.narrative').boundingBox();assert.equal(before.height,after.height);
 await page.waitForTimeout(3100);await next(page,'Sem perceber');await ready(page);await next(page,'Os olhos');await ready(page);
 await next(page,'Você já sabia');await page.getByRole('button',{name:'Sim',exact:true}).waitFor();
 const strawberry=page.getByRole('button',{name:'Morango desenhado na margem',exact:true});
 for(let i=0;i<3;i++){await strawberry.tap();await page.getByRole('dialog',{name:'Loira Morango',exact:true}).waitFor();await page.waitForTimeout(450);assert.equal(await page.locator('.record-sleeve').getAttribute('href'),'assets/audio/loira-morango.mp3');if(i===0)await page.screenshot({path:'tests/screenshots/v3-strawberry.png'});await page.locator('.paper-pocket').click({position:{x:5,y:5}});await page.locator('.paper-pocket').waitFor({state:'detached'});}
 await page.getByRole('button',{name:'Obviamente não',exact:true}).tap();await ready(page);await next(page,'A gente');await ready(page);
 await page.screenshot({path:'tests/screenshots/v3-chapter05.png',fullPage:true});
 const shy=page.getByRole('button',{name:'Pequena figura na margem',exact:true});await shy.tap();await page.waitForFunction(()=>document.querySelector('.shy-trigger')?.dataset.phase==='covering');await page.getByText('ela faz isso também.',{exact:true}).waitFor();await page.waitForTimeout(2700);assert.equal(await page.locator('.shy-trigger').count(),0);assert.equal(await page.getByText('ela faz isso também.',{exact:true}).count(),0);
 const tip=page.getByRole('button',{name:'Ponta de papel entre as páginas',exact:true});await tip.tap();await page.getByRole('dialog',{name:'Bilhete entre as páginas',exact:true}).waitFor();await page.waitForTimeout(450);await page.screenshot({path:'tests/screenshots/v3-note.png'});await page.getByRole('button',{name:'Recolher o papel',exact:true}).tap();await page.locator('.paper-pocket').waitFor({state:'detached'});
 const survival=page.getByRole('button',{name:'Olho desenhado na margem',exact:true});for(let i=0;i<3;i++){await survival.tap();await page.waitForTimeout(250);await noOverflow(page);}await page.getByText('instinto de sobrevivência.',{exact:true}).waitFor();await page.waitForTimeout(2700);
 await next(page,'Nem todo capítulo termina como a gente queria');await ready(page);await page.locator('.next').click();await page.waitForFunction(()=>!!document.querySelector('.lingering-word'));await page.getByRole('heading',{name:'Entre Dúvidas',exact:true}).waitFor();await reveal(page);await ready(page);
 const word=page.getByRole('button',{name:'Será?',exact:true});for(let i=0;i<3;i++){await word.tap();await page.waitForTimeout(260);const box=await word.boundingBox();assert(box.x>=0&&box.x+box.width<=390);}assert.equal((await getMemory(page)).secrets.fugitiveWord,true);
 await page.locator('.poem-isolation .back').click();await page.getByRole('heading',{name:'Nem todo capítulo termina como a gente queria',exact:true}).waitFor();await ready(page);await page.getByRole('button',{name:'Palavra na margem',exact:true}).tap();await page.getByText('essa aparentemente não foi embora.',{exact:true}).waitFor();
 await next(page,'Entre Dúvidas');await ready(page);await next(page,'Ainda');await ready(page);
 await page.reload();await page.waitForTimeout(450);assert.equal(await page.locator('h1').textContent(),'Maduh');assert.equal(await page.locator('.resume-marker').count(),1);
 await page.getByRole('button',{name:'Marcador de leitura',exact:true}).tap();await page.getByRole('button',{name:'continuar de onde parei →',exact:true}).click();await page.getByRole('heading',{name:'Ainda',exact:true}).waitFor();await ready(page);
 await next(page,'Entre as linhas.');await ready(page);await page.locator('.signature-hint').waitFor();await page.locator('.signature-hint').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Assinatura de Arthur',exact:true}).tap();await page.getByText('eu também não.',{exact:true}).waitFor();await page.screenshot({path:'tests/screenshots/v3-signature.png',fullPage:true});
 await next(page);assert.equal(await page.evaluate(()=>SecretLayer.activeCount),0);assert.equal(await page.locator('.paper-pocket,.pupil-message,.signature-hint,.lingering-word').count(),0);
 await page.getByRole('button',{name:'continuar',exact:true}).waitFor({timeout:20000});await page.getByRole('button',{name:'continuar',exact:true}).click();await page.getByRole('heading',{name:'Obrigado por fazer parte da minha história.',exact:true}).waitFor();await ready(page);
 assert.equal((await getMemory(page)).completedOnce,true);await next(page);assert.equal(await page.locator('.returned-bookmark').count(),0);
 const tab=await page.context().newPage();await tab.goto('http://127.0.0.1:4173');await tab.waitForTimeout(450);assert.equal(await tab.locator('.returned-bookmark').count(),1);assert.equal(await tab.locator('h1').textContent(),'Maduh');
 await tab.getByRole('button',{name:'Marcador entre as páginas',exact:true}).click();await tab.getByText('achei que talvez voltasse.',{exact:true}).waitFor();assert.equal((await getMemory(tab)).secrets.returnedBookmark,true);await tab.reload();await tab.waitForTimeout(450);assert.equal(await tab.locator('.returned-bookmark').count(),0);
 memory=await getMemory(tab);for(const name of ['scar','strawberry','shyFace','hiddenNote','survivalEye','stillWord','fugitiveWord','signature'])assert.equal(memory.secrets[name],true,name);
 assert.equal(await tab.evaluate(()=>localStorage.getItem('unrelated')),'keep');assert.deepEqual(errors,[]);
 console.log('PASS secrets: selective reset, persistence, new tab, resume, completion/return, strawberry repeats/outside close, shy face, note, fugitive word, signature, scar, still word, survival, clean epilogue.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

