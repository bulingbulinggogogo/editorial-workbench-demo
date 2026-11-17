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

(async()=>{try {
run("page='material-center';render()");assert.equal($('#material-center-type'),null);assert.ok($('#material-type-heading #material-type-filter'));
const category=$('#material-type-form input[value="微技能视频"]');category.checked=true;
$('#material-type-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(w.document.querySelectorAll('#material-center-results tbody tr').length,1);assert.ok($('#material-center-results tbody').textContent.includes('微技能视频'));
$('#material-type-reset').click();assert.ok(w.document.querySelectorAll('#material-center-results tbody tr').length>1);

run("var b=data.books.find(b=>b.id==='BK-STATE-DEMO-5');var suite=bookAnalysisSuites(b)[0];var mid=suite.materialIds[0];b.recordingVersions||={};b.recordingVersions[mid]=3;var suiteId=suite.id;var rows=recordingReferenceRows(mid,3)");
assert.equal(run("rows.find(r=>r.bookId===b.id&&r.stage===bookCurrentStage(b)).versionText"),'V3');
assert.equal(run("recordingReferenceRows(mid,1).some(r=>r.bookId===b.id&&r.stage===bookCurrentStage(b))"),false);
assert.equal(run("rows.find(r=>r.bookId===b.id&&r.stage==='已发布').versionText"),'版本未记录');
run("b.workflow.published.recordingVersions={[mid]:1}");
assert.equal(run("recordingReferenceRows(mid,3).some(r=>r.bookId===b.id&&r.stage==='已发布')"),false);
assert.equal(run("recordingReferenceRows(mid,1).find(r=>r.bookId===b.id&&r.stage==='已发布').versionText"),'V1');
assert.equal(run("resourceReferenceRows('suites',bookAnalysisSuites(data.books.find(b=>b.id===data.gaokaoBookId))[0].id).some(row=>row.paperId)"),false);assert.ok(run("resourceReferenceRows('suites',bookAnalysisSuites(data.books.find(b=>b.id===data.gaokaoBookId))[0].id).some(row=>row.bookId===data.gaokaoBookId)"));
run("page='listening-suites';resourceTrail=[];render()");
const button=$('[data-resource-references] button');assert.ok(button);button.click();await new Promise(r=>setTimeout(r,100));
assert.ok($('.ant-drawer'));assert.ok($('.ant-drawer').textContent.includes('引用明细'));assert.ok($('.reference-drawer-table table'));assert.ok($('.ant-drawer-title').textContent.startsWith('听力套题'));assert.equal($('.ant-drawer-body > p.muted'),null);assert.equal([...w.document.querySelectorAll('.reference-drawer-table thead th')].some(th=>th.textContent==='使用版本'),false);assert.equal($('.ant-popover'),null);
$('.ant-drawer-close').click();await new Promise(r=>setTimeout(r,100));
run("data.listeningRevisions||={};data.listeningRevisions['213334']||={};data.listeningRevisions['213334'][2]={material:structuredClone(bankData().materials['213334']),questions:structuredClone(bankQuestions('213334'))};page='listening-bank';resourceTrail=[];render()");
const recordingButton=$('.bank-reference-button');assert.ok(recordingButton);recordingButton.click();await new Promise(r=>setTimeout(r,100));
assert.ok($('.reference-drawer-table').textContent.includes('引用书籍'));assert.ok($('.ant-drawer-body').textContent.includes('书籍 ID：'));assert.equal($('.reference-drawer-table thead th').textContent,'听力套题');assert.ok(/^录音稿.* 引用明细$/.test($('.ant-drawer-title').textContent));assert.equal($('.ant-drawer-body > p.muted'),null);assert.ok($('.reference-version-section h3').textContent.startsWith('V'));assert.equal([...w.document.querySelectorAll('.reference-drawer-table thead th')].some(th=>th.textContent==='使用版本'),false);
assert.ok($('[data-reference-version=\"V1\"]'));assert.ok($('[data-reference-version=\"V2\"]'));
assert.ok([...w.document.querySelectorAll('.reference-drawer-table td[rowspan]')].some(cell=>Number(cell.getAttribute('rowspan'))>1));
$('.ant-drawer-close').click();await new Promise(r=>setTimeout(r,100));
console.log('PASS merged suite/consumer cells, click-only right drawer, consumer version filtering and separate published/working versions');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
