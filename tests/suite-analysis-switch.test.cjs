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
run(`var ids=Object.keys(bankData().materials).slice(0,2);var saved=0;openListeningCreate(true,{materialId:ids[0],view:'analysis'},{suiteMaterials:ids,onSaved:()=>saved++})`);
await new Promise(r=>setTimeout(r,100));
const modal=$('#listening-create');let closes=0;modal.addEventListener('close',()=>closes++);
assert.equal($('#lc-suite-material'),null);assert.equal($('.lc-suite-navigation'),null);
assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,2);
assert.equal($('#lc-save-progress').textContent,'保存整套');
$('[data-edit-view="content"]').click();
const original0=run('bankData().materials[ids[0]].text');
const field0=$('[data-sentence] [data-sfield="text"]')||$('#lc-edit-transcript');assert.ok(field0);field0.value+=' first edit';field0.dispatchEvent(new w.Event('input',{bubbles:true}));
modal.querySelectorAll('[data-suite-recording]')[1].click();
assert.ok(modal.open);assert.equal($('#listening-create'),modal);assert.equal(closes,0);
assert.ok($('[data-edit-view="content"]').classList.contains('active'));
const field1=$('[data-sentence] [data-sfield="text"]')||$('#lc-edit-transcript');field1.value+=' second edit';field1.dispatchEvent(new w.Event('input',{bubbles:true}));
modal.querySelectorAll('[data-suite-recording]')[0].click();
assert.ok(($('[data-sentence] [data-sfield="text"]')||$('#lc-edit-transcript')).value.endsWith(' first edit'));
assert.equal(run('bankData().materials[ids[0]].text'),original0);
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,150));
assert.match(run('bankData().materials[ids[0]].text'),/first edit/);
assert.match(run('bankData().materials[ids[1]].text'),/second edit/);
assert.equal(run('saved'),1);assert.ok(modal.open);assert.equal(closes,0);
assert.equal($('#lc-save-progress').textContent,'保存整套');
console.log('PASS sidebar switching preserves drafts; one save commits both recordings without closing.');
}finally{w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
