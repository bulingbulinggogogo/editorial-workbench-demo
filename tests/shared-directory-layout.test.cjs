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
run("resourceTrail=[];page='books';bookType='听力书籍';activeBook='BK-SOURCE-686';bookSection='目录与内容';selectedDirectory='';render()");
assert.ok($('.book-directory-layout'));assert.ok($('.book-directory-sidebar'));assert.ok($('.book-directory-content'));assert.ok($('.book-tree-row.selected'));assert.ok($('.directory-content-table').textContent.includes('词汇表'));assert.ok($('.directory-content-table').textContent.includes('听力套题'));assert.ok($('.directory-content-table').textContent.includes('精听挖空'));
const id=run('selectedDirectory');$('[data-resource-action=content-view]').click();assert.equal(run('resourceTrail.at(-1).mode'),'view');$('[data-resource-action=back]').click();assert.equal(run('selectedDirectory'),id);assert.ok($('.book-directory-layout'));
$('[data-resource-action=package-new][data-value=wordlists]').click();$('#resource-form input').value='新的配套词汇';$('#resource-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('resourceTrail.at(-1).kind'),'wordlists');$('[data-resource-action=back]').click();assert.ok($('.directory-content-table').textContent.includes('新的配套词汇'));
console.log('PASS restored split directory layout, package content rows, view/back context and inline content creation');
}finally{w.close()}
