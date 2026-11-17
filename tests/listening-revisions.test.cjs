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



w.URL.revokeObjectURL=()=>{};
(async()=>{try{
const tick=()=>new Promise(r=>setTimeout(r,150));
run("const src=data.books.find(b=>b.id==='BK-STATE-DEMO-1');window.testBook=src.id;window.testSuite=bookAnalysisSuites(src)[0].id;window.testMaterial=data.teachingLibrary.suites[window.testSuite].materialIds[0];openWholeSuiteEditor({id:window.testSuite,bookReference:{bookId:src.id}})");await tick();
const correction=()=> $('[data-revision-save=correction]'),optimized=()=> $('[data-revision-save=optimized]');
assert.ok(correction());assert.equal(correction().textContent,'保存硬伤修正');assert.equal(optimized().textContent,'保存为优化版本');assert.ok(correction().disabled,'initially clean');
const field=()=> $('[data-sentence="0"] [data-sfield=text]');const original=field().value;
field().value=original+' revised';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();assert.equal(correction().disabled,false);
field().value=original;field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();assert.ok(correction().disabled,'revert disables');
field().value=original+' revised';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();
correction().click();assert.ok($('#confirm-recording-correction'));assert.ok($('#dialog').textContent.includes(run("data.books.find(b=>b.id===window.testBook).name")));
run('closeDialog()');
optimized().click();await tick();console.log('Save:', $('#lc-error').textContent);
assert.equal(run('listeningRevisionNumber(window.testMaterial,window.testBook)'),2);
assert.equal(run('data.listeningBank.materials[window.testMaterial].segments[0].text'),original,'original bank version unchanged');
assert.equal(run('listeningRevisionSource(window.testMaterial,window.testBook).material.segments[0].text'),original+' revised');

const update=()=> $('[data-revision-save=update]');
assert.equal(optimized(),null);assert.equal(correction(),null);assert.ok(update().hidden);assert.ok($('#lc-discard-recording').hidden);
assert.ok($('.lc-suite-counts').textContent.includes('录音稿：1'));assert.ok($('.lc-suite-counts').textContent.includes('小题：2'));
field().value=original+' updated V2';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();assert.equal(update().hidden,false);assert.equal(update().textContent,'保存修改');update().click();await tick();
assert.equal(run('listeningRevisionNumber(window.testMaterial,window.testBook)'),2);
assert.equal(run('listeningRevisionSource(window.testMaterial,window.testBook).material.segments[0].text'),original+' updated V2');assert.ok(update().hidden);
assert.equal(run('data.listeningBank.materials[window.testMaterial].segments[0].text'),original);
run("const copy=structuredClone(data.books.find(b=>b.id===window.testBook));copy.id='OTHER-REFERENCE';copy.name='其他引用书籍';data.books.push(copy)");
field().value=original+' shared update';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();update().click();assert.ok($('#dialog').textContent.includes('其他引用书籍'));assert.ok($('#confirm-recording-correction'));run('closeDialog()');$('#lc-discard-recording').click();assert.equal(field().value,original+' updated V2');assert.ok(update().hidden);
run("page='listening-bank';bankSearch='updated V2';bankQuestionType=bankTopic='';bankReferences=bankReferenceIndex();window.latestRows=bankFilteredMaterials(true)");
assert.equal(w.latestRows.length,1);assert.ok(w.latestRows[0].versionLabel.includes('·V2（最新）'));assert.ok(w.latestRows[0].text.includes('updated V2'));
assert.throws(()=>run("persistListeningRevision(data,window.testBook,{materialId:window.testMaterial},'optimized')"),/已创建优化版本/);
run("data.books.find(b=>b.id===window.testBook).workflow.stage='解析编写中'");$('[data-edit-view=content]').click();$('[data-edit-view=cloze]').click();$('.lc-cloze-line').click();await tick();assert.equal($('[data-revision-save=suite]').textContent,'保存整套题');$('[data-revision-save=suite]').click();await tick();assert.ok($('[data-revision-save=suite]').disabled);
assert.ok(run('listeningRevisionSource(window.testMaterial,window.testBook).material.segments[0].clozeBlanks.length'));
console.log('PASS owned version updates in place, hidden clean buttons, shared-version confirmation, latest bank content, header counts and normal teaching save');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
