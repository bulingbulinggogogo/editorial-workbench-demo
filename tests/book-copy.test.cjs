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
run("page='books';activeBook='';bookType='听力书籍';render();copyWorkspaceBook('BK-SOURCE-686')");
const source=run("data.books.find(b=>b.id==='BK-SOURCE-686')"),form=$('#workspace-form');
assert.equal(form.elements.name.value,source.name);
assert.notEqual(form.elements.bookId.value,source.bookId);
assert.equal($('#save-book-info').textContent,'确认复制');
form.elements.name.value='  '+source.name+'  ';
form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
assert.equal($('#copy-book-name-error').textContent,'书籍名称和版本不能同时与原书相同，请修改书籍名称或版本。');
const before=run('JSON.stringify(bankData())');
const original=JSON.stringify(source.directoryRoots);
form.elements.name.value=source.name;form.elements.version.value='2027';form.elements.version.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal($('#copy-book-name-error').textContent,'');
form.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));
const copied=run('data.books.find(b=>b.id===activeBook)');
assert.equal(copied.name,source.name);assert.equal(copied.version,'2027');
assert.equal(copied.workflow.stage,'编书中');assert.equal(copied.workflow.published,null);assert.equal(copied.workflow.history.length,0);
assert.equal(run('JSON.stringify(bankData())'),before,'copy creates no new bank questions/materials');
assert.equal(JSON.stringify(source.directoryRoots),original);
assert.notEqual(copied.directoryRoots[0].contentId,source.directoryRoots[0].contentId);
assert.equal($('#book-section').textContent.includes('来源书籍'),false);
run(`const copiedBook=data.books.find(b=>b.id===activeBook);const originalBook=data.books.find(b=>b.id==='BK-SOURCE-686');const cs=bookAnalysisSuites(copiedBook),os=bookAnalysisSuites(originalBook);window.copySuite=cs[0];window.originalSuite=os[0];`);
assert.notEqual(w.copySuite.id,w.originalSuite.id);assert.deepEqual([...w.copySuite.materialIds],[...w.originalSuite.materialIds]);
const oldIds=[...w.originalSuite.materialIds];w.copySuite.materialIds.pop();assert.deepEqual([...w.originalSuite.materialIds],oldIds,'unlink does not affect original composition');
console.log('PASS copied form, trimmed name validation, unique IDs, reset workflow, independent directories/suites, shared bank and hidden source');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
