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

try{
 run("window.b=data.books.find(b=>b.id==='BK-STATE-DEMO-1');b.workflow.stage='已定稿';b.workflow.published=bookFlowSnapshot(b,true);b.workflow.reviews={sample:{0:{passed:true}}};window.before=JSON.stringify(b.workflow.published);window.suite=bookAnalysisSuites(b)[0]");
 run("renderBookWorkflow(b,document.querySelector('#page'))");
 assert.ok($('[data-book-flow=return-arranging]'));
 $('[data-book-flow=return-arranging]').click();assert.ok($('#dialog').textContent.includes('线上保留上次发布'));
 run('closeDialog();returnBookToArranging(b.id)');
 assert.equal(run('bookFlow(data.books.find(x=>x.id===b.id)).stage'),'编书中');
 assert.equal(run('JSON.stringify(data.books.find(x=>x.id===b.id).workflow.published)'),run('before'));
 assert.equal(run('Object.keys(data.books.find(x=>x.id===b.id).workflow.reviews).length'),0);
 run("b=data.books.find(x=>x.id===b.id);renderBookAnalysisSuites(b,document.querySelector('#page'))");
 assert.ok($('[data-book-suite-analysis]').disabled);assert.ok($('[data-book-suite-cloze]').disabled);
 run("b.workflow.stage='解析编写中';renderBookAnalysisSuites(b,document.querySelector('#page'))");
 assert.equal($('[data-book-suite-cloze]').disabled,false);
 run("openWholeSuiteEditor({id:suite.id,bookReference:{bookId:b.id}})");
 assert.equal($('[data-add-recording]'),null);assert.equal($('[data-unlink-recording]'),null);assert.equal($('[data-add-question]'),null);assert.equal($('[data-delete-question]'),null);assert.ok($('.lc-recording-sort'));
 run("window.mid=suite.materialIds[0];window.source=listeningRevisionSource(mid,b.id);window.bad={...source.material,materialId:mid,questions:[]}");
 assert.throws(()=>run("persistListeningRevision(data,b.id,bad,'correction')"),/不允许增删/);
 run("showListeningVersions(mid)");assert.ok($('#dialog').textContent.includes('引用书籍'));assert.ok($('[data-version-preview]'));
 run("closeDialog();window.savedPicker=BookUI.renderBankReferencePicker;BookUI.renderBankReferencePicker=(host,props)=>{window.pickerProps=props;return ()=>{}};data.listeningRevisions ||= {};data.listeningRevisions[mid]={2:{material:structuredClone(source.material),questions:structuredClone(source.questions)}};openListeningReferencePicker([], (ids,versions)=>{window.chosenVersions=versions});pickerProps.onSelection([mid])");
 assert.equal($('[data-reference-version]').value,'2');
 $('[data-reference-version]').value='1';$('[data-reference-version]').dispatchEvent(new w.Event('change'));$('#lc-bank-confirm').click();
 assert.equal(run('chosenVersions[mid]'),1);run('BookUI.renderBankReferencePicker=savedPicker');
 console.log('PASS rollback preserves publication, resets reviews, phase gates, structure save guard and version history');
}finally{w.close()}
