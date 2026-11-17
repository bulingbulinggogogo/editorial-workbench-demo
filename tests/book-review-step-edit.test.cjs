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


try{
run("resourceTrail=[];page='books';activeBook='REVIEW-DEMO-2';bookSection='状态维护';render()");
assert.equal($('[data-inline-remove-step="0"]').disabled,true);
assert.equal($('[data-inline-remove-step="1"]').disabled,false);
assert.ok($('[data-inline-edit-step="1"]'));
const previous=run("JSON.stringify(bookFlow(data.books.find(b=>b.id===activeBook)).reviews)");
assert.equal(run("updateBookReviewSteps(activeBook,['二审','终审'],[1,2])"),false);
assert.equal(run("JSON.stringify(bookFlow(data.books.find(b=>b.id===activeBook)).reviews)"),previous);
$('[data-inline-edit-step="0"]').click();$('[data-step-name="0"]').value='初审';$('[data-inline-edit-step="0"]').click();
assert.equal($('[data-inline-remove-step="0"]').disabled,true);
assert.equal(run("JSON.stringify(bookFlow(data.books.find(b=>b.id===activeBook)).reviews)"),previous);
$('[data-inline-remove-step="1"]').click();
assert.deepEqual(Array.from(run("bookFlow(data.books.find(b=>b.id===activeBook)).steps")),['初审','终审']);
assert.equal(run("bookFlow(data.books.find(b=>b.id===activeBook)).round"),1);
assert.ok(run("Object.values(bookFlow(data.books.find(b=>b.id===activeBook)).reviews).every(r=>r[0].passed)"));
$('#book-inline-add-step').click();
assert.equal(run("bookFlow(data.books.find(b=>b.id===activeBook)).steps.length"),3);
assert.equal($('[data-inline-remove-step="0"]').disabled,true);
run("editBookReviewSteps(data.books.find(b=>b.id===activeBook))");
assert.equal($('[data-remove-step="0"]').disabled,true);
assert.equal($('[data-remove-step="1"]').disabled,false);
console.log('PASS completed review deletion blocked in UI and save; rename/add/remove preserve completion records');
}finally{w.close()}
