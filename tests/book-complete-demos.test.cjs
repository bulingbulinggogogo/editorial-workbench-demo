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
const ids=run(`data.books.filter(b=>/^BK-STATE-DEMO-\\d+$|^REVIEW-DEMO-\\d+$/.test(b.id)).map(b=>b.id)`);assert.equal(ids.length,10);
assert.equal(run(`Object.values(bankData().questions).filter(q=>/^(STATE-DEMO-M-|REVIEW-DEMO-)/.test(q.scriptId)).every(q=>bankQuestionProgress(q).complete)`),true);
for(const id of ids){
 run(`var b=data.books.find(b=>b.id==='${id}'),suite=bookAnalysisSuites(b)[0];openWholeSuiteEditor({id:suite.id,bookReference:{bookId:b.id}})`);
 await new Promise(r=>setTimeout(r,30));assert.ok($('#lc-save-progress'),id);
 $('#lc-save-progress').click();await new Promise(r=>setTimeout(r,70));
 assert.ok($('#lc-error').textContent.includes('保存成功'),id+': '+$('#lc-error').textContent);
 $('#lc-close').click();await new Promise(r=>setTimeout(r,30));
}
run(`openWholeSuiteEditor({id:Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='REVIEW-DEMO-2-S').id})`);await new Promise(r=>setTimeout(r,30));
const initial=w.document.querySelectorAll('[data-suite-recording]').length;
assert.equal($('[data-reference-recording]').textContent,'＋ 引用听力题库');
$('[data-add-recording]').click();assert.ok($('.lc-batch-overlay[open]'));assert.ok($('#lc-batch-raw'));assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,initial);
w.confirm=()=>true;$('#listening-create #lc-close').click();assert.equal($('.lc-batch-overlay'),null);assert.ok($('#listening-create [data-add-recording]'));assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,initial);
console.log('PASS all ten unmodified fixtures save; batch modal opens/cancels without blank additions');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
