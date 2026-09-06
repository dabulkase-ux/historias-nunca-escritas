const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:4173');
 await page.getByRole('button',{name:'Começar',exact:true}).click();
 async function ready(){await page.waitForTimeout(450);await page.locator('#book').click({position:{x:30,y:20}});await page.locator('.next:visible').waitFor({timeout:60000});}
 await ready();for(let i=0;i<2;i++){await page.locator('.next').click();await ready();}
 await page.locator('.next').click();await page.waitForTimeout(450);await page.locator('#book').click({position:{x:30,y:20}});
 await page.locator('.eyes-scene[data-phase="formed"]').waitFor();await page.screenshot({path:'tests/screenshots/v2-eyes-formed-desktop.png'});
 await page.locator('.eyes-scene[data-phase="holding"]').waitFor();await page.screenshot({path:'tests/screenshots/v2-eyes-dilated-desktop.png'});
 await page.locator('.next:visible').waitFor();await page.locator('.next').click();await page.waitForTimeout(450);
 await page.locator('.back').click();await page.locator('.eyes-scene[data-phase="eye-roll"]').waitFor();await page.waitForTimeout(500);await page.screenshot({path:'tests/screenshots/v2-eyes-roll-desktop.png'});
 await page.locator('.next:visible').waitFor();console.log(await page.evaluate(()=>EyesScene.diagnostics));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
