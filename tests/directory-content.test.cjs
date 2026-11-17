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
assert.equal(w.document.querySelector('[data-page="resource-packages"]'),null);
assert.equal(run('data.directoryContentVersion'),1);
assert.equal(run('Object.keys(resourceStore().packages).length'),0);
assert.equal(run('data.books.filter(b=>b.sharedResources).every(b=>b.directoryNodes.every(n=>n.kind==="目录"&&!n.packageId))'),true);
run("resourceTrail=[];page='books';bookType='听力书籍';activeBook='BK-SOURCE-686';bookSection='目录与内容';selectedDirectory='';render()");
assert.ok($('#page').textContent.includes('训练 1'));assert.ok($('#page').textContent.includes('词汇表'));assert.ok(!$('#page').textContent.includes('资源包'));
const cid=run('data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.id===selectedDirectory).contentId');
assert.equal(run('data.books.find(b=>b.id==="BK-SCHOOL-686").directoryNodes.some(n=>n.contentId==="'+cid+'")'),true);
$('[data-resource-action=new-directory][data-value="child"]').click();$('#inline-directory-name').value='新下级目录';$('#inline-directory-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.books.find(b=>b.id==="BK-SCHOOL-686").directoryNodes.some(n=>n.name==="新下级目录")'),true);
run('commitWorkspace(d=>{d.testCopy=cloneDirectoryContent(d,"'+cid+'");d.directoryContents[d.testCopy].items.pop()})');assert.equal(run('data.directoryContents["'+cid+'"].items.length'),3);assert.equal(run('data.directoryContents[data.testCopy].items.length'),2);
assert.equal(run('resourceReferenceRows("suites","14136").length'),2);
assert.equal(run('bankReferenceIndex()[listening686Example.questions[0].id].some(u=>u.bookId==="BK-SCHOOL-686")'),true);
run('selectedDirectory=data.books.find(b=>b.id===activeBook).directoryNodes.find(n=>n.contentId==="'+cid+'").id;render()');const lib=run('JSON.stringify(resourceStore())');$('[data-resource-action=delete]').click();$('#directory-remove-confirm').click();assert.equal(run('JSON.stringify(resourceStore())'),lib);assert.equal(run('data.books.find(b=>b.id==="BK-SCHOOL-686").directoryNodes.some(n=>n.contentId==="'+cid+'")'),true);
const snapshot=run('JSON.stringify(data)');run('commitWorkspace(migrateDirectoryContent)');assert.equal(run('JSON.stringify(data)'),snapshot);
run("resourceTrail=[];page='resource-suites';render()");assert.ok(!$('#page').textContent.includes('资源包'));assert.ok($('.bank-reference-button').textContent.includes('本书'));
console.log('PASS directory migration, direct content, subtree sharing, independent copies, deletion isolation, reference index and idempotence');
}finally{w.close()}
