// One-time record of the approved V1, before editing. Kept for provenance.
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ctx = { window:{} }; vm.runInNewContext(fs.readFileSync('js/content.js','utf8'),ctx);
const app = fs.readFileSync('js/app.js','utf8');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const baseline = {
  epilogueFunction: app.slice(app.indexOf('  async function epilogue(signal)'),app.indexOf("  root.addEventListener('click'")),
  audioHash: hash('js/audio.js'), stylesheetHash: hash('css/style.css'),
  timings: Object.fromEntries(['dramatic','backspace','transition','black','endingHold','rethink','reveal'].map(key=>[key,ctx.window.BOOK.timings[key]])),
  epilogue:ctx.window.BOOK.epilogue,
  sleepFunction:fs.readFileSync('js/typewriter.js','utf8').split('window.Typewriter')[0]
};
fs.mkdirSync('tests/fixtures',{recursive:true});
fs.writeFileSync('tests/fixtures/epilogue-v1.json',JSON.stringify(baseline,null,2),{flag:'wx'});
