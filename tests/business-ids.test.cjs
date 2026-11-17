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
assert.equal(run('data.businessIdVersion'),1);
for(const kind of ['packages','suites','wordlists','practices','papers'])assert.equal(run('Object.keys(resourceCollection("'+kind+'")).every(id=>/^\\d+$/.test(id))'),true);
assert.equal(run('data.books.every(b=>/^\\d+$/.test(b.bookId))'),true);
assert.equal(run('data.editorial.words.every(w=>/^\\d+$/.test(w.wordId))'),true);
assert.equal(run('Object.keys(bankData().questions).every(id=>/^\\d+$/.test(id))'),true);
const before=run('JSON.stringify(data)');run('migrateBusinessIds(data)');assert.equal(run('JSON.stringify(data)'),before);
run('commitWorkspace(d=>{const id=nextBusinessId("packages",d);d.teachingLibrary.packages[id]={id,name:"new",items:[]};d.testDeletedId=id;delete d.teachingLibrary.packages[id]})');
assert.ok(Number(run('nextBusinessId("packages")'))>Number(run('data.testDeletedId')));
const snapshot=run('parseAppData(packAppData(serializeAppData(data)))');assert.ok(snapshot.businessIdSequences.packages);
assert.equal(run('resourceUses("packages",Object.values(resourceStore().packages).find(p=>p.sourceId==="RP-686-1").id).length'),2);
run("resourceTrail=[];page='resource-packages';render()");assert.ok($('#page').textContent.includes('资源包 ID'));assert.ok(!$('#page').textContent.includes('RP-686-1'));
// Exercise migration of old references, drafts and independent counters in isolation.
run(`const fixture=structuredClone(data);delete fixture.businessIdVersion;fixture.teachingLibrary.packages['RP-OLD']={id:'RP-OLD',name:'migrate',items:[{kind:'suites',id:'ST-OLD'}]};fixture.teachingLibrary.suites['ST-OLD']={id:'ST-OLD',name:'suite',materialIds:[]};fixture.books[0].directoryNodes.push({id:'DIR-OLD',kind:'资源包',parentId:'',packageId:'RP-OLD'});fixture.listeningBank.questions['Q-OLD']={id:'Q-OLD',scriptId:'123'};fixture.listeningBatchDraft={records:[{questions:[{id:'Q-OLD'}]}]};migrateBusinessIds(fixture)`);
assert.equal(run('fixture.listeningBatchDraft.records[0].questions[0].id'),run('Object.values(fixture.listeningBank.questions).find(q=>q.sourceId==="Q-OLD").id'));
assert.equal(run('fixture.books[0].directoryNodes.find(n=>n.sourceId==="DIR-OLD").packageId'),run('Object.values(fixture.teachingLibrary.packages).find(p=>p.sourceId==="RP-OLD").id'));
console.log('PASS numeric business IDs, idempotent migration, reference/draft remapping, durable counters, no reuse, typed labels');
} finally {w.close()}
