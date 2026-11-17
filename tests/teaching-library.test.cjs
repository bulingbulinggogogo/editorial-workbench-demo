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
assert.equal(run('Object.keys(resourceStore().suites).length'),1);
assert.equal(run('resourceStore().suites["14136"].materialIds.length'),10);
assert.equal(run('listening686Example.questions.length'),20);
assert.equal(run('resourceStore().wordlists["1"].wordIds.length'),12);
assert.equal(run('resourceUses("packages","1").length'),2);
const count=run('data.books.length');run('ensureTeachingExample()');assert.equal(run('data.books.length'),count);
run("page='resource-packages';render()");assert.ok($('#page').textContent.includes('高一英语听力专项训练 1'));
run("resourceOpen('packages','1')");assert.ok($('#page').textContent.includes('难点词汇'));
run("resourceOpen('suites','14136')");assert.ok($('#page').textContent.includes('What will Joe do on Saturday?'));
run("resourceTrail=[];bookType='听力书籍';activeBook='BK-SOURCE-686';page='books';bookSection='目录与内容';selectedDirectory=data.books.find(b=>b.id==='BK-SOURCE-686').directoryNodes.find(n=>n.sourceId==='DIR-686-PRACTICE').id;render()");assert.ok($('#page').textContent.includes('新建资源包'));
$('[data-resource-action="create-package"]').click();$('#resource-form input[name="name"]').value='流转测试包';$('#resource-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(run('resourceTrail.at(-1).kind'),'packages');
const pid=run('resourceTrail.at(-1).id');assert.ok(run('data.books.find(b=>b.id==="BK-SOURCE-686").directoryNodes.some(n=>n.packageId==="'+pid+'")'));
$('#resource-new-kind').value='suites';$('[data-resource-action="new"]').click();$('#resource-form input[name="name"]').value='流转测试套题';$('#resource-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const sid=run('resourceTrail.at(-1).id');assert.equal(run('resourceStore().packages["'+pid+'"].items[0].id'),sid);
$('[data-resource-action="pick"]').click();const choice=w.document.querySelector('#resource-picker input[name="choice"]');choice.checked=true;$('#resource-picker').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('resourceStore().suites["'+sid+'"].materialIds.length'),1);
run('resourceDelete("packages","1")');assert.ok($('#dialog').textContent.includes('请先解除'));run('closeDialog()');
run("resourceTrail=[];page='resource-suites';resourceTab='papers';render()");assert.ok($('#page').textContent.includes('2023'));
run("resourceOpen('papers','14449')");assert.equal(w.document.querySelectorAll('#resource-content .tab[disabled]').length,5);
run("resourceTrail=[];page='listening-bank';render()");assert.equal(run('bankData().materials[listening686Example.materials[0].id].builtinAudio'),false);
assert.ok(run('bankReferenceIndex()[listening686Example.questions[0].id].some(u=>u.bookId==="BK-SCHOOL-686")'));
assert.equal(run('listening686Example.questions.every(q=>q.answerKey&&q.options.length===3)'),true);
const roundtrip=run('parseAppData(packAppData(serializeAppData(data)))');
assert.equal(roundtrip.teachingLibrary.exampleVersion,1);assert.equal(roundtrip.teachingLibrary.packages['1'].items.length,3);assert.equal(roundtrip.books.find(b=>b.id==='BK-SCHOOL-686').directoryNodes[1].packageId,'1');
console.log('Shared resource flow: PASS (seed, bank, packages, suites, books, schoolbook, exam, creation, selection, deletion protection)');
} finally {w.close()}
