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
run("page='material-center';renderMaterialCenter()");
assert.ok(w.document.body.textContent.includes('zd_record'));
assert.ok($('#material-center-type').textContent.includes('基础词库音频'));
run('sidebarBrandButton.click()');
assert.ok(!w.document.querySelector('#sidebar [data-page="material-center"]').classList.contains('brand-hidden'));
assert.ok(run('vocabularyAudioLibrary().length')>5);
run("var pickedAudio=null;openVocabularyAudioLibrary(a=>pickedAudio=a)");
$('#vocabulary-audio-search').value='UK_record-v';$('#vocabulary-audio-search').dispatchEvent(new w.Event('input'));
assert.ok($('#vocabulary-audio-results').textContent.includes('UK_record-v'));
$('[data-vocab-audio-pick]').click();assert.ok(run('pickedAudio.name').includes('UK_record-v'));
run("var testAudioFiles=new Map();audioFileStore=async(id,file)=>{if(file)testAudioFiles.set(id,file);return testAudioFiles.get(id)}");
w.testFile=new w.File(['aac-bytes'],'test-new.aac',{type:'audio/aac'});
await run("storeVocabularyAudio(window.testFile)");
assert.ok(run("vocabularyAudioLibrary().some(a=>a.name==='test-new.aac'&&a.assetId)"));
assert.equal(await run("vocabularyAudioBlob(vocabularyAudioLibrary().find(a=>a.name==='test-new.aac'))"),w.testFile);
await assert.rejects(run("storeVocabularyAudio(window.testFile)"),/同名/);
w.badFile=new w.File(['bad'],'bad.mp3',{type:'audio/mpeg'});
await assert.rejects(run("storeVocabularyAudio(window.badFile)"),/AAC/);
run("renderMaterialCenter();materialCenterCategory='基础词库音频';materialCenterQuery='test-new';renderMaterialCenterRows()");
assert.ok($('#material-center-results').textContent.includes('test-new.aac'));
run("var testEntry=catalogEntries().find(e=>e.id==='90001');openCatalogEditor(testEntry)");
const frame=$('.vocabulary-editor-frame'),messages=[];frame.contentWindow.postMessage=msg=>messages.push(msg);
w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:audio-select',entryId:'90001',requestId:'test-request'}}));
assert.ok($('#vocabulary-audio-search'));
$('#vocabulary-audio-search').value='test-new';$('#vocabulary-audio-search').dispatchEvent(new w.Event('input'));$('[data-vocab-audio-pick]').click();
assert.equal(messages.at(-1).type,'vocabulary:audio-selected');assert.equal(messages.at(-1).requestId,'test-request');assert.equal(messages.at(-1).item.name,'test-new.aac');
assert.equal(run("catalogModel(testEntry).positions.some(p=>p.E==='test-new.aac')"),false);
console.log('PASS material filename search, selection bridge, audio storage/retrieval, duplicate/type checks, source unchanged until save and persistent navigation');
}finally{await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
