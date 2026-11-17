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

try{
 run("page='vocabulary-standard';render()");
 assert.equal(run('data.standardVocabularyVersions.length'),2);
 assert.equal(run('data.standardVocabularyVersions.every(v=>v.words.length===10)'),true);
 assert.equal(run("vocabularyWord(data.standardVocabularyVersions[0].words[0].wordId.slice(6)).word"),'abandon');
 assert.ok(!$('#page').textContent.includes('非完整词表'));
 const delta=run("standardVocabularyComparison(data.standardVocabularyVersions[0],data.standardVocabularyVersions[1])");
 assert.equal(delta.filter(w=>w.status==='课标新增词').map(w=>w.word).join(','),'drone,wetland');
 assert.equal(run("standardVocabularyComparison(data.standardVocabularyVersions[1],null,data.standardVocabularyVersions[0]).filter(w=>w.status==='课标删减词').map(w=>w.word).join(',')"),'cheek,foggy');
 assert.equal(delta.filter(w=>w.status==='未变化').length,8);
 assert.equal(run("standardVocabularyComparison(data.standardVocabularyVersions[1],null).every(w=>w.status==='')"),true);
 run("data.standardVocabularyVersions[0].words.pop();ensureStandardVocabularyExamples()");
 assert.equal(run('data.standardVocabularyVersions[0].words.length'),9);
 assert.equal(run('data.standardVocabularyVersions.length'),2);
 assert.equal(run("data.standardVocabularyVersions.flatMap(v=>v.words).every(w=>!w.wordId||!!vocabularyWord(w.wordId.slice(6)))"),true);
 console.log('PASS two curriculum samples, 10 words each, valid links, no reseed after removal');
}finally{w.close()}
