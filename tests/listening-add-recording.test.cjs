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

w.URL.revokeObjectURL=()=>{};w.scrollTo=()=>{};
(async()=>{try{
run(`var sid=Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='STATE-DEMO-S-5').id;openWholeSuiteEditor({id:sid})`);await new Promise(r=>setTimeout(r,80));
$('[data-add-recording]').click();assert.ok($('.lc-batch-overlay[open]'));assert.ok($('#lc-batch-raw'));w.confirm=()=>true;$('#listening-create #lc-close').click();
assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,1);
$('[data-reference-recording]').click();assert.ok($('#lc-bank-picker .ant-table'));
const search=$('#lc-bank-picker .ant-input');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(search,'STATE-DEMO-M-0');search.dispatchEvent(new w.Event('input',{bubbles:true}));$('#lc-bank-picker .ant-input-search-button').click();await new Promise(r=>setTimeout(r,40));
$('[data-bank-pick="STATE-DEMO-M-0"]').click();await new Promise(r=>setTimeout(r,30));$('#lc-bank-confirm').click();
assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,2);assert.equal(run('data.teachingLibrary.suites[sid].materialIds.length'),1);
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,80));assert.equal(run('data.teachingLibrary.suites[sid].materialIds.length'),2,$('#lc-error').textContent);
const original=$('[data-qfield=text]').value;$('[data-qfield=text]').value='';$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,80));assert.ok($('#lc-error').textContent.includes('题干'));$('[data-qfield=text]').value=original;
while($('[data-unlink-recording]')){$('[data-unlink-recording]').click();$('#lc-unlink-confirm').click();}
assert.equal(run('data.teachingLibrary.suites[sid].materialIds.length'),2);$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,80));assert.equal(run('data.teachingLibrary.suites[sid].materialIds.length'),0);assert.ok(run(`bankData().materials['STATE-DEMO-M-0']`));
console.log('PASS batch entry/cancel, reference staged save, required fields and unlink without deleting library');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
