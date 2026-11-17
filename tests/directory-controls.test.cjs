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
assert.equal(w.document.querySelectorAll('.directory-content-toolbar > details').length,2);
assert.equal($('.directory-content-toolbar > button'),null);
assert.equal($('[data-resource-action=rename]').textContent,'');assert.ok($('[data-resource-action=rename] svg'));assert.equal($('[data-resource-action=delete]').textContent,'');
const parent=run('selectedDirectory');
$('[data-resource-action=new-directory][data-value=child]').click();$('#inline-directory-name').value='二级内容';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id===selectedDirectory).parentId'),parent);
$('[data-resource-action=new-directory][data-value=sibling]').click();$('#inline-directory-name').value='同级内容';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id===selectedDirectory).parentId'),parent);
$('[data-resource-action=rename]').click();$('#inline-directory-name').value='修改后的目录';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.ok($('.book-tree-row.selected').textContent.includes('修改后的目录'));
$('[data-resource-action=new-directory][data-value=root]').click();$('#inline-directory-name').value='新一级';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id===selectedDirectory).parentId'),'');
console.log('PASS compact menus, icon actions, inline root/child/sibling creation and renaming');
}finally{w.close()}
