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
run("data.books.find(b=>b.id==='BK-SOURCE-686').workflow={...bookFlow(data.books.find(b=>b.id==='BK-SOURCE-686')),published:{at:new Date().toISOString(),withAnalysis:false}};generateSchoolBook('BK-SOURCE-686')");$('#school-search').value='杭州市第一中学';$('#school-search').dispatchEvent(new w.Event('input'));$('[data-school-add]').click();$('#generate-school-form').elements.name.value='恢复测试';$('#generate-school-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
run("globalThis.restoreId=data.books.find(b=>b.name==='恢复测试').id;globalThis.originalSource=JSON.stringify(data.books.find(b=>b.id==='BK-SOURCE-686'));globalThis.sourceContents=JSON.stringify((data.books.find(b=>b.id==='BK-SOURCE-686').directoryNodes).map(n=>data.directoryContents[n.contentId]));activeBook=restoreId;page='books';bookSection='目录与内容';render()");
assert.ok($('[data-restore-source]'));$('[data-restore-source]').click();assert.ok($('#school-restore-submit').disabled);assert.ok([...w.document.querySelectorAll('[data-restore-choice]')].every(b=>b.disabled));run('closeDialog()');
// Remove one leaf, recover only that leaf, then remove and recover a full directory.
run("commitWorkspace(d=>{const b=d.books.find(b=>b.id===restoreId);const n=b.directoryNodes.find(n=>d.directoryContents[n.contentId].items.length);globalThis.leafCid=n.contentId;globalThis.savedItems=JSON.stringify(d.directoryContents[n.contentId].items);d.directoryContents[n.contentId].items.pop()});restoreSchoolBookContents(restoreId)");
const available=[...w.document.querySelectorAll('.school-tree-leaf input')].filter(b=>!b.disabled);assert.equal(available.length,1);available[0].click();$('#school-restore-submit').click();assert.equal(run('JSON.stringify(data.directoryContents[leafCid].items)'),run('savedItems'));
run("commitWorkspace(d=>{const b=d.books.find(b=>b.id===restoreId);globalThis.removed=b.directoryRoots.shift();globalThis.remainingOrder=JSON.stringify(b.directoryRoots.map(e=>e.id))});restoreSchoolBookContents(restoreId)");
const missing=[...w.document.querySelectorAll('.school-tree-leaf input')].filter(b=>!b.disabled);assert.ok(missing.length);missing[0].click();$('#school-restore-submit').click();
assert.equal(run("JSON.stringify(data.books.find(b=>b.id===restoreId).directoryRoots.slice(0,-1).map(e=>e.id))"),run('remainingOrder'));
run('restoreSchoolBookContents(restoreId)');assert.ok([...w.document.querySelectorAll('.school-tree-leaf input')].some(b=>b.disabled));assert.equal(run("JSON.stringify(data.books.find(b=>b.id==='BK-SOURCE-686'))"),run('originalSource'));assert.equal(run("JSON.stringify(data.books.find(b=>b.id==='BK-SOURCE-686').directoryNodes.map(n=>data.directoryContents[n.contentId]))"),run('sourceContents'));
console.log('PASS restore entry, existing reference lock, unlink recovery, selective deleted-directory recovery, preserved order and unchanged source');
}finally{w.close()}
