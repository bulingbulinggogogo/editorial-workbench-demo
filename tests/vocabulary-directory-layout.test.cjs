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
 run("page='vocabulary-listening';render()");$('#scene-add-parent').click();const f=$('#resource-form');f.elements.name.value='布局测试';f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(resolve=>setTimeout(resolve,30));
 assert.ok($('#scene-save').closest('.page-head'));assert.equal($('.editor-page-footer'),null);assert.equal(w.document.querySelectorAll('.scene-operation-footer').length,1);assert.equal($('[data-scene-depth]'),null);assert.equal($('#scene-back').nextElementSibling,$('#page h1'));
 $('[data-scene-add-heading]').click();const form=$('.scene-heading-editor');form.querySelector('input').value='二级';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const child=run('data.listeningVocabularyScenes[0].children[0].id');$(`[data-scene-toggle="${child}"]`).click();assert.equal($(`[data-scene-toggle="${child}"]`).getAttribute('aria-expanded'),'false');
 $('#scene-back').click();$('[data-scene-open]').click();await new Promise(resolve=>setTimeout(resolve,30));assert.equal($(`[data-scene-toggle="${child}"]`).getAttribute('aria-expanded'),'true');assert.ok($('#scene-save').closest('.page-head'));assert.equal($('.editor-page-footer'),null);
 console.log('PASS async footer keeps save in header, single metadata footer, defaults expanded on entry');
}finally{w.close()}})().catch(error=>{console.error(error);process.exitCode=1});
