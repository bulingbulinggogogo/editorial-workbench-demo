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
run(`var testBook=data.books.find(b=>b.directoryRoots?.length);var expectedSuites=bookAnalysisSuites(testBook);var testHost=document.createElement('div');document.body.append(testHost);renderBookAnalysisSuites(testBook,testHost)`);
assert.ok(run('expectedSuites.length>0'));
assert.equal(run("[...testHost.querySelectorAll('th')].map(e=>e.textContent).join(',')"),'套题ID,套题名称,状态,操作');
assert.equal(run('testHost.querySelectorAll("[data-book-suite-edit]").length'),0);
assert.equal(run('new Set(expectedSuites.map(s=>String(s.id))).size'),run('expectedSuites.length'));
assert.equal(run('testHost.textContent.includes("新建任务")'),false);
run(`var opened=null;openListeningCreate=(batch,editing)=>{opened=editing};var index=expectedSuites.findIndex(s=>s.materialIds.length);testHost.querySelector('[data-book-suite-analysis="'+index+'"]').click()`);
if($('[data-analysis-material]'))$('[data-analysis-material]').click();assert.equal(run('opened.view'),'analysis');
run('renderBookAnalysisSuites({directoryNodes:[]},testHost)');assert.equal(run('testHost.querySelector("tbody").textContent.trim()'),'--');
console.log('PASS book suite table, unique suite rows, analysis and editing destinations, empty book');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
