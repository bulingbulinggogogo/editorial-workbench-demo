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
run("window.b=data.books.find(b=>b.id==='BK-STATE-DEMO-2');window.suite=bookAnalysisSuites(b)[0];window.mid=suite.materialIds[0];window.m=data.listeningBank.materials[mid];window.seg=m.segments[0];seg.text='one two three four five six seven eight nine ten eleven';m.text=seg.text;const cats=['重难点词汇','熟词生义','短语动词','动词短语','日常用语','常用搭配','构词法','人名读音','地名读音','单词读音','语音现象'];m.teachingNotes=[...seg.text.matchAll(/[A-Za-z]+/g)].map((w,i)=>({id:'NOTE-'+i,category:i<7?'词汇':'语音',subcategory:cats[i],sourceKey:'segment:'+seg.id,sourceText:seg.text,start:w.index,end:w.index+w[0].length,text:w[0],content:'说明',scope:'fragment'}));openWholeSuiteEditor({id:suite.id,bookReference:{bookId:b.id}})");
await new Promise(r=>setTimeout(r,150));$('[data-edit-view=cloze]').click();
const highlighted=[...w.document.querySelectorAll('.lc-cloze-word.is-note-highlight')].map(el=>el.textContent);
assert.deepEqual(highlighted,['one','two','three','four','six','seven','ten']);
const words=[...w.document.querySelectorAll('.lc-cloze-word')];words.find(el=>el.textContent==='five').click();
$('.lc-cloze-from-notes').click();await new Promise(r=>setTimeout(r,100));
assert.deepEqual([...w.document.querySelectorAll('.lc-cloze-line:first-of-type .lc-cloze-word.is-blank')].map(el=>el.textContent),['one','two','three','four','five','six','seven','ten']);
$('.lc-cloze-from-notes').click();assert.equal(w.document.querySelectorAll('.lc-cloze-line:first-of-type .lc-cloze-word.is-blank').length,8);
assert.equal($('[data-revision-save=suite]').disabled,false);
console.log('PASS category allowlist, yellow highlights, additive idempotent bulk cloze and dirty save');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
