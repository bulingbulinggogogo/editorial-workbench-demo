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
run("document.querySelector('[data-book-type=\"高考真题\"]').click()");
assert.equal($('#question-bank-types [data-page="resource-suites"]'),null);
assert.deepEqual([...w.document.querySelectorAll('[data-book-section]')].map(b=>b.textContent),['基本信息','状态维护','目录与内容','听力套题']);
const id=run('data.gaokaoBookId');assert.ok(run('data.books.some(b=>b.id===data.gaokaoBookId&&b.sharedResources)'));
const n=run('data.books.length');run('commitWorkspace(migrateGaokaoBook)');assert.equal(run('data.books.length'),n);
run("bookSection='状态维护';render()");assert.ok($('#book-section').textContent.includes('编排'));
run("bookSection='目录与内容';render()");assert.ok($('#book-section').textContent.includes('2023'));
assert.ok(run('bookAnalysisSuites(data.books.find(b=>b.id===data.gaokaoBookId)).length')>0);
run("bookSection='解析编写';render()");assert.ok($('.book-analysis-suites'));
console.log('PASS gaokao shared book tabs, persisted idempotent migration, year/paper directories and suite references');
} finally {w.close()}
