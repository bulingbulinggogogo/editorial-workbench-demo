const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};const nativeStyle=w.getComputedStyle.bind(w);w.getComputedStyle=el=>nativeStyle(el);
w.HTMLMediaElement.prototype.pause=function(){};
const ctx=dom.getInternalVMContext();
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
for(const match of html.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='app-storage.js')vm.runInContext(fs.readFileSync(match[1],'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),$=s=>w.document.querySelector(s);
const closeWindow=w.close.bind(w);w.close=()=>{w.document.querySelectorAll('#listening-create').forEach(el=>el.dispatchEvent(new w.Event('close')));w.BookUI?.disposeSelects?.();closeWindow();};

try {
for(const expr of ['data.books.map(b=>b.bookId)','Object.keys(data.listeningBank.materials)','Object.keys(data.listeningBank.questions)','Object.keys(data.teachingLibrary.suites)']){
 const ids=run(expr);assert.ok(ids.every(id=>/^\d+$/.test(id)),expr);assert.equal(new Set(ids).size,ids.length);
}
run(`const fixture=structuredClone(data);fixture.books[0].bookId='TEST-1';fixture.books[1].bookId=fixture.books[2].bookId;
fixture.listeningBank.materials['OLD-M']={id:'OLD-M'};
fixture.listeningBank.questions['OLD-Q']={id:'OLD-Q',scriptId:'OLD-M'};
fixture.teachingLibrary.suites['999999']={id:'999999',materialIds:['OLD-M']};
fixture.testDraft={materialId:'OLD-M',questionIds:['OLD-Q']};
fixture.books[0].workflow={stage:'已定稿',needsRepublish:false,published:{materials:{'OLD-M':{id:'OLD-M',questions:[{id:'OLD-Q',scriptId:'OLD-M'}]}}}};
const oldBookKey=fixture.books[0].id;repairPublicIds(fixture);`);
assert.equal(run('fixture.books[0].id===oldBookKey'),true);
assert.equal(run('fixture.books[0].workflow.needsRepublish'),false);
assert.equal(run('fixture.books[0].workflow.stage'),'已定稿');
assert.equal(run('fixture.books.every(b=>/^\\d+$/.test(b.bookId))'),true);
assert.equal(run('new Set(fixture.books.map(b=>b.bookId)).size'),run('fixture.books.length'));
assert.equal(run('fixture.testDraft.materialId'),run('fixture.teachingLibrary.suites["999999"].materialIds[0]'));
assert.equal(run('fixture.listeningBank.questions[fixture.testDraft.questionIds[0]].scriptId'),run('fixture.testDraft.materialId'));
assert.equal(run('Object.keys(fixture.books[0].workflow.published.materials)[0]'),run('fixture.testDraft.materialId'));
const before=run('JSON.stringify(fixture)');assert.equal(run('repairPublicIds(fixture)'),false);assert.equal(run('JSON.stringify(fixture)'),before);
assert.ok(run('Number(nextBusinessId("books",fixture))>Math.max(...fixture.books.map(b=>Number(b.bookId)))'));
assert.equal(run('data.books.filter(b=>b.demo).every(b=>bookAnalysisSuites(b).every(s=>s.materialIds.every(id=>data.listeningBank.materials[id])))'),true);
console.log('PASS public numeric IDs, unique books, legacy references/snapshots, workflow preservation and idempotence');
} finally {w.close()}
