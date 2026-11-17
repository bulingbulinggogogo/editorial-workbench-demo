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
const tick=()=>new Promise(r=>setTimeout(r,20));
for(const key of ['sentences','knowledge','semantic-network'])assert.equal($('[data-page="interactive-'+key+'"]').disabled,false);
$('[data-page="interactive-sentences"]').click();assert.ok($('#page').textContent.includes('最后操作时间'));assert.ok($('[data-it-edit="LS001"]'));$('[data-it-edit="LS001"]').click();
const words=[...w.document.querySelectorAll('[data-it-word]')];words[0].dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0}));words[1].dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true,buttons:1}));words[1].dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true}));$('#it-note').value='测试备注';$('#it-apply-mark').click();assert.ok($('.it-mark-list').textContent.includes('测试备注'));$('#it-arrow').click();$('[data-it-word="4"]').dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0}));await tick();assert.ok($('.it-arrows path[marker-end]'));$('#it-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run("data.interactiveTeaching.LS001.marks.at(-1).note"),'测试备注');
$('[data-it-view="LS001"]').click();assert.ok($('#it-sentence').disabled);assert.equal($('#it-apply-mark'),null);run('closeDialog()');
$('[data-page="interactive-knowledge"]').click();assert.ok($('[data-it-preview="BK001"]'));assert.ok($('#page').textContent.includes('引用')); // Two-step editor coverage: knowledge-editor.test.cjs
$('[data-page="interactive-semantic-network"]').click();$('[data-it-edit="SN001"]').click();assert.equal(w.document.querySelectorAll('.it-branch').length,4);$('#it-add-node').click();assert.equal(w.document.querySelectorAll('.it-branch').length,5);$('#it-node-meaning').value='演示衍生义';$('#it-node-meaning').dispatchEvent(new w.Event('change'));$('#it-node-image').click();assert.ok($('.it-node-thumbnail'));$('#it-node-prev').click();assert.equal(w.document.querySelectorAll('.it-network-node')[3].textContent.includes('演示衍生义'),true);$('#it-undo').click();assert.equal(w.document.querySelectorAll('.it-network-node')[4].textContent.includes('演示衍生义'),true);$('#it-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.interactiveTeaching.SN001.nodes.length'),5);$('[data-it-view="SN001"]').click();assert.equal($('#it-add-node'),null);assert.ok($('#it-node-meaning').disabled);run('closeDialog()');
$('#interactive-new').click();$('#it-form').elements.title.value='删除测试';$('#it-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));const newid=run("Object.values(data.interactiveTeaching).find(x=>x.title==='删除测试').id");$('[data-it-delete="'+newid+'"]').click();$('#it-delete-confirm').click();assert.equal(run("data.interactiveTeaching['"+newid+"']"),undefined);
console.log('PASS all three nav entries, shared table, sentence drag/arrow/save/readonly, knowledge preview entry and reference column, automatic semantic nodes/order/images/undo/save/delete');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
