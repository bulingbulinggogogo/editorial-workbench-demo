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
run(`commitWorkspace(d=>{const b=d.books.find(b=>b.id==='REVIEW-DEMO-3');const original=b.directoryNodes.find(n=>d.directoryContents[n.contentId].items.length);const items=structuredClone(d.directoryContents[original.contentId].items);for(const id of ['drag-a','drag-b','drag-c'])d.directoryContents[id]={id,items:id==='drag-c'?items:[],children:[]};b.directoryRoots=['drag-a','drag-b','drag-c'].map(id=>({id,name:id,contentId:id}));});resourceTrail=[];page='books';bookType='听力书籍';activeBook='REVIEW-DEMO-3';bookSection='目录与内容';selectedDirectory='';render()`);
function drag(source,target,after=false){
 const transfer={setData(){},effectAllowed:'',dropEffect:''};
 for(const [el,type] of [[source.querySelector('.directory-sort-handle'),'dragstart'],[target,'dragover'],[target,'drop']]){const event=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:transfer});Object.defineProperty(event,'clientY',{value:after?20:-1});el.dispatchEvent(event)}
}
drag($('.unified-content-row'),$('[data-empty-owner="drag-a"]'));
assert.equal(run("data.directoryContents['drag-a'].items.length"),1);
assert.equal(run("data.directoryContents['drag-c'].items.length"),0);
assert.equal($('.unified-content-row').dataset.itemOwner,'drag-a');
assert.equal($('[data-empty-owner="drag-a"]'),null);
drag($('.unified-content-row'),$('[data-directory-row="drag-b"]'));
assert.equal(run("data.directoryContents['drag-b'].items.length"),1);
assert.equal(run("data.directoryContents['drag-a'].items.length"),0);
run('render()');assert.equal($('.unified-content-row').dataset.itemOwner,'drag-b');
run(`commitWorkspace(d=>{d.directoryContents['drag-a'].items.push({kind:'suites',id:'another'});});render()`);
drag($('[data-item-owner="drag-b"]'),$('[data-item-owner="drag-a"]'),true);
assert.deepEqual(Array.from(run("data.directoryContents['drag-a'].items.map(i=>i.id)")),['another',run("Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='REVIEW-DEMO-3-S').id")]);
assert.equal(run("data.directoryContents['drag-b'].items.length"),0);
drag([...w.document.querySelectorAll('[data-item-owner="drag-a"]')][1],$('[data-item-owner="drag-a"]'));
assert.deepEqual(Array.from(run("data.directoryContents['drag-a'].items.map(i=>i.id)")),[run("Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='REVIEW-DEMO-3-S').id"),'another']);
console.log('PASS cross-directory content drag to empty area, heading, content order, and persisted ownership');
}finally{w.close()}
