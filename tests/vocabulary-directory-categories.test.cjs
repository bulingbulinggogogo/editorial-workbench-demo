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
 const standards=run('JSON.stringify(data.standardVocabularyVersions)');
 run("resourceCollection('wordlists')['category-topic']={id:'category-topic',name:'话题测试',listeningCategory:'topics',wordIds:['vocab:'+Object.keys(vocabularyTable('words'))[0]]};resourceCollection('wordlists')['category-difficult']={id:'category-difficult',name:'难点测试',listeningCategory:'difficult',wordIds:[]};page='vocabulary-listening';listeningVocabularyTab='topics';render()");
 const originalWords=run("JSON.stringify(resourceCollection('wordlists')['category-topic'].wordIds)");
 assert.ok($('#scene-add-parent').textContent.includes('话题词汇'));
 const topicId=run("data.listeningVocabularyScenes.find(p=>p.wordlistId==='category-topic').id");
 $(`[data-scene-open="${topicId}"]`).click();
 assert.ok($('.scene-directory-editor'));assert.ok($('#scene-save'));assert.equal($('#scene-back').textContent,'返回');
 assert.equal(run("JSON.stringify(resourceCollection('wordlists')['category-topic'].wordIds)"),originalWords);
 const title=$('.scene-task-name-input');title.value='话题测试改名';$('#scene-save').click();
 assert.equal(run("resourceCollection('wordlists')['category-topic'].name"),'话题测试改名');
 assert.equal(run(`data.listeningVocabularyScenes.find(p=>p.id==='${topicId}').name`),'话题测试改名');
 $('[data-scene-add-heading]').click();let form=$('.scene-heading-editor');form.querySelector('input').value='话题分组';$('#scene-save').click();assert.equal($('.scene-heading-editor'),null);
 const childId=run(`data.listeningVocabularyScenes.find(p=>p.id==='${topicId}').children[0].id`);
 $(`[data-scene-meanings="${childId}"]`).click();const search=$('.scene-word-editor input');const mid=run("Object.keys(vocabularyTable('meanings'))[0]");search.value=mid;search.dispatchEvent(new w.Event('input',{bubbles:true}));$(`[data-select-meaning="${mid}"]`).click();
 assert.equal(run(`resourceCollection('wordlists')[data.listeningVocabularyScenes.find(p=>p.id==='${topicId}').children[0].wordlistId].listeningCategory`),'topics');
 $('#scene-back').click();$('[data-listening-vocab-tab="difficult"]').click();assert.equal($(`[data-scene-open="${topicId}"]`),null);
 const difficultId=run("data.listeningVocabularyScenes.find(p=>p.wordlistId==='category-difficult').id");$(`[data-scene-open="${difficultId}"]`).click();assert.equal($('#scene-back').textContent,'返回');assert.equal(w.document.querySelectorAll('[data-scene-group]').length,1);
 $('#scene-back').click();$('[data-listening-vocab-tab="topics"]').click();assert.equal(run("data.listeningVocabularyScenes.filter(p=>p.wordlistId==='category-topic').length"),1);
 assert.equal(run('JSON.stringify(data.standardVocabularyVersions)'),standards);
 console.log('PASS category migration preserves IDs and words, category isolation, inline meanings, save title and pending heading, standards unchanged');
}finally{w.close()}
