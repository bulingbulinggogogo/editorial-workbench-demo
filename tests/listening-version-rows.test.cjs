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



w.URL.revokeObjectURL=()=>{};

(async()=>{try{
run("window.mid='213334';window.base=listeningVersionSource(mid,1);data.listeningRevisions ||= {};data.listeningRevisions[mid]={2:{material:{...structuredClone(base.material),text:'Second version transcript',segments:[{...base.material.segments[0],text:'Second version transcript'}]},questions:structuredClone(base.questions)},3:{material:{...structuredClone(base.material),text:'Latest version transcript',segments:[{...base.material.segments[0],text:'Latest version transcript'}]},questions:structuredClone(base.questions)}};page='listening-bank';bankMaterialId='';bankSearch=mid;renderListeningBank()");
await new Promise(r=>setTimeout(r,150));
assert.equal(w.document.querySelectorAll('#bank-list [data-history-version]').length,0);
const button=()=>$('#bank-list .bank-version-toggle');assert.ok(button());assert.equal(button().getAttribute('aria-expanded'),'false');button().click();await new Promise(r=>setTimeout(r,100));
const history=[...w.document.querySelectorAll('#bank-list [data-history-version]')];assert.equal(history.length,2);assert.deepEqual(history.map(r=>r.dataset.recordingVersion),['2','1']);assert.equal(history[0].querySelectorAll('td').length,$('#bank-list [data-recording-version="3"]').querySelectorAll('td').length);
assert.ok(history[0].textContent.includes('Second version transcript'));assert.ok(history[0].querySelector('.bank-version-badge').textContent==='V2');assert.equal(history[0].querySelector('.bank-version-badge.is-latest'),null);assert.ok(history[0].querySelector('[data-bank-delete]').disabled);
run('window.openListeningCreate=(batch,options)=>window.openedVersion=options.version');history[0].querySelector('[data-bank-view]').click();assert.equal(w.openedVersion,2);
button().click();await new Promise(r=>setTimeout(r,100));assert.equal(w.document.querySelectorAll('#bank-list [data-history-version]').length,0);assert.ok($('.bank-pagination-summary').textContent.includes('1 篇录音稿'));
console.log('PASS latest-only default, descending historical table rows, correct version actions, collapse and stable pagination');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
