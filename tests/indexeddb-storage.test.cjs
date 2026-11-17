const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const html=fs.readFileSync('index.html','utf8');
class LocalScripts extends ResourceLoader{fetch(url){return Promise.resolve(fs.readFileSync(path.join(process.cwd(),new URL(url).pathname)))}}
const indexedDB=new IDBFactory();let failWrites=false;
const open=indexedDB.open.bind(indexedDB);
indexedDB.open=(...args)=>{const request=open(...args);request.addEventListener('success',()=>{const db=request.result,transaction=db.transaction.bind(db);db.transaction=(...args)=>{const tx=transaction(...args);if(args[1]==='readwrite'&&failWrites)queueMicrotask(()=>tx.abort());return tx}});return request};
const legacy=JSON.stringify({books:[],school:[],listening:[],members:[],departments:[],customSentinel:'保留旧数据'});
function launch(legacyText=legacy){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://fixture.invalid/index.html',resources:new LocalScripts(),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
 w.indexedDB=indexedDB;w.structuredClone=structuredClone;
 const computedStyle=w.getComputedStyle.bind(w);w.getComputedStyle=el=>computedStyle(el);
 w.localStorage.setItem('zhixu-prototype-v1',legacyText);
 w.Storage.prototype.setItem=function(){throw new w.DOMException('quota','QuotaExceededError')};
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
 w.HTMLMediaElement.prototype.pause=function(){};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 }});return {dom,w:dom.window,errors};
}
async function until(fn){for(let i=0;i<500;i++){if(fn())return;await new Promise(r=>setTimeout(r,10))}throw Error('Timed out')}
(async()=>{
 const a=launch();await until(()=>!a.w.document.getElementById('app-bootstrap'));
 assert.deepEqual(a.errors,[]);assert.equal(a.w.eval('data.customSentinel'),'保留旧数据');
 const initialQuestionCount=a.w.eval('Object.keys(bankData().questions).length');assert.ok(initialQuestionCount>0);
 assert.equal(a.w.localStorage.getItem('zhixu-prototype-v1'),legacy);
 a.w.eval("commitWorkspace(d=>{d.customSentinel='IndexedDB 修改'})");await a.w.AppStorage.flush();
 assert.equal(a.w.AppStorage.pending,false);
 const auditAt=a.w.eval('EditorConsistency.records[JSON.stringify(["customSentinel"])].at');assert.ok(auditAt);
 const b=launch();await until(()=>!b.w.document.getElementById('app-bootstrap'));
 assert.equal(b.w.eval('data.customSentinel'),'IndexedDB 修改');
 assert.equal(b.w.eval('EditorConsistency.records[JSON.stringify(["customSentinel"])].at'),auditAt);
 assert.equal(b.w.eval('Object.keys(bankData().questions).length'),initialQuestionCount);
 failWrites=true;b.w.eval("commitWorkspace(d=>{d.customSentinel='失败后重试'})");
 await assert.rejects(b.w.AppStorage.flush());
 assert.equal(b.w.eval('EditorConsistency.records[JSON.stringify(["customSentinel"])].at'),auditAt);
 assert.equal(b.w.AppStorage.pending,true);
 assert.ok(b.w.document.body.textContent.includes('保存失败，修改尚未保存'));
 const event=new b.w.Event('beforeunload',{cancelable:true});b.w.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
 failWrites=false;
 [...b.w.document.querySelectorAll('[role=status] button')].find(el=>el.textContent==='重试').click();await b.w.AppStorage.flush();
 assert.equal(b.w.AppStorage.pending,false);
 const c=launch();await until(()=>!c.w.document.getElementById('app-bootstrap'));
 assert.equal(c.w.eval('data.customSentinel'),'失败后重试');
 // Queued writes retain the newest snapshot in order.
 c.w.eval("commitWorkspace(d=>{d.sequence=1});commitWorkspace(d=>{d.sequence=2})");await c.w.AppStorage.flush();
 const d=launch();await until(()=>!d.w.document.getElementById('app-bootstrap'));assert.equal(d.w.eval('data.sequence'),2);
 for(const fixture of [a,b,c,d]){await fixture.w.AppStorage.flush();fixture.w.BookUI?.disposeSelects?.();fixture.w.BookUI?.disposeTable?.();fixture.w.BookUI?.closeDialog?.();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(fixture.errors,[]);fixture.dom.window.close()}
 console.log('PASS: full bootstrap, quota-exhausted legacy migration, IndexedDB reload, failed writes/retry, unload guard, ordered saves');
})().catch(error=>{console.error(error);process.exitCode=1});
