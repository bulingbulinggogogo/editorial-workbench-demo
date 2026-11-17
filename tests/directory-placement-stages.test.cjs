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

w.URL.revokeObjectURL=()=>{};w.scrollTo=()=>{};
try {
run("resourceTrail=[];page='books';bookType='听力书籍';activeBook='BK-SOURCE-686';bookSection='目录与内容';selectedDirectory='';render()");
run(`commitWorkspace(d=>{const b=d.books.find(b=>b.id===activeBook),source=b.directoryNodes.find(n=>d.directoryContents[n.contentId].items.length),cid=directoryContentId(d);d.directoryContents[cid]={id:cid,items:structuredClone(d.directoryContents[source.contentId].items),children:[]};b.directoryRoots=[{id:'placement-test',name:'位置测试',contentId:cid}]});render()`);
const firstOwner=$('.unified-content-row').dataset.itemOwner;
const root=[...w.document.querySelectorAll('[data-directory-row]')].find(row=>row.dataset.directoryRow===firstOwner),gap=root.nextElementSibling;
gap.querySelector('[data-value=child]').click();$('#inline-directory-name').value='插入在内容之前';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const inserted=[...w.document.querySelectorAll('[data-directory-row]')].find(row=>row.textContent.includes('插入在内容之前'));
assert.ok(inserted);const parent=inserted.parentElement;const items=[...parent.children];
assert.equal($('.unified-content-row').dataset.itemOwner,inserted.dataset.directoryRow,'following content belongs to the inserted directory');
assert.ok(run("data.directoryContents[data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.name==='插入在内容之前').contentId].items.length")>0);
assert.notEqual(inserted.nextElementSibling.nextElementSibling?.className,'unified-empty');
run(`{
 const state={directoryContents:{p:{items:[{id:'a'},{id:'b'},{id:'c'}],children:[{contentId:'new',contentIndex:1},{contentId:'next',contentIndex:2}]},new:{items:[],children:[]},next:{items:[],children:[]}}};
 adoptFollowingDirectoryItems(state,state.directoryContents.p,state.directoryContents.p.children[0]);
 if(JSON.stringify(state.directoryContents.new.items)!=='[{"id":"b"}]')throw Error('must stop at the next directory');
 if(JSON.stringify(state.directoryContents.p.items)!=='[{"id":"a"},{"id":"c"}]')throw Error('must preserve other items');
 const legacy={directoryContents:{p:{items:[{id:'suite'}],children:[{contentId:'111',contentIndex:0}]},'111':{items:[],children:[]}}};
 repairInsertedDirectoryOwnership(legacy);
 if(legacy.directoryContents.p.items.length||legacy.directoryContents['111'].items[0]?.id!=='suite')throw Error('legacy empty directory must own suite');
 repairInsertedDirectoryOwnership(legacy);
 if(legacy.directoryContents['111'].items.length!==1)throw Error('repair must not duplicate references');
}`);

assert.ok(items.indexOf(inserted)<items.indexOf(parent.querySelector('.unified-content-row')));
const contentRow=$('.unified-content-row'),contentGap=contentRow.nextElementSibling;
assert.equal(contentGap.querySelectorAll('.directory-insert-button').length,3);
assert.equal(contentGap.querySelector('[data-value=child]'),null);
contentGap.querySelector('[aria-label=新增第2级目录]').click();$('#inline-directory-name').value='插入在内容之后';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const after=[...w.document.querySelectorAll('[data-directory-row]')].find(row=>row.textContent.includes('插入在内容之后'));
assert.equal(after.dataset.directoryRow.split('/').length,2);
assert.equal(run("data.directoryContents[data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.name==='插入在内容之后').contentId].items.length"),2);
const sequence=[...after.parentElement.children];assert.ok(sequence.indexOf(after)>sequence.indexOf(after.parentElement.querySelector('.unified-content-row')));
run('render()');assert.ok([...w.document.querySelectorAll("[data-directory-row]")].some(row=>row.textContent.includes('插入在内容之后')));
const priorTitles=[...w.document.querySelectorAll('.chapter-resource-title')].map(el=>el.textContent);
$('.unified-content-row').nextElementSibling.querySelector('[aria-label=新增第1级目录]').click();
$('#inline-directory-name').value='新的一级目录';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const newRoot=[...w.document.querySelectorAll('[data-directory-row]')].find(row=>row.textContent.includes('新的一级目录'));
assert.equal(newRoot.dataset.directoryRow.includes('/'),false);
const rendered=[...newRoot.parentElement.children];
assert.equal(rendered.filter(el=>el.classList.contains('unified-content-row')&&rendered.indexOf(el)<rendered.indexOf(newRoot)).length,1,'new root starts at the clicked content boundary');
assert.deepEqual([...w.document.querySelectorAll('.chapter-resource-title')].map(el=>el.textContent),priorTitles,'splitting keeps all content in order');
assert.ok([...w.document.querySelectorAll('.directory-insert-options')].every(el=>el.children.length===3));
for(const stage of ['解析编写中','审核中','已定稿']){run(`commitWorkspace(d=>{d.books.find(b=>b.id===activeBook).workflow={stage:'${stage}',steps:['一审','二审','终审'],round:0,reviews:{},history:[]}});render()`);assert.ok($('[data-resource-action=edit]'),stage);assert.ok($('[data-resource-action=delete-row]'),stage)}
[...w.document.querySelectorAll('.unified-content-row')].find(row=>row.querySelector('.chapter-resource-icon.suites')).querySelector('[data-resource-action=edit]').click();assert.ok($('#listening-create'));w.confirm=()=>true;$('#lc-close').click();
console.log('PASS insertion before content and editable directory actions in all stages');
}finally{w.close()}
