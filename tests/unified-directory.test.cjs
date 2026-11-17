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
assert.ok($('.book-directory-unified'));assert.equal($('.directory-row-actions [data-resource-action=add-content]'),null);assert.equal($('.unified-directory-toolbar [data-resource-action=new-directory]'),null);assert.equal($('[data-resource-action=reference-directory]'),null);assert.equal($('[data-resource-action=copy-directory]'),null);assert.ok($('.unified-name .directory-rename-button'));assert.ok($('[data-resource-action=delete]').classList.contains('btn'));assert.ok($('.directory-depth-switch[role=radiogroup]'));assert.equal($('.book-directory-sidebar'),null);
assert.equal($('.chapter-number'),null);assert.ok($('.directory-insert-gap'));assert.equal($('[data-resource-action=delete-row]').closest('details'),null);assert.equal($('[data-resource-action=rename]').closest('details'),null);assert.ok($('.unified-content-row'));const first=$('.unified-content-row'),key=first.dataset.rowKey;
first.querySelector('[data-resource-action=view]').click();assert.ok(run('resourceTrail.length'));run('resourceTrail=[];render()');
$('[name=directory-expand-depth][value=second]').click();assert.ok($('[data-directory-row]'));assert.equal($('.unified-content-row'),null);
$('[name=directory-expand-depth][value=all]').click();assert.ok($('.unified-content-row'));
const owner=$('[data-action-owner] [data-resource-action=rename]').closest('[data-action-owner]').dataset.actionOwner;
$('[data-action-owner="'+owner+'"] [data-resource-action=rename]').click();
assert.equal($('#inline-directory-name').value,run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id==='+JSON.stringify(owner)+').name'));
assert.ok($('.unified-name #inline-directory-form'));assert.equal($('#inline-directory-form button'),null);$('#inline-directory-name').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal($('#inline-directory-form'),null);
$('[data-resource-action=rename]').click();const renameId=$('#inline-directory-form').closest('[data-directory-row]').dataset.directoryRow;$('#inline-directory-name').value='回车修改目录';$('#inline-directory-name').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id==='+JSON.stringify(renameId)+').name'),'回车修改目录');
const row=$('.unified-content-row');const nodeId=row.dataset.itemOwner;const before=run('data.directoryContents[data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id==='+JSON.stringify(nodeId)+').contentId].items.length');
row.querySelector('[data-resource-action=delete-row]').click();$('#directory-item-remove').click();
assert.equal(run('data.directoryContents[data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id==='+JSON.stringify(nodeId)+').contentId].items.length'),before-1);
const gap=$('[data-insert-kind="directory"]'),slots=gap.querySelectorAll('button'),add=slots[1];assert.equal(gap.querySelector('details'),null);assert.equal(slots.length,2);assert.equal(slots[0].dataset.value,'sibling');assert.equal(slots[1].dataset.value,'child');
slots[0].focus();slots[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(w.document.activeElement,slots[1]);assert.ok(slots[1].classList.contains('is-active'));
const parent=gap.dataset.actionOwner;add.click();assert.ok($('#inline-directory-form'));$('#inline-directory-name').value='位置新增子目录';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.name==="位置新增子目录").parentId'),parent);
const contentGap=$('[data-insert-kind="content"]'),contentSlots=contentGap.querySelectorAll('button');assert.equal(contentSlots.length,3);assert.equal(contentSlots[0].getAttribute('aria-label'),'新增第1级目录');assert.equal(contentSlots[1].getAttribute('aria-label'),'新增第2级目录');assert.equal(contentSlots[2].dataset.resourceAction,'insert-content');
contentSlots[0].click();$('#inline-directory-name').value='从内容行新增一级目录';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.name==="从内容行新增一级目录").parentId'),'');
const nestedGap=[...w.document.querySelectorAll('[data-insert-kind="directory"]')].find(el=>run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id==='+JSON.stringify(el.dataset.actionOwner)+').parentId'));
assert.ok(nestedGap);assert.equal(nestedGap.querySelectorAll('button').length,3);const rootPlus=nestedGap.querySelector('button');assert.equal(rootPlus.getAttribute('aria-label'),'新增第1级目录');rootPlus.click();$('#inline-directory-name').value='二级目录处新增一级';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.name==="二级目录处新增一级").parentId'),'');
// Inserting from a middle row must retain that row even if another action changes selection.
const middleGap=[...w.document.querySelectorAll('[data-insert-kind="directory"]')].find(el=>el.querySelectorAll('button').length===3);
const siblingPlus=middleGap.querySelectorAll('button')[1],insertOwner=siblingPlus.dataset.actionOwner;
siblingPlus.click();assert.equal($('#inline-directory-form').nextElementSibling,middleGap);
// The saved order is anchored to the original target, independent of the global selection.
run("selectedDirectory=BOOK_DIRECTORY_ROOT");
$('#inline-directory-name').value='中间插入回归';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.ok(run(`(()=>{const b=data.books.find(b=>b.id===activeBook),n=b.directoryNodes.find(n=>n.id===${JSON.stringify(insertOwner)}),edges=directoryEdges(b,n,data),i=edges.findIndex(e=>e.id===n.edgeId);return edges[i+1].name==='中间插入回归'})()`));
assert.ok($('.directory-trash-button svg'));assert.equal($('.directory-trash-button img'),null);
console.log('PASS unified directory, expand/collapse, view, contextual rename and content unlink.');
}finally{w.close()}
