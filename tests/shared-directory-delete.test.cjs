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
run("resourceTrail=[];page='books';bookType='听力书籍';activeBook='BK-SOURCE-686';bookSection='目录与内容';selectedDirectory=data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.kind==='目录').id;render()");
const library=run('JSON.stringify(resourceStore())'),school=run('JSON.stringify(data.books.find(b=>b.id==="BK-SCHOOL-686"))');
assert.ok($('[data-resource-action=delete-directory]'));
$('[data-resource-action=delete-directory]').click();assert.ok($('#dialog').textContent.includes('及其下 1 个目录项'));run('closeDialog()');assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.length'),2);
$('[data-resource-action=delete-directory]').click();$('#shared-directory-delete').click();assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.length'),0);assert.equal(run('JSON.stringify(resourceStore())'),library);assert.equal(run('JSON.stringify(data.books.find(b=>b.id==="BK-SCHOOL-686"))'),school);assert.equal(run('selectedDirectory'),run('BOOK_DIRECTORY_ROOT'));
console.log('PASS directory deletion, cancellation, descendants, selection reset, shared content and other books preserved');
}finally{w.close()}
