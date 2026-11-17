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
for(let i=1;i<=3;i++){
 const id='REVIEW-DEMO-'+i;
 assert.equal(run(`bookCurrentStage(data.books.find(b=>b.id==='${id}'))`),['一审中','二审中','终审中'][i-1]);
 assert.equal(run(`bookAnalysisSuites(data.books.find(b=>b.id==='${id}')).length`),1);
 run(`showListeningNoteRecords(document.body,{materialId:'${id}-M'},data.listeningBank.materials['${id}-M'].teachingNotes[0])`);
 assert.equal(w.document.querySelectorAll('.lc-record-entry').length,i+1);
 assert.ok($('.lc-record-before'));assert.ok($('.lc-record-after'));assert.ok($('.lc-review-prose ins'));
 $('[data-review-mode=final]').click();assert.equal($('.lc-review-prose del'),null);assert.equal($('.lc-review-prose ins'),null);
 $('[data-review-mode=markup]').click();$('[data-review-next]').click();assert.equal($('.lc-review-count').textContent,'第 2 / '+(i+1)+' 条修订');
 assert.ok($('.lc-review-margin').textContent.includes(['一审员','二审员','终审员'][i-1]));
 $('[data-record-close]').click();
}
const count=run('data.books.length');run('ensureBookReviewDemos()');assert.equal(run('data.books.length'),count);
run("commitWorkspace(s=>s.books=s.books.filter(b=>b.id!=='REVIEW-DEMO-1'));ensureBookReviewDemos()");assert.equal(run('data.books.length'),count-1);
console.log('PASS review stages, revision drawers, isolated fixtures and one-time seeding');
}finally{w.close()}
