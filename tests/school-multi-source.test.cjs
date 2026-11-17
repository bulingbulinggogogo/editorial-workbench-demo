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



(async()=>{try{w.URL.revokeObjectURL=()=>{};
run("page='books';activeBook='';bookType='听力书籍';renderBookWorkspace()");assert.ok(![...w.document.querySelectorAll('th')].some(th=>th.textContent==='校本书籍'));
run("bookType='校本书籍';renderBookWorkspace()");assert.ok($('#generate-school-book'));$('#generate-school-book').click();assert.ok($('#school-builder'));
const selection=run(`(()=>{const list=schoolSuiteChoices(),a=list.find(c=>c.bookId),b=list.find(c=>c.bookId&&c.bookId!==a.bookId&&c.id!==a.id),c=list.find(c=>!c.bookId&&c.id!==a.id&&c.id!==b.id);return [a,b,c]})()`);assert.equal(selection.length,3);
const before=run("JSON.stringify({bank:bankData(),suites:resourceCollection('suites'),roots:data.books.map(b=>b.directoryRoots)})");
for(const choice of selection){const box=[...w.document.querySelectorAll('[data-school-suite]')].find(e=>e.dataset.schoolSuite===choice.key);box.checked=true;box.dispatchEvent(new w.Event('change'));}
assert.equal($('#school-builder-count').textContent,'3');$('#school-builder').elements.name.value='跨书校本测试';for(const input of w.document.querySelectorAll('[data-school-path]')){input.value='实战篇/精选训练';input.dispatchEvent(new w.Event('input'));}
$('#school-builder').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const book=run("data.books.find(b=>b.name==='跨书校本测试')");assert.ok(book);assert.equal(book.sourceListeningBookIds.length,2);assert.equal(book.directoryNodes.length,2);assert.equal(run("data.directoryContents[data.books.find(b=>b.name==='跨书校本测试').directoryNodes[1].contentId].items.length"),3);
assert.equal(run("JSON.stringify({bank:bankData(),suites:resourceCollection('suites'),roots:data.books.filter(b=>b.name!=='跨书校本测试').map(b=>b.directoryRoots)})"),before);
$('#edit-directory').click();assert.ok($('.directory-rename-button'));assert.ok($('.directory-insert-gap'));assert.equal($('.content-row-actions [data-resource-action=edit]'),null);assert.ok($('.unified-content-row .directory-sort-handle'));
$('.directory-rename-button').click();$('#inline-directory-name').value='改名实战篇';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run("data.books.find(b=>b.name==='跨书校本测试').directoryNodes[0].name"),'改名实战篇');
run("var targetSchool=data.books.find(b=>b.name==='跨书校本测试');openSchoolBookBuilder(targetSchool.id,targetSchool.directoryNodes[1].contentId)");
assert.equal($('#directory-add-new'),null);const extra=[...w.document.querySelectorAll('[data-school-suite]')].find(box=>!box.disabled);assert.ok(extra);extra.checked=true;extra.dispatchEvent(new w.Event('change'));$('#school-builder').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run("data.directoryContents[data.books.find(b=>b.name==='跨书校本测试').directoryNodes[1].contentId].items.length"),4);
const first=$('.unified-content-row .directory-sort-handle');first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
$('#save-directory').click();$('.content-row-actions [data-resource-action=view]').click();await new Promise(r=>setTimeout(r,100));assert.ok($('#listening-create'));assert.equal($('#lc-save-progress'),null);assert.equal($('[data-add-recording]'),null);
console.log('PASS multi-book + bank selection, no source/bank mutation, independent directory rename/sort and readonly suite');
}finally{w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
