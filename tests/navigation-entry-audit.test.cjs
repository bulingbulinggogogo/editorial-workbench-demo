const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};const nativeStyle=w.getComputedStyle.bind(w);w.getComputedStyle=el=>nativeStyle(el);
w.HTMLMediaElement.prototype.pause=function(){};w.URL.revokeObjectURL=()=>{};w.confirm=()=>{throw Error('只读页面不应提示未保存')};
const ctx=dom.getInternalVMContext();
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
for(const match of html.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='app-storage.js')vm.runInContext(fs.readFileSync(match[1],'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),$=s=>w.document.querySelector(s);
const closeWindow=w.close.bind(w);w.close=()=>{w.document.querySelectorAll('#listening-create').forEach(el=>el.dispatchEvent(new w.Event('close')));w.BookUI?.disposeSelects?.();closeWindow();};


(async()=>{try{
const tick=()=>new Promise(r=>setTimeout(r,0));
const click=async sel=>{assert.ok($(sel),'入口不存在 '+sel);$(sel).click();await tick()};
await click('[data-book-type="听力书籍"]');
$('#book-search').value='【测试】';$('#book-search').dispatchEvent(new w.Event('change'));await tick();
const bookButton=$('[data-open-book="REVIEW-DEMO-3"]')||$('[data-open-book]');assert.ok(bookButton);console.log('书籍入口',bookButton.closest('tr').textContent);bookButton.click();await tick();
await click('[data-book-section="目录与内容"]');
assert.equal($('.chapter-resource-title').tagName,'SPAN');
assert.equal($('.chapter-resource-title').hasAttribute('data-resource-action'),false);
const before=run('JSON.stringify(data)');
await click('.content-row-actions [data-resource-action="view"]');
assert.equal($('#listening-create h2').textContent,'查看听力套题');
assert.ok($('#listening-create .lc-header #lc-close'));
for(const tab of ['content','clues','analysis','cloze']){
 await click('[data-edit-view="'+tab+'"]');
 if(tab==='analysis'){
  assert.ok($('.lc-continuous-note [data-continuous-fields]'));
  assert.ok($('.lc-continuous-note [data-selected-word]'));
  assert.ok($('.lc-continuous-note .ql-editor[contenteditable="false"]'));
  assert.equal($('.lc-continuous-note [draggable="true"]'),null);
  assert.ok($('.lc-continuous-note [data-remove-word]').disabled);
 }

 assert.equal($('#lc-save-progress'),null);
 assert.equal($('[data-add-recording]'),null);assert.equal($('[data-reference-recording]'),null);assert.equal($('[data-unlink-recording]'),null);
 assert.equal(w.document.querySelectorAll('#listening-create [contenteditable="true"]').length,0);
 for(const field of w.document.querySelectorAll('#listening-create .lc-body input,#listening-create .lc-body textarea,#listening-create .lc-body select')){
  if(field.type==='file')continue;
  assert.ok(field.disabled||field.readOnly,'可编辑字段 '+field.outerHTML);
 }
}
await click('#lc-close');assert.equal($('#listening-create'),null);
const diff=(a,b,path='')=>{if(JSON.stringify(a)===JSON.stringify(b))return [];if(!a||!b||typeof a!=='object'||typeof b!=='object')return [path];return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],path+'.'+k))};assert.deepEqual(diff(JSON.parse(before),JSON.parse(run('JSON.stringify(data)'))),[]);
await click('.content-row-actions [data-resource-action="edit"]');
assert.equal($('#listening-create h2').textContent,'编辑听力套题');assert.ok($('#lc-save-progress'));assert.ok($('[data-add-recording]'));
console.log('点击编辑后', $('#listening-create h2').textContent, '顶部返回',!!$('#listening-create .lc-header #lc-close'));
await click('[data-edit-view="analysis"]');console.log('点拨局部保存按钮数量',w.document.querySelectorAll('#lc-save-note').length);
await click('[data-group-note="百科知识"]');console.log('新增百科点拨后局部保存按钮数量',w.document.querySelectorAll('#lc-save-note').length);
run("document.querySelector('#listening-create').remove()");
await click('.nav [data-page="vocabulary"]');await click('#new-word');console.log('新增词条弹窗底部', $('#dialog footer').textContent);run('closeDialog()');
await click('.nav [data-page="listening-suites"]');
await click('[data-resource-action="edit"]');console.log('套题编辑页', $('#page h1').textContent);
await click('#suite-add-material');console.log('添加录音稿弹窗', $('#dialog footer').textContent);run('closeDialog()');
const name=$('.resource-title-input');name.value+='核验';name.dispatchEvent(new w.Event('input',{bubbles:true}));await click('[data-resource-action="back"]');console.log('离开提示', $('#dialog footer').textContent);await click('#suite-discard');
await click('.nav [data-page="listening-bank"]');await click('#bank-batch-add');console.log('批量新增', $('#listening-create .lc-footer').textContent, '顶部返回',!!$('#listening-create .lc-header #lc-close'));
console.log('PASS reachable navigation checks');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});