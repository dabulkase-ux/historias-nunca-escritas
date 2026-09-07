const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
fs.mkdirSync('tests/screenshots',{recursive:true});
async function open(browser,options={}){
 const context=await browser.newContext(options);const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173');await page.waitForTimeout(450);return{page,errors};
}
async function reveal(page){await page.evaluate(()=>{const b=document.querySelector('.skip');if(b&&!b.hidden)b.click();});}
async function ready(page){await reveal(page);await page.locator('.next:visible').waitFor({timeout:15000});}
async function next(page,title){await page.locator('.next:visible').click();if(title)await page.getByRole('heading',{name:title,exact:true}).waitFor();else await page.waitForTimeout(450);await reveal(page);}
async function start(page){await page.getByRole('button',{name:'Começar',exact:true}).click();await page.getByRole('heading',{name:'Para você.',exact:true}).waitFor();await ready(page);}
async function goEyes(page){await start(page);for(const title of ['Cicatrizes','Sem perceber','Os olhos']){await next(page,title);if(title!=='Os olhos')await ready(page);}}
async function noLeaks(page){assert.deepEqual(await page.evaluate(()=>({active:EyesScene.diagnostics.active,listeners:EyesScene.diagnostics.listeners,particles:EyesScene.diagnostics.particles})),{active:0,listeners:0,particles:0});assert.equal(await page.locator('.eyes-scene').count(),0);}
async function noOverflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');}
module.exports={chromium,devices,assert,open,reveal,ready,next,start,goEyes,noLeaks,noOverflow};

