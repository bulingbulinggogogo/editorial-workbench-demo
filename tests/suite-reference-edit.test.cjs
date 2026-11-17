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


(async()=>{try{
run(`var b=data.books.find(b=>b.directoryRoots?.length);var n=projectBookDirectories(b).find(n=>data.directoryContents[n.contentId]?.items.some(i=>i.kind==='suites'));var idx=data.directoryContents[n.contentId].items.findIndex(i=>i.kind==='suites');var sid=data.directoryContents[n.contentId].items[idx].id;var entry={kind:'suites',id:sid,mode:'view',bookReference:{bookId:b.id,nodeId:n.id,index:idx}};resourceTrail.push(entry);renderResourceDetail(entry)`);
assert.ok($('#suite-unlock'));assert.equal($('#suite-save'),null);assert.equal($('#suite-add-material'),null);assert.equal($('.suite-name-field'),null);assert.equal($('#resource-content').textContent.includes('解除引用'),false);
$('#suite-unlock').click();assert.ok($('#suite-update-original'));assert.ok($('#suite-copy-new'));
$('#suite-update-original').click();await new Promise(r=>setTimeout(r,50));
assert.ok($('#listening-create').open);assert.ok($('[data-edit-view="content"]').classList.contains('active'));
assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,run("resourceCollection('suites')[sid].materialIds.length"));
assert.equal($('#lc-save-progress').textContent,'保存整套');assert.equal($('#suite-save'),null);
$('#listening-create').dispatchEvent(new w.Event('close'));
run("bookFlowChange(b.id,f=>f.stage='解析编写中');renderResourceDetail(entry)");
assert.ok($('#suite-unlock'));$('#suite-unlock').click();assert.ok($('#listening-create').open);
$('#listening-create').dispatchEvent(new w.Event('close'));
run("bookFlowChange(b.id,f=>f.stage='已定稿');renderResourceDetail(entry)");assert.equal($('#suite-unlock'),null);
run(`var before=JSON.stringify(resourceCollection('suites')[sid]);var state=structuredClone(data);var originalContent=JSON.stringify(state.directoryContents[n.contentId]);var copiedId=copyReferencedSuite(entry,state);var original=resourceCollection('suites',state)[sid];var copied=resourceCollection('suites',state)[copiedId]`);
assert.notEqual(run('copiedId'),run('sid'));assert.equal(run('JSON.stringify(original)'),run('before'));assert.equal(run('JSON.stringify(state.directoryContents[n.contentId])'),run('originalContent'));assert.equal(run('copied.materialIds.length'),run('original.materialIds.length'));assert.ok(run('copied.materialIds.every(id=>!original.materialIds.includes(id))'));
assert.ok(run('copied.materialIds.every(id=>state.listeningBank.materials[id].id===id)'));
assert.equal(run('state.directoryContents[projectBookDirectories(state.books.find(x=>x.id===b.id),state).find(x=>x.id===n.id).contentId].items[idx].id'),run('copiedId'));
assert.ok(run('copied.materialIds.every(id=>Object.values(state.listeningBank.questions).some(q=>q.scriptId===id))'));
console.log('PASS readonly suite, edit choice, independent materials/questions, current-book reference replacement, original preserved');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
