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
 run("page='vocabulary-textbook';render()");
 assert.equal([...w.document.querySelectorAll('[data-listening-vocab-tab]')].map(b=>b.textContent).join(','),'人教版,外研版,北师大版,译林版');
 assert.equal(w.document.querySelectorAll('[data-scene-open]').length,7);assert.ok($('#page').textContent.includes('人教版选择性必修四'));assert.ok($('.page-title-row .tabs'));assert.equal($('#scene-add-parent').textContent,'新建册别');
 const first=$('[data-scene-open]').dataset.sceneOpen;
 $('[data-scene-open]').click();assert.ok($('.scene-directory-editor'));assert.ok($('#scene-save'));
 $('[data-scene-add-heading]').click();let form=$('.scene-heading-editor');form.querySelector('input').value='Unit 1';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const child=run(`data.listeningVocabularyScenes.find(p=>p.id==='${first}').children[0].id`);
 $(`[data-scene-meanings="${child}"]`).click();const mid=run("Object.keys(vocabularyTable('meanings'))[0]");const input=$('.scene-word-editor input');input.value=mid;input.dispatchEvent(new w.Event('input',{bubbles:true}));$(`[data-select-meaning="${mid}"]`).click();
 assert.equal(run(`resourceCollection('wordlists')[data.listeningVocabularyScenes.find(p=>p.id==='${first}').children[0].wordlistId].listeningCategory`),'textbook-pep');
 $('#scene-back').click();$('[data-listening-vocab-tab="textbook-fltrp"]').click();assert.equal(w.document.querySelectorAll('[data-scene-open]').length,0);
 $('#scene-add-parent').click();form=$('#resource-form');form.elements.name.value='外研版必修一';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal($('.scene-task-name-input').value,'外研版必修一');
 run("page='vocabulary-product';render()");assert.equal($('.scene-directory-editor'),null);
 assert.equal([...w.document.querySelectorAll('[data-listening-vocab-tab]')].map(b=>b.textContent).join(','),'维词,词汇笔记,词汇大纲,新方略口袋本');assert.equal(w.document.querySelectorAll('[data-scene-open]').length,2);
 const productIds=new Set();for(const tab of ['product-weici','product-notes','product-outline','product-pocket']){$(`[data-listening-vocab-tab="${tab}"]`).click();assert.equal(w.document.querySelectorAll('[data-scene-open]').length,2);for(const row of w.document.querySelectorAll('tbody tr'))productIds.add(row.cells[0].textContent)}assert.equal(productIds.size,8);
 $('[data-listening-vocab-tab="product-notes"]').click();assert.ok($('#page').textContent.includes('人教2026版'));assert.ok($('#page').textContent.includes('外研2026版'));assert.equal($('#scene-add-parent').textContent,'新建版本');
 const count=run('data.listeningVocabularyScenes.length');run('renderListeningVocabulary()');assert.equal(run('data.listeningVocabularyScenes.length'),count);
 run("page='vocabulary-listening';render()");assert.equal(w.document.querySelectorAll('[data-scene-open]').length,0);
 run("page='vocabulary-textbook';render()");assert.ok($('#page').textContent.includes('外研版必修一'));$('[data-listening-vocab-tab="textbook-pep"]').click();$(`[data-scene-open="${first}"]`).click();assert.ok($('#page').textContent.includes('Unit 1'));assert.equal(w.document.querySelectorAll('[data-scene-word]').length,1);
 console.log('PASS textbook and product tabs, seeded editions, unique IDs, inline headings and meanings, creation, idempotence and module isolation');
}finally{w.close()}
