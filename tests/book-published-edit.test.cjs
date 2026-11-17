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
const id='BK-STATE-DEMO-6';
run(`page='books';activeBook='${id}';bookSection='基本信息';render()`);
assert.ok($('#edit-book-info'));
const snapshot=run(`JSON.stringify(data.books.find(b=>b.id==='${id}').workflow.published)`);
run(`commitWorkspace(s=>{s.listeningBank.materials['STATE-DEMO-M-5'].text='The library opens at ten.'})`);
assert.equal(run(`data.books.find(b=>b.id==='${id}').workflow.needsRepublish`),true);
assert.equal(run(`JSON.stringify(data.books.find(b=>b.id==='${id}').workflow.published)`),snapshot);
assert.equal(run(`bookPublishActionLabel(data.books.find(b=>b.id==='${id}'))`),'重新完整发布');
run(`bookRecordRevision('${id}',data.teachingLibrary.suites[Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='STATE-DEMO-S-5').id])`);
assert.equal($('#toast').classList.contains('show'),false,'修订回调不应重复弹出保存提示');
run(`bookSection='目录与内容';render()`);assert.ok($('#edit-directory'));assert.equal($('.directory-rename-button'),null);
run(`window.originalOpen=openListeningCreate;openListeningCreate=(editing,opts,context)=>{window.directoryEdit={editing,opts,context}}`);
$('.unified-content-row [data-resource-action=edit]').click();assert.equal(w.directoryEdit.opts.view,'content');assert.equal(w.directoryEdit.opts.materialId,'STATE-DEMO-M-5');assert.equal(w.directoryEdit.context.suiteMaterials.length,1);assert.equal(run('resourceTrail.length'),0);run('openListeningCreate=window.originalOpen');
run(`bookSection='解析编写';render()`);
run(`window.savedOpen=openListeningCreate;openListeningCreate=(editing,opts)=>window.editOptions=opts`);
$('[data-book-suite-analysis]').click();assert.equal(w.editOptions.readOnly,false);run('openListeningCreate=window.savedOpen');
assert.equal(run(`bookTransition(data.books.find(b=>b.id==='${id}'),'publish')`),true);
assert.equal(run(`data.books.find(b=>b.id==='${id}').workflow.needsRepublish`),false);
assert.equal(run(`data.books.find(b=>b.id==='${id}').workflow.published.materials['STATE-DEMO-M-5'].text`),'The library opens at ten.');
// Preview shares the teacher modal shell and closes from its backdrop.
run(`showListeningNotePreview(document.body,null,data.listeningBank.materials['STATE-DEMO-M-5'].teachingNotes[0])`);
assert.ok($('.teacher-preview-layer .resource-popover.light-mode'));assert.ok($('.resource-popover-body'));assert.equal($('.teacher-preview-layer [title]'),null);
$('.resource-popover-backdrop').click();assert.equal($('.teacher-preview-layer'),null);
assert.equal(run(`analysisPronunciationPreview({ukIPA:'--',usIPA:'',ukAudio:'',usAudio:'--'},'test')`),'');
assert.match(run(`analysisPronunciationPreview({ukIPA:'/test/'},'test')`),/test/);
assert.equal(run(`analysisPronunciationPreview({ukIPA:'/test/'},'test').includes('data-preview-pronunciation')`),false);
assert.equal(run(`analysisPronunciationPreview({usAudio:'assets/test.mp3'},'test').includes('data-preview-pronunciation')`),true);
console.log('PASS published draft editing, republish notice, snapshot isolation and teacher preview');
}finally{w.close()}
