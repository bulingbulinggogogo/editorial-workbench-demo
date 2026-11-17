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
run(`var mid='REVIEW-DEMO-3-M';var original=JSON.stringify(bankData().materials[mid].teachingNotes);var previous=structuredClone(bankData().materials[mid].noteHistory.at(-1).before);openListeningCreate(true,{materialId:mid,view:'analysis'})`);await new Promise(r=>setTimeout(r,100));
$('[data-note-records]').dispatchEvent(new w.Event('pointerenter'));assert.ok($('.lc-revision-popover'));assert.equal($('[data-review-prev]'),null);assert.equal($('[data-record-close]'),null);assert.equal(w.document.querySelectorAll('[data-revision-part]').length,3);assert.equal($('.lc-revision-changes').textContent.includes('/ˈ'),false);$('[data-note-records]').dispatchEvent(new w.Event('pointerleave'));$('.lc-revision-popover').dispatchEvent(new w.Event('pointerenter'));await new Promise(r=>setTimeout(r,220));assert.ok($('.lc-revision-popover'));$('.lc-revision-popover').dispatchEvent(new w.Event('pointerleave'));await new Promise(r=>setTimeout(r,220));assert.equal($('.lc-revision-popover'),null);$('[data-note-records]').dispatchEvent(new w.Event('pointerenter'));assert.ok($('.lc-revision-meta').textContent.includes('终审员'));assert.ok($('.lc-revision-changes ins')||$('.lc-revision-changes del'));
$('[data-note-records]').dispatchEvent(new w.Event('pointerleave'));await new Promise(r=>setTimeout(r,220));assert.equal(run('JSON.stringify(bankData().materials[mid].teachingNotes)'),run('original'));
$('[data-note-records]').dispatchEvent(new w.Event('pointerenter'));$('[data-reject-revision]').click();assert.equal($('.lc-revision-popover'),null);assert.equal(run('JSON.stringify(bankData().materials[mid].teachingNotes)'),run('original'));
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,100));assert.ok($('#lc-error').textContent.includes('保存成功'),$('#lc-error').textContent);assert.equal(run('bankData().materials[mid].teachingNotes[0].content'),run('previous.content'));
assert.equal(run('bankData().materials[mid].noteHistory.at(-1).after.content'),run('previous.content'));
const preview=$('[data-note-preview]');assert.equal(preview.nextElementSibling.dataset.noteRecords,'0');preview.dispatchEvent(new w.Event('pointerenter'));assert.ok($('.lc-hover-preview'));assert.equal($('.resource-popover-backdrop'),null);preview.dispatchEvent(new w.Event('pointerleave'));await new Promise(r=>setTimeout(r,220));assert.equal($('.lc-hover-preview'),null);
const markup=run(`listeningRevisionCard({before:{text:'test',wordSelections:[{wordId:'a',posId:'p',meaningId:'1'},{wordId:'b',posId:'p',meaningId:'2'}],content:'旧说明'},after:{text:'test',wordSelections:[{wordId:'b',posId:'p',meaningId:'2'},{wordId:'a',posId:'p',meaningId:'1'}],content:'新说明'}})`);const check=w.document.createElement('div');check.innerHTML=markup;assert.ok(check.querySelector('[data-revision-part=references]').textContent.includes('未变化'));assert.ok(check.querySelector('[data-revision-part=order]').textContent.includes('已调整'));assert.ok(check.querySelector('[data-revision-part=explanation] ins'));
console.log('PASS latest-only popover, dismiss unchanged, reject draft and persisted reversal history');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
