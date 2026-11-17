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
run("window.b=data.books.find(b=>b.id==='BK-STATE-DEMO-2');window.suite=bookAnalysisSuites(b)[0];window.mid=suite.materialIds[0];window.other='SUITE-SAVE-TEST';data.listeningBank.materials[other]={...structuredClone(data.listeningBank.materials[mid]),id:other};for(const q of bankQuestions(mid)){const clone=structuredClone(q);clone.id='COPY-'+q.id;clone.scriptId=other;data.listeningBank.questions[clone.id]=clone}data.teachingLibrary.suites[suite.id].materialIds.push(other);openWholeSuiteEditor({id:suite.id,bookReference:{bookId:b.id}})");await tick();
assert.ok($('[data-revision-save=suite]'));assert.equal($('[data-revision-save=correction]'),null);
const field=()=> $('[data-sentence="0"] [data-sfield=translation]');const original=field().value;
field().value=original+'修改一';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();
$('[data-edit-view=analysis]').click();assert.ok($('.lc-teaching-sources').textContent.includes('修改一'));assert.equal($('.lc-teaching-sources textarea'),null);
$('[data-suite-recording="SUITE-SAVE-TEST"]').click();await tick();assert.equal($('.lc-recording-row.active').dataset.recordingRow,'SUITE-SAVE-TEST');
$('[data-edit-view=content]').click();field().value=original+'修改二';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();
$('#lc-discard-recording').click();assert.equal(field().value,original);
$('[data-suite-recording="'+w.mid+'"]').click();assert.equal(field().value,original);
field().value=original+'保存一';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();
$('[data-suite-recording="SUITE-SAVE-TEST"]').click();field().value=original+'保存二';field().dispatchEvent(new w.Event('input',{bubbles:true}));await tick();
$('[data-revision-save=suite]').click();assert.ok($('#lc-confirm-suite-save'));$('#lc-confirm-suite-save').click();await tick();
assert.equal(run('listeningRevisionSource(mid,b.id).material.segments[0].translation'),original+'保存一');
assert.equal(run('listeningRevisionSource(other,b.id).material.segments[0].translation'),original+'保存二');assert.ok($('[data-revision-save=suite]').disabled);
console.log('PASS suite save across recordings, full discard, translation refresh and readonly analysis sources');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
