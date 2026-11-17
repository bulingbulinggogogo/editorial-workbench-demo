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




(async()=>{try{w.URL.revokeObjectURL=()=>{};
run("var capturedNotes=[],originalNoteFields=analysisNoteFields;analysisNoteFields=(n,...args)=>{capturedNotes.push(n);return originalNoteFields(n,...args)};var mid=Object.keys(bankData().materials).find(id=>bankQuestions(id).length>1);openListeningCreate(true,{materialId:mid,view:'analysis'})");
await new Promise(r=>setTimeout(r,100));
for(const category of ['微技能','百科知识','话题词汇']){
 $('[data-group-note="'+category+'"]:not([data-question-id])').click();
 const modes=run('analysisModes['+JSON.stringify(category)+']');
 for(const mode of [...modes,...modes].reverse()){
  const radios=[...w.document.querySelectorAll('[data-field-name="an-content-mode"]')];
  radios.find(r=>r.value===mode).click();
  assert.equal(run('capturedNotes.at(-1).mode'),mode,category+' must persist selected mode');
  assert.equal(w.document.querySelectorAll('[data-field-name="an-content-mode"]:checked').length,1);
 }
}
$('[data-note-category-tab="微技能"]').click();
run("capturedNotes.at(-1).media={assetId:'old-video',type:'video/mp4'}");
w.document.querySelector('[data-field-name="an-content-mode"][value="图片"]').click();
assert.equal(run('capturedNotes.at(-1).media'),undefined);
assert.equal(w.document.querySelector('[data-analysis-media="media"]').accept,'image/*');
$('[data-edit-view="content"]').click();$('[data-edit-view="analysis"]').click();
assert.equal(w.document.querySelector('[data-field-name="an-content-mode"]:checked').value,'图片');
for(const category of ['语法','实用表达']){
 run('capturedNotes.at(-1).category='+JSON.stringify(category));
 $('[data-edit-view="content"]').click();$('[data-edit-view="analysis"]').click();
 if(category==='语法'){
  run("capturedNotes.at(-1).subcategory='虚拟语气'");
  $('[data-edit-view="content"]').click();$('[data-edit-view="analysis"]').click();
  assert.equal(w.document.querySelector('[data-note-category-picker]').dataset.categoryLabel,'语法 · 虚拟语气');
  w.document.querySelector('[data-field-name="an-content-mode"][value="引用长难句互动教学"]').click();
  assert.equal(run('capturedNotes.at(-1).mode'),'引用长难句互动教学');
  w.document.querySelector('[data-field-name="an-content-mode"][value="富文本"]').click();
  assert.equal(run('capturedNotes.at(-1).mode'),'富文本');
 }else{
  for(const value of ['yes','no']){
   w.document.querySelector('[data-field-name="an-vocabulary-link"][value="'+value+'"]').click();
   assert.equal(run('capturedNotes.at(-1).linkVocabulary'),value==='yes');
  }
 }
}
console.log('PASS all analysis mode switches, vocabulary linking, media exclusivity and navigation persistence');
}finally{w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
