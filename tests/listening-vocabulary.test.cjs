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
 run("page='vocabulary-listening';render()");
 $('#scene-add-parent').click();let form=$('#resource-form');form.elements.name.value='机场';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal($('.unified-directory-toolbar h3'),null);
 assert.equal($('[data-scene-depth]'),null);
 assert.equal($('.unified-directory-row .chapter-resource-meta').textContent,'0');
 $('[data-scene-add-heading]').click();assert.ok($('.scene-heading-editor'));assert.equal(w.document.querySelector('dialog[open]'),null);
 form=$('.scene-heading-editor');form.querySelector('input').value='值机';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const childId=run('data.listeningVocabularyScenes[0].children[0].id');
 const meanings=JSON.parse(run("JSON.stringify(vocabularyMeanings(Object.values(vocabularyTable('meanings')).find(m=>vocabularyMeanings(m.wordId).length>1).wordId).slice(0,2))"));
 function addMeaning(m){$(`[data-scene-meanings="${childId}"]`).click();assert.equal(w.document.querySelector('dialog[open]'),null);const input=$('.scene-word-editor input');input.value=m.id;input.dispatchEvent(new w.Event('input',{bubbles:true}));$(`[data-select-meaning="${m.id}"]`).click()}
 addMeaning(meanings[0]);addMeaning(meanings[1]);
 assert.equal(run("resourceCollection('wordlists')[data.listeningVocabularyScenes[0].children[0].wordlistId].wordSelections.length"),2);
 assert.equal(run("resourceCollection('wordlists')[data.listeningVocabularyScenes[0].children[0].wordlistId].wordIds.length"),1);
 assert.equal($(`[data-scene-group="${childId}"] .chapter-resource-meta`).textContent,'2');assert.equal($('.unified-directory-row .chapter-resource-meta').textContent,'2');
 $(`[data-scene-toggle="${childId}"]`).click();assert.equal($('[data-scene-unlink]'),null);
 $(`[data-scene-toggle="${childId}"]`).click();assert.ok($('[data-scene-unlink]'));
 $('[data-scene-unlink]').click();assert.ok($('#scene-unlink-confirm'));run('closeDialog()');assert.equal(w.document.querySelectorAll('[data-scene-unlink]').length,2);
 $('[data-scene-unlink]').click();$('#scene-unlink-confirm').click();assert.equal(w.document.querySelectorAll('[data-scene-unlink]').length,1);
 $('[data-scene-add-heading]').click();form=$('.scene-heading-editor');form.querySelector('input').value='值机';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.ok(form.querySelector('.error').textContent.includes('重复'));form.querySelector('[data-inline-cancel]').click();assert.equal($('.scene-insert-editor'),null);
 $(`[data-scene-meanings="${childId}"]`).click();assert.equal($('.scene-word-editor [data-inline-cancel]'),null);assert.equal($('.scene-inline-results').textContent,'');w.document.body.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal($('.scene-insert-editor'),null);

 // Insert a heading within an existing group's words: trailing words remain below the new heading.
 run(`sceneMoveWord(data.listeningVocabularyScenes[0].id,'${childId}',sceneVocabularyRows(resourceCollection('wordlists')[data.listeningVocabularyScenes[0].children[0].wordlistId])[0].key,data.listeningVocabularyScenes[0].id,0);renderListeningVocabulary()`);
 assert.equal(run("sceneVocabularyRows(resourceCollection('wordlists')[data.listeningVocabularyScenes[0].wordlistId]).length"),1);
 assert.ok(run('data.listeningVocabularyScenes[0].modifiedBy'));assert.ok($('.listening-dict-history').textContent.includes('修改时间'));
 assert.ok($('#scene-save').closest('.page-head'));assert.equal($('#scene-back').textContent,'返回');assert.equal($('.page-head [data-scene-depth]'),null);assert.equal($('#scene-back').nextElementSibling,$('#page h1'));
 assert.ok($('.scene-word-summary').textContent.includes(' / '));
 assert.equal($('[data-scene-group]').querySelector('.directory-sort-handle'),null);assert.equal($('[data-scene-group]').querySelector('[data-scene-title]'),null);assert.equal($('.chapter-resource-icon'),null);
 const rootId=run('data.listeningVocabularyScenes[0].id');
 $(`[data-scene-anchor="${rootId}"][data-scene-index="0"] [data-scene-add-heading]`).click();form=$('.scene-heading-editor');form.querySelector('input').value='原位标题';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const inserted=run("data.listeningVocabularyScenes[0].children.find(c=>c.name==='原位标题').id");
 const tree=$('.directory-detail-table');const elements=[...tree.children];assert.ok(elements.indexOf($(`[data-scene-group="${inserted}"]`))<elements.indexOf($('[data-scene-word]')));
 const beforeOrder=run('data.listeningVocabularyScenes[0].children.map(c=>c.id).join()');
 $(`[data-scene-group="${inserted}"] .directory-sort-handle`).dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
 assert.notEqual(run('data.listeningVocabularyScenes[0].children.map(c=>c.id).join()'),beforeOrder);
 const key=$('[data-scene-word]').dataset.sceneWord;
 run(`sceneMoveWord('${rootId}','${rootId}','${key}','${inserted}',0);renderListeningVocabulary()`);
 assert.equal($('[data-scene-word]').dataset.wordOwner,inserted);
 $(`[data-scene-delete="${inserted}"]`).click();assert.ok($('#scene-delete-confirm'));$('#scene-delete-confirm').click();
 assert.equal($(`[data-scene-group="${inserted}"]`),null);assert.equal($('[data-scene-word]').dataset.wordOwner,rootId);
 assert.equal($('.unified-empty'),null);
 const rename=$(`[data-scene-group="${childId}"] .directory-row-actions [data-scene-title]`);assert.ok(rename);rename.click();const inline=$('.scene-title-form');inline.querySelector('input').value='值机手续';inline.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.ok($(`[data-scene-group="${childId}"] .book-tree-label`).textContent.includes('值机手续'));
 $('#scene-back').click();assert.ok($('[data-scene-open]'));assert.equal($('[data-scene-title]'),null);assert.equal($('#page th').textContent,'词汇表 ID');assert.ok($('#page').textContent.includes('词汇数量'));assert.equal($('#page tbody tr td').textContent,run('data.listeningVocabularyScenes[0].wordlistId'));
 run("data.teachingLibrary.packages['test-scene-ref']={id:'test-scene-ref',name:'引用测试',items:[{kind:'wordlists',id:data.listeningVocabularyScenes[0].wordlistId}]};renderListeningVocabulary()");assert.ok($('[data-scene-remove-list]').disabled);$('[data-scene-references]').click();assert.ok(w.document.body.textContent.includes('引用测试'));run('closeDialog()');
 run("delete data.teachingLibrary.packages['test-scene-ref'];renderListeningVocabulary()");$('[data-scene-remove-list]').click();run('closeDialog()');assert.equal(run('data.listeningVocabularyScenes.length'),1);
 $('[data-scene-remove-list]').click();run("data.teachingLibrary.packages['test-scene-ref']={id:'test-scene-ref',name:'引用测试',items:[{kind:'wordlists',id:data.listeningVocabularyScenes[0].wordlistId}]}");$('#scene-remove-list-confirm').click();assert.equal(run('data.listeningVocabularyScenes.length'),1);assert.ok($('#scene-remove-list-error').textContent.includes('不能删除'));run("delete data.teachingLibrary.packages['test-scene-ref']");$('#scene-remove-list-confirm').click();assert.equal(run('data.listeningVocabularyScenes.length'),0);
$('[data-listening-vocab-tab="difficult"]').click();assert.ok($('[data-scene-open]'));assert.ok($('#page').textContent.includes('词汇数量'));
 console.log('PASS inline headings, inline exact meanings, cancel, numeric counts, shared depth radios and unlink confirmation');
}finally{w.close()}
