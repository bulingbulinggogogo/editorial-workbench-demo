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
run("data.books.find(b=>b.id===data.gaokaoBookId).workflow={stage:'解析编写中',steps:['终审'],round:0,reviews:{},history:[]}");
const paperId=run('Object.keys(bankData().papers).find(id=>bankData().papers[id].materialIds.length)');
const suiteId=run('bankData().papers['+JSON.stringify(paperId)+'].listeningSuiteId');assert.ok(suiteId);
assert.ok(run('resourceUses("suites",'+JSON.stringify(suiteId)+').length')>0);
assert.ok(run('resourceReferenceRows("suites",'+JSON.stringify(suiteId)+').some(r=>r.bookId===data.gaokaoBookId)'));
const count=run('Object.keys(resourceStore().suites).length');run('commitWorkspace(()=>{})');assert.equal(run('Object.keys(resourceStore().suites).length'),count);
run('page="resource-suites";resourceOpen("papers",'+JSON.stringify(paperId)+',"edit")');

assert.equal($('#suite-batch-add'),null);assert.equal($('#suite-add-material'),null);assert.ok($('#paper-edit-suite'));assert.ok($('#paper-listening-content').textContent.includes(suiteId));
assert.equal(run('suiteStructureEditable('+JSON.stringify(suiteId)+')'),false);
run('var capturedBatch;openListeningCreate=(batch,editing,context)=>{capturedBatch={batch,editing,context}}');
$('#paper-edit-suite').click();assert.equal(run('capturedBatch.context.suiteId'),suiteId);assert.equal(run('capturedBatch.editing.view'),'content');
$('#paper-view-suite').click();assert.equal(run('capturedBatch.editing.readOnly'),true);
run('getSuiteDraft('+JSON.stringify(suiteId)+').materialIds.push("NEW-TEST")');assert.equal(run('saveSuiteDraft()'),false);run('suiteEditorDraft=null');
$('#paper-unlink-suite').click();$('#paper-unlink-confirm').click();assert.ok($('#paper-use-suite'));assert.ok(run('resourceStore().suites['+JSON.stringify(suiteId)+']'));
assert.equal($('#suite-add-material'),null);
$('#paper-use-suite').click();const choice=[...w.document.querySelectorAll('#resource-picker input')].find(el=>el.value===suiteId);assert.ok(choice);choice.checked=true;$('#resource-picker').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(run('bankData().papers['+JSON.stringify(paperId)+'].listeningSuiteId'),suiteId);
assert.equal(run('suiteStructureEditable('+JSON.stringify(suiteId)+')'),false);
run('var freeId=nextBusinessId("suites");resourceStore().suites[freeId]={id:freeId,name:"未引用",materialIds:[]}');
assert.equal(run('suiteStructureEditable(freeId)'),true);
run('getSuiteDraft(freeId).materialIds.push(Object.keys(bankData().materials)[0])');assert.equal(run('saveSuiteDraft()'),true);
run('resourceDelete("suites",freeId)');$('#resource-confirm-delete').click();assert.equal(run('resourceStore().suites[freeId]'),undefined);
console.log('PASS paper whole-suite reference, editor/view, unlink preservation, single-suite selection, referenced structure lock, free suite edit/dissolve');
} finally {w.close()}
