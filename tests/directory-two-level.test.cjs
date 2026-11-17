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
run("resourceTrail=[];page='books';bookType='听力书籍';activeBook='BK-SOURCE-686';bookSection='目录与内容';selectedDirectory=data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>!n.parentId).id;render()");
assert.equal($('.book-directory-content').textContent,'');assert.equal($('.directory-detail-table'),null);assert.ok($('[data-value=child]'));
run("selectedDirectory=data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.parentId).id;render()");
assert.deepEqual([...new Set([...w.document.querySelectorAll('.directory-detail-table th')].map(n=>n.textContent))],['名称','分类与编号','操作']);assert.equal(w.document.querySelectorAll('.directory-detail-table .ant-table-row').length,3);assert.equal($('[data-value=child]'),null);assert.ok($('.directory-detail-table').textContent.includes('听力练习'));assert.ok([...w.document.querySelectorAll('.directory-detail-table .ant-table-row')].every(r=>/（ID：\d+）$/.test(r.children[1].textContent)));assert.ok($('.directory-detail-table').textContent.includes('14136'));assert.ok($('.directory-detail-table .ant-btn-dangerous'));
$('[data-resource-action=view]').click();assert.equal(run('resourceTrail.at(-1).mode'),'view');$('[data-resource-action=back]').click();assert.ok($('.directory-detail-table'));
assert.ok([...w.document.querySelectorAll('.directory-category-tag')].every(t=>!t.querySelector('svg')&&t.textContent.includes('ID：')&&t.style.fontSize==='13px'&&t.style.whiteSpace==='nowrap'));
assert.ok([...w.document.querySelectorAll('.directory-detail-table .ant-table-row')].every(r=>r.children[0].querySelector('.directory-row-name svg')));

const firstItem=run("data.directoryContents[data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id===selectedDirectory).contentId].items[0].kind");
$('.directory-detail-table .directory-sort-handle').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
assert.equal(run("data.directoryContents[data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id===selectedDirectory).contentId].items[1].kind"),firstItem);
run("render()");
assert.equal($('.directory-detail-table .ant-table-row:nth-child(3) .directory-category-tag').textContent.includes('词汇表'),true);
run("commitWorkspace(d=>{const b=d.books.find(b=>b.id===activeBook),root=b.directoryRoots[0],edges=d.directoryContents[root.contentId].children;edges.push({...edges[0],id:nextBusinessId('directories',d),name:'排序案例'})});render()");
const children=[...w.document.querySelectorAll('[data-directory-row]')].filter(el=>el.dataset.directoryRow.includes('/'));
const childId=children[0].dataset.directoryRow;
children[0].querySelector('.directory-sort-handle').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
assert.equal([...w.document.querySelectorAll('[data-directory-row]')].filter(el=>el.dataset.directoryRow.includes('/'))[1].dataset.directoryRow,childId);
const rootOrder=run("JSON.stringify(data.books.find(b=>b.id===activeBook).directoryRoots)");
const rootHandle=$('[data-directory-row] .directory-sort-handle');
rootHandle.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
assert.equal(run("JSON.stringify(data.books.find(b=>b.id===activeBook).directoryRoots)"),rootOrder);
console.log('PASS first-level grouping only, second-level three-column Ant table, no third-level create, view/back');
}finally{w.close()}
