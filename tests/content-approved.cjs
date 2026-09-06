const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.runInNewContext(fs.readFileSync('js/content.js','utf8'),context);
const book=JSON.parse(JSON.stringify(context.window.BOOK));
const approved=JSON.parse(fs.readFileSync('tests/fixtures/approved-chapters.json','utf8'));
for(const [index,paragraphs] of Object.entries(approved))assert.deepEqual(book.pages[index].paragraphs,paragraphs,'Approved text differs in page '+index);
assert.equal(book.pages[0].note,'Obrigado por existir nesse enredo.');
assert(!book.pages.some(page=>JSON.stringify(page).includes('Obrigada')));
assert.equal(book.pages[10].label,'INTERLÚDIO');
console.log('PASS: all seven chapters, interlude and final page match the supplied approved text verbatim; narrator agreement corrected.');
