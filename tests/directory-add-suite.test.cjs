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


(async()=>{try{
let picker;w.BookUI.renderDirectoryMultiSelect=(host,props)=>{picker=props};
run("data.directoryContents ||= {};data.directoryContents['test-add']={items:[]};var capturedCreate=null;var realCreate=openListeningCreate;openListeningCreate=(batch,editing,context)=>{capturedCreate={batch,editing,context}};openDirectoryAdd('test-add')");
assert.equal(w.document.querySelectorAll('.directory-add-card').length,3);assert.equal(w.document.querySelectorAll('[data-directory-reference]').length,3);assert.equal(w.document.querySelectorAll('[data-directory-create]').length,3);$('[data-directory-reference="suites"]').click();
assert.equal($('#directory-add-results'),null);const existing=picker.options[0].value;picker.onChange([existing]);$('#directory-add-confirm').click();assert.equal(run('data.directoryContents["test-add"].items[0].id'),existing);
run("openDirectoryAdd('test-add')");$('[data-directory-reference="suites"]').click();assert.ok(!picker.options.some(o=>o.value===existing));
assert.ok($('.directory-add-cards'));assert.equal(w.document.querySelectorAll('.directory-mode-switch').length,3);assert.equal($('[data-directory-reference="suites"]').type,'radio');const sameDialog=$('#dialog');$('[data-directory-create="suites"]').click();assert.equal($('#dialog'),sameDialog);assert.equal($('[data-directory-create="suites"]').checked,true);assert.equal($('[data-directory-reference="suites"]').checked,false);assert.ok($('.directory-add-cards'));$('#directory-add-confirm').click();assert.equal($('#directory-add-error').textContent,'请输入名称');$('#directory-add-name').value='批量新套题';$('#directory-add-name').dispatchEvent(new w.Event('input'));$('#directory-add-confirm').click();assert.equal(run('capturedCreate.batch'),true);assert.equal(run('capturedCreate.editing'),null);assert.equal(run('data.directoryContents["test-add"].items.length'),1);
run('var mids=Object.keys(bankData().materials).slice(0,2);capturedCreate.context.onSaved(mids)');assert.equal(run('data.directoryContents["test-add"].items.length'),2);assert.equal(run('resourceCollection("suites")[data.directoryContents["test-add"].items[1].id].name'),'批量新套题');assert.equal(run('resourceCollection("suites")[data.directoryContents["test-add"].items[1].id].materialIds.join(",")'),run('mids.join(",")'));run('capturedCreate.context.onSaved(mids)');assert.equal(run('data.directoryContents["test-add"].items.length'),2);
run("openDirectoryAdd('test-add',1)");$('[data-directory-reference="wordlists"]').click();const inserted=picker.options[0].value;picker.onChange([inserted]);$('#directory-add-confirm').click();assert.equal(run('data.directoryContents["test-add"].items[1].id'),inserted);assert.equal(run('data.directoryContents["test-add"].items[1].kind'),'wordlists');assert.equal(run('data.directoryContents["test-add"].items[0].id'),existing);
run('openListeningCreate=realCreate;openListeningCreate(true,null,{onSaved:()=>{}})');assert.ok($('#lc-batch-folder'));assert.ok($('#lc-batch-raw'));
console.log('PASS existing suite selection, duplicate prevention, deferred suite creation, batch callback grouping, batch entry');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
