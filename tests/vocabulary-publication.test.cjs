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
run("document.querySelector('#current-account').textContent='baokeyu'");
run("page='vocabulary';vocabularyCatalogTab='word';editorialQuery='';renderVocabulary()");
assert.equal($('.vocabulary-heading-count'),null);assert.equal($('#catalog-distinctions'),null);
assert.ok($('.page-head .vocabulary-catalog-tabs'));
assert.ok($('[data-catalog-tab="publish"]'));
const original=w.document.querySelectorAll('[data-catalog-open]').length;
$('#word-search').value='record';$('#word-search').dispatchEvent(new w.Event('input'));
assert.equal(w.document.querySelectorAll('[data-catalog-open]').length,original);
$('#catalog-search-form button').click();
assert.equal(w.document.querySelectorAll('[data-catalog-open]').length,1);
$('#word-search').value='set';$('#catalog-search-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.ok($('tbody').textContent.includes('set'));
$('[data-catalog-tab="publish"]').click();
assert.ok($('#catalog-publish').classList.contains('publish-action'));
assert.ok($('.catalog-publication-panel'));assert.equal(run('data.vocabularyPublications.length'),2);assert.ok($('.school-publication-timeline').textContent.includes('内置示例'));assert.equal(run('data.vocabularyPublishedSnapshot.entries.length'),20);run('renderVocabulary()');assert.equal(run('data.vocabularyPublications.length'),2);
$('#catalog-publish').click();run('closeDialog()');assert.equal(run('(data.vocabularyPublications||[]).length'),2);
run(`data.vocabularyCatalogEdits||={};data.vocabularyCatalogReview||={};for(const id of ['90001','90002','90003','90004']){const e=catalogEntries().find(e=>e.id===id);data.vocabularyCatalogEdits[id]={words:[{displayWord:e.word}],positions:[{D:'uk',E:'uk.aac',F:'us',G:'us.aac'}],meanings:[{O:'测试释义'}]}};data.vocabularyCatalogReview['90002']={status:'pending'};data.vocabularyCatalogEdits['90003'].positions[0].E='';data.vocabularyCatalogEdits['90004'].meanings=[]`);
assert.equal(run("catalogCanPublish(catalogEntries().find(e=>e.id==='90001'))"),true);
for(const id of ['90002','90003','90004'])assert.equal(run(`catalogCanPublish(catalogEntries().find(e=>e.id==='${id}'))`),false);
const eligible=run('catalogEntries().filter(catalogCanPublish).length');
$('#catalog-publish').click();$('#catalog-publication-note').value='首次发布';$('#catalog-confirm-publish').click();
assert.equal(run('data.vocabularyPublications.length'),3);
assert.equal(run('data.vocabularyPublishedSnapshot.entries.length'),eligible);
assert.equal(run("data.vocabularyPublishedSnapshot.entries.some(e=>['90002','90003','90004'].includes(e.id))"),false);
assert.ok($('.school-publication-timeline').textContent.includes('首次发布'));
const snapshot=run('JSON.stringify(data.vocabularyPublishedSnapshot)');
run("data.vocabularyCatalogEdits||={};var changedEntry=catalogEntries()[0];data.vocabularyCatalogEdits[changedEntry.id]=structuredClone(catalogModel(changedEntry));data.vocabularyCatalogEdits[changedEntry.id].words[0].displayWord='new draft'");
assert.equal(run('JSON.stringify(data.vocabularyPublishedSnapshot)'),snapshot);
$('#catalog-publish').click();$('#catalog-confirm-publish').click();assert.equal(run('data.vocabularyPublications.length'),4);
assert.ok($('.school-publication-timeline li:first-child').textContent.includes('第 4 次发布'));
run('delete data.vocabularyPublicationExampleVersion;renderVocabulary()');assert.equal(run('data.vocabularyPublications.length'),4);
assert.ok(run("bookPublishActionLabel({bookType:'听力书籍',workflow:{stage:'解析编写中',history:[],steps:['终审'],reviews:{}}})").includes('基础发布'));
assert.ok(run("bookPublishActionLabel({bookType:'听力书籍',workflow:{stage:'已定稿',history:[],steps:['终审'],reviews:{}}})").includes('完整发布'));
run("var fullBook=data.books.find(b=>b.bookType==='听力书籍'&&bookFlow(b).stage==='已定稿');renderBookWorkflow(fullBook,document.querySelector('#page'))");
assert.ok($('[data-book-flow="publish"]').classList.contains('publish-action'));

for(const name of ['陈浩杰','鲍科羽','马若彦']){run(`document.querySelector('#current-account').textContent='${name}'`);assert.equal(run('canPublishWorkspace()'),true,name)}
for(const name of ['柴田','孙颖','unknown']){run(`document.querySelector('#current-account').textContent='${name}'`);assert.equal(run('canPublishWorkspace()'),false,name);run("vocabularyCatalogTab='publish';renderVocabulary()");assert.ok($('#catalog-publish').disabled);$('#catalog-publish').onclick();assert.equal($('#dialog').open,false);const before=run('JSON.stringify(data)');assert.equal(run("bookTransition(fullBook,'publish')"),false);assert.equal(run('JSON.stringify(data)'),before);run("renderBookWorkflow(fullBook,document.querySelector('#page'))");assert.ok($('[data-book-flow="publish"]').disabled)}
run("var schoolPermissionFixture={id:'school-permission-test',bookType:'校本书籍',schoolSuiteVersions:{},workflow:{stage:'已定稿',history:[],steps:[],reviews:{}}};renderBookWorkflow(schoolPermissionFixture,document.querySelector('#page'))");assert.ok($('[data-book-flow="publish"]').disabled);
run("document.querySelector('#current-account').textContent='baokeyu';vocabularyCatalogTab='publish';renderVocabulary()");assert.equal($('#catalog-publish').disabled,false);$('#catalog-publish').click();const beforeRevocation=run('JSON.stringify(data.vocabularyPublications)');run("document.querySelector('#current-account').textContent='柴田'");$('#catalog-confirm-publish').click();assert.equal(run('JSON.stringify(data.vocabularyPublications)'),beforeRevocation);run('closeDialog()');
run("document.querySelector('#current-account').textContent='陈浩杰';var digitalMember=publishingMember();var previousStatus=digitalMember.status;digitalMember.status='停用'");assert.equal(run('canPublishWorkspace()'),false);run("digitalMember.status=previousStatus");assert.equal(run('canPublishWorkspace()'),true);
run("var digitalRoot=data.departments.find(d=>d.name==='数智研发部');var originalDepartments=digitalMember.departments;digitalMember.departments=[digitalRoot.id]");assert.equal(run('canPublishWorkspace()'),true);run('digitalMember.departments=originalDepartments');
run("document.querySelector('#current-account').textContent='baokeyu';vocabularyCatalogTab='publish';renderVocabulary()");
$('#catalog-publish').click();
const recordCount=run('data.vocabularyPublications.length');
run("for(const e of catalogEntries())data.vocabularyCatalogReview[e.id]={status:'pending'}");
$('#catalog-confirm-publish').click();
assert.equal(run('data.vocabularyPublications.length'),recordCount);
run('closeDialog()');
console.log('PASS header tabs, explicit search, publication cancel/save/history/snapshot isolation, typed red book publication buttons');
}finally{await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
