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
run("var capturedNotes=[],originalNoteFields=analysisNoteFields;analysisNoteFields=(n,...args)=>{capturedNotes.push(n);return originalNoteFields(n,...args)};var mid=Object.keys(bankData().materials).find(id=>bankQuestions(id).length>1);openListeningCreate(true,{materialId:mid,view:'analysis'})");await new Promise(r=>setTimeout(r,100));
const button=$('[data-group-note="微技能"]:not([data-question-id])');assert.ok(button);button.click();assert.equal(run('capturedNotes.at(-1).category'),'微技能');assert.equal(run('capturedNotes.at(-1).scope'),'material');assert.equal(run('capturedNotes.at(-1).sourceKey'),'material');assert.equal(run('capturedNotes.at(-1).targetQuestionId'),'');
$('[data-group-note="微技能"][data-question-id]').click();assert.equal(run('capturedNotes.at(-1).scope'),'question');assert.ok(run('capturedNotes.at(-1).targetQuestionId'));
$('[data-edit-view="content"]').click();$('[data-edit-view="analysis"]').click();assert.ok(run("capturedNotes.some(n=>n.category==='微技能'&&n.scope==='material')"));assert.equal(run("validateAnalysisNote({...capturedNotes.find(n=>n.scope==='material'),title:'微技能',content:'讲解',mode:'视频',media:{assetId:'test',type:'video/mp4'}})"),'');
console.log('PASS transcript-level micro-skill reuses card and material scope; question-level scope retained');
}finally{w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
