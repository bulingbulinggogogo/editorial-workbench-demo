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

(async()=>{try {
run("var testMid=Object.keys(bankData().materials).find(id=>bankQuestions(id).length>1);openListeningCreate(true,{materialId:testMid,view:'analysis'})");
await new Promise(resolve=>setTimeout(resolve,100));
const total=run('bankQuestions(testMid).length');assert.equal(w.document.querySelectorAll('[data-group-note="微技能"]').length,total);
run('audioFileStore=async()=>true');
for(const category of ['百科知识','话题词汇','微技能']){
 const buttons=w.document.querySelectorAll('[data-group-note="'+category+'"]');buttons[buttons.length-1].click();
 assert.ok($('#an-category-cascade').textContent.includes(category));
 if(category==='微技能')assert.equal($('#lc-note-target').value,run('bankQuestions(testMid).at(-1).id'));
 $('#an-title').value=category+'测试标题';$('#an-rich')._teachingQuill.setText(category+'测试讲解');
 assert.equal($('#an-mode').type,'hidden');assert.ok($('[role="radiogroup"]'));assert.ok($('#an-title').closest('.lc-note-inline'));assert.ok($('.ql-toolbar .teaching-rich-label'));assert.equal($('.lc-note-form').textContent.includes('尚未上传'),false);
 if(category==='百科知识'){assert.equal($('.teaching-rich-label').textContent,'百科知识内容');const image=$('[name="an-content-mode"][value="图片"]');image.checked=true;image.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal($('#an-mode').value,'图片');assert.equal($('#an-title').value,category+'测试标题');assert.equal($('#an-rich')._teachingQuill.getText().trim(),category+'测试讲解');const video=$('[name="an-content-mode"][value="视频"]');video.checked=true;video.dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok($('[data-upload-button] .ant-btn'));}

 if(category!=='话题词汇'){const input=$('[data-analysis-media="media"]');Object.defineProperty(input,'files',{value:[new w.File(['video'],'sample.mp4',{type:'video/mp4'})]});await input.onchange();}
 $('#lc-save-note').click();
 assert.equal($('#an-rich'),null);assert.ok($('.lc-note-list').textContent.includes(category+'测试讲解')||$('.lc-note-list').textContent.includes(category));
}
assert.equal(w.document.querySelectorAll('[data-open-note]').length,3);
w.document.querySelectorAll('[data-open-note]')[1].click();assert.equal($('#an-rich')._teachingQuill.getText().trim(),'话题词汇测试讲解');assert.equal($('#lc-reposition-note'),null);
console.log('PASS transcript actions, every-question micro-skill, correct target, save and reopen notes');
} finally {w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(resolve=>setTimeout(resolve,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1})
