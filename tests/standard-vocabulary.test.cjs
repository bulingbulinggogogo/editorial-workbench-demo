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
 assert.equal($('#vocabulary-nav-pages [data-page=wordlists]'),null);
 assert.equal($('[data-standard-version]').dataset.standardVersion,'standard-2025-example');
 assert.equal(run('data.standardVocabularyVersions.every(v=>v.words.length===10)'),true);
 assert.equal($('#standard-word-add'),null);assert.equal($('[data-standard-link]'),null);
 assert.ok(!$('#page').textContent.includes('内置示例'));
 assert.ok(!$('#page').textContent.includes('关联词库'));
 assert.equal(run("data.standardVocabularyVersions.flatMap(v=>v.words).every(w=>vocabularyWord(w.wordId.slice(6)))"),true);
 $('[data-standard-copy]').click();let f=$('#standard-version-form');f.elements.name.value=run('data.standardVocabularyVersions[0].name');f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('data.standardVocabularyVersions.length'),2);assert.ok(f.querySelector('.error').textContent.includes('不能'));f.elements.name.value='新版';f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.ok($('[data-standard-version]').textContent.includes('新版'));assert.equal($('[data-standard-version]').getAttribute('aria-selected'),'true');
 assert.equal(run('data.standardVocabularyVersions[0].words.length'),10);assert.equal(run('data.standardVocabularyVersions[0].sourceVersionId'),'standard-2025-example');
 $('#standard-words-pick').click();const pick=$('#vocab-pick-results input');pick.checked=true;pick.dispatchEvent(new w.Event('change',{bubbles:true}));$('#vocab-pick-save').click();
 assert.equal(run('data.standardVocabularyVersions[0].words.length'),11);
 assert.ok(run("vocabularyReferenceCount(data.standardVocabularyVersions[0].words[0].wordId.slice(6))")>0);
 $('[data-standard-remove]').click();assert.equal(run('data.standardVocabularyVersions[0].words.length'),11);run('closeDialog()');assert.equal(run('data.standardVocabularyVersions[0].words.length'),11);$('[data-standard-remove]').click();$('#standard-unlink-confirm').click();assert.equal(run('data.standardVocabularyVersions[0].words.length'),10);assert.equal(run('data.standardVocabularyVersions[1].words.length'),10);
 assert.equal(run('data.standardVocabularyVersions[0].history.length'),3);
 assert.ok(run('data.standardVocabularyVersions[0].history.every(h=>h.actor&&h.time&&h.detail)'));
 assert.ok(run('data.standardVocabularyVersions[0].history[0].detail').includes('解除引用'));
 assert.equal(run('(data.standardVocabularyVersions[1].history||[]).length'),0);
 $('#standard-history').click();assert.ok(w.document.body.textContent.includes('解除引用'));run('closeDialog()');
 run("page='vocabulary-listening';listeningVocabularyTab='difficult';render()");assert.ok($('#page').textContent.includes('难点词汇'));
 run("page='vocabulary-standard';standardVocabularyVersion='standard-2025-example';render()");
 assert.equal($('#standard-page-size'),null);assert.equal($('.standard-word-items').children.length,10);assert.ok(!$('.standard-word-items').textContent.includes('课标删减词'));assert.equal($('.standard-latest'),null);assert.equal(w.document.querySelectorAll('.standard-vocabulary-layout > section').length,4);assert.ok($('.standard-unlink svg'));assert.ok($('#standard-next').disabled);
 const search=$('#standard-query');search.value='DRONE';search.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(w.document.querySelectorAll('.standard-word-row').length,1);assert.equal(w.document.querySelectorAll('.standard-delta-list')[0].querySelectorAll('.standard-delta-row').length,1);assert.equal(w.document.querySelectorAll('.standard-delta-list')[1].querySelectorAll('.standard-delta-row').length,0);
 const actualId=run("data.standardVocabularyVersions.find(v=>v.id==='standard-2025-example').words.find(w=>vocabularyWord(w.wordId.slice(6)).word==='drone').wordId.slice(6)");assert.equal($('.standard-word-id').textContent,actualId);
 $('#standard-query').value='cheek';$('#standard-query').dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(w.document.querySelectorAll('.standard-word-row').length,0);assert.equal(w.document.querySelectorAll('.standard-delta-list')[1].querySelectorAll('.standard-delta-row').length,1);
 $('#standard-query').value='';$('#standard-query').dispatchEvent(new w.Event('input',{bubbles:true}));
 $('[data-standard-rename]').click();let edit=$('.standard-version-inline');edit.querySelector('input').value='原位改名';edit.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));assert.equal(run('data.standardVocabularyVersions[0].name'),'原位改名');
 assert.equal($('#standard-version-edit'),null);assert.ok(run('data.standardVocabularyVersions[0].history[0].detail').includes('修改版本名称'));
 assert.equal(run("standardVocabularyComparison({words:[{wordId:'vocab:1'},{wordId:'vocab:2'}]},{words:[{wordId:'vocab:2'},{wordId:'vocab:3'}]}).map(w=>w.status).join(',')"),'课标新增词,未变化');
 assert.equal($('#standard-version-add'),null);
 $('[data-standard-copy="standard-2020-example"]').click();const copyForm=$('#standard-version-form');assert.ok(copyForm.textContent.includes('2020'));copyForm.elements.name.value='旧版复制';copyForm.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(run('data.standardVocabularyVersions[0].sourceVersionId'),'standard-2020-example');assert.equal(run("data.standardVocabularyVersions[0].words.map(w=>w.wordId).join(',')===data.standardVocabularyVersions.find(v=>v.id==='standard-2020-example').words.map(w=>w.wordId).join(',')"),true);
 console.log('PASS latest-first tabs, new version selection, bank-only word lists, removal isolation and references');
}finally{w.close()}
