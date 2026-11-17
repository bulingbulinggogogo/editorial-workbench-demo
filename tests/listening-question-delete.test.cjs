const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://test.invalid',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};const nativeStyle=w.getComputedStyle.bind(w);w.getComputedStyle=el=>nativeStyle(el);
w.HTMLMediaElement.prototype.pause=function(){};w.URL.revokeObjectURL=()=>{};w.scrollTo=()=>{};
const ctx=dom.getInternalVMContext();
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
for(const match of html.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='app-storage.js')vm.runInContext(fs.readFileSync(match[1],'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),$=s=>w.document.querySelector(s);
const closeWindow=w.close.bind(w);w.close=()=>{w.document.querySelectorAll('#listening-create').forEach(el=>el.dispatchEvent(new w.Event('close')));w.BookUI?.disposeSelects?.();closeWindow();};

(async()=>{try {
run(`var mid='STATE-DEMO-M-5';var sample=structuredClone(bankData().questions['STATE-DEMO-Q-5']);sample.options.forEach(o=>o.translation='测试选项');bankData().materials[mid].questionType='长对话';bankData().materials[mid].teachingNotes=[];delete bankData().questions[sample.id];for(let i=0;i<3;i++){const id='DELETE-TEST-'+i;bankData().questions[id]={...structuredClone(sample),id,number:i+1,questionType:'长对话'}}openListeningCreate(true,{materialId:mid,view:'content'})`);
await new Promise(r=>setTimeout(r,100));
assert.equal(w.document.querySelectorAll('[data-delete-question]').length,3);
assert.equal($('[data-delete-question]').closest('.lc-question-heading').lastElementChild,$('[data-delete-question]'));
$('[data-delete-question="1"]').click();assert.equal(w.document.querySelectorAll('[data-question]').length,2);
assert.ok([...w.document.querySelectorAll('[data-delete-question]')].every(b=>b.disabled));
assert.equal(run('bankQuestions(mid).length'),3);
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,250));assert.equal(run('bankQuestions(mid).length'),2,$('#lc-error').textContent);assert.equal(run("bankData().questions['DELETE-TEST-1']"),undefined);
$('[data-add-question]').click();$('[data-add-question]').click();assert.equal(w.document.querySelectorAll('[data-question]').length,4);assert.ok($('[data-add-question]').disabled);
w.confirm=()=>true;$('#lc-close').click();
run(`bankData().materials[mid].questionType='短对话';for(const q of bankQuestions(mid).slice(1))delete bankData().questions[q.id];bankQuestions(mid)[0].questionType='短对话';openListeningCreate(true,{materialId:mid,view:'content'})`);
await new Promise(r=>setTimeout(r,100));assert.ok($('[data-delete-question]').disabled);assert.ok($('[data-add-question]').disabled);
for(const [type,count,invalid] of [['短对话',1,false],['短对话',2,true],['长对话',1,true],['长对话',2,false],['独白',4,false],['独白',5,true]])assert.equal(!!run(`listeningQuestionCountError({questionType:'${type}',questions:Array(${count}).fill({})})`),invalid);
console.log('PASS question deletion draft/save, minimum/maximum counts and short-dialogue protection');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
