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
// Existing saved IDs migrate together with links, review keys and publication snapshots.
run(`var legacy=structuredClone(data);legacy.teachingLibrary.suites['STATE-DEMO-S-99']={id:'STATE-DEMO-S-99',materialIds:[]};legacy.directoryContents.legacy={items:[{kind:'suites',id:'STATE-DEMO-S-99'}]};legacy.books.push({id:'migration-test',workflow:{reviews:{'STATE-DEMO-S-99':{passed:true}},published:{suites:[{id:'STATE-DEMO-S-99'}]},history:[{action:'通过 · 套题 STATE-DEMO-S-99'}]}});migrateDemoSuiteIds(legacy);var migrated=Object.values(legacy.teachingLibrary.suites).find(s=>s.sourceId==='STATE-DEMO-S-99').id;`);
assert.match(run('migrated'),/^\d+$/);
assert.equal(run('legacy.directoryContents.legacy.items[0].id'),run('migrated'));
assert.equal(run('legacy.books.at(-1).workflow.published.suites[0].id'),run('migrated'));
assert.equal(run('legacy.books.at(-1).workflow.reviews[migrated].passed'),true);
assert.equal(run('legacy.books.at(-1).workflow.history[0].action'), '通过 · 套题 '+run('migrated'));
assert.equal(run('migrateDemoSuiteIds(legacy)'),false);
assert.equal(run('Object.keys(data.teachingLibrary.suites).every(id=>/^\\d+$/.test(id))'),true);
for(const bookId of run("data.books.filter(b=>b.demo).map(b=>b.id)")){
 run(`var b=data.books.find(b=>b.id==='${bookId}');var suitesForTest=bookAnalysisSuites(b);`);
 assert.ok(run('suitesForTest.length')>0);
 assert.equal(run('suitesForTest.every(s=>/^\\d+$/.test(s.id)&&!!data.teachingLibrary.suites[s.id])'),true);
 run("var target=document.createElement('div');renderBookAnalysisSuites(b,target)");
 assert.ok(!run('target.textContent').includes('STATE-DEMO-S-'));
}
run("page='listening-suites';resourceTrail=[];render();var savedSuiteOpen=openListeningCreate;openListeningCreate=(editing,opts,context)=>window.suiteEditorCall={editing,opts,context}");
const editButton=w.document.querySelector('[data-resource-action="edit"]');
assert.ok(editButton);editButton.click();
assert.equal(w.suiteEditorCall.editing,true);
assert.equal(w.suiteEditorCall.opts.view,'content');
assert.equal(w.suiteEditorCall.opts.readOnly,false);
assert.ok(w.suiteEditorCall.context.suiteId);
assert.ok(w.suiteEditorCall.context.suiteMaterials.length);
assert.equal(run('resourceTrail.length'),0);
run('openListeningCreate=savedSuiteOpen');
console.log('PASS numeric demo suite creation, legacy migration, references, review keys, snapshots and rendered book suite IDs');
}finally{w.close()}
