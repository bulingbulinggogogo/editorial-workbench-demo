const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync('index.html','utf8');
function setup(html,url){const vc=new VirtualConsole();const errors=[];vc.on('jsdomError',e=>{if(!/stylesheet|navigation/.test(e.message))errors.push(e.message)});const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;w.structuredClone=structuredClone;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};const ctx=dom.getInternalVMContext();return {dom,w,doc:w.document,run:s=>vm.runInContext(s,ctx),errors}}
// Styles inside app-bootstrap are inert: boot only executes its scripts.
const shell=new JSDOM(source);const catalogStyles=shell.window.document.querySelector('head link[href="vocabulary-catalog.css"]');assert.ok(catalogStyles,'catalog styles must load outside the inert bootstrap template');assert.equal(shell.window.document.querySelector('#app-bootstrap').content.querySelector('link[href="vocabulary-catalog.css"]'),null);shell.window.close();
const main=setup(source.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),'https://test.invalid');main.run(source.match(/<script>([\s\S]*?)<\/script>/)[1]);for(const match of source.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='app-storage.js')main.run(fs.readFileSync(match[1],'utf8'));

main.run("page='vocabulary';renderVocabulary()");
const q=s=>main.doc.querySelector(s);
assert.equal(q('#catalog-review-panel input[value=clear]'),null);assert.equal(main.doc.querySelectorAll('#catalog-review-panel input[type=radio]').length,2);assert.equal(q('#catalog-status-panel select'),null);assert.equal(q('#catalog-review-panel select'),null);assert.equal(q('#catalog-review-filter').tagName,'BUTTON');assert.equal(q('#catalog-status-panel').getAttribute('popover'),'auto');assert.equal(q('#catalog-review-panel').getAttribute('popover'),'auto');assert.equal(main.doc.querySelectorAll('#catalog-status-panel input[type=checkbox]').length,5);
main.run("document.querySelector('#current-account').textContent='孙颖'");
assert.equal(main.run("catalogInGroup('听力')"),true);
q('#catalog-new').click();let frame=q('.vocabulary-editor-frame');const id=new URL(frame.src).searchParams.get('entry');
const model={words:[{A:id,displayWord:'reviewword',row:'w1'}],positions:[{A:id,C:'',D:'uk',E:'uk.aac',F:'us',G:'us.aac',row:'p1'}],meanings:[{B:id,I:'',O:'审核测试',row:'m1',examples:[],chunks:[]}]};
const send=(approve=false)=>main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:save',entryId:id,model:structuredClone(model),approve}}));
send();assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].status`),'pending');
send(true);assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].status`),'pending');
main.run("document.querySelector('#current-account').textContent='柴田'");
assert.equal(main.run(`catalogCanReview(catalogEntries().find(e=>e.id==='${id}'))`),true);
send();assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].status`),'pending');
main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:close',entryId:id}}));
assert.ok(q('.catalog-review-pending'));q('#catalog-review-panel input[value="pending"]').checked=true;q('#catalog-review-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,1);
q(`[data-catalog-open="${id}"]`).click();frame=q('.vocabulary-editor-frame');send(true);
assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].status`),'approved');assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].reviewedBy`),'柴田');
main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:close',entryId:id}}));assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,0);
main.run("document.querySelector('#current-account').textContent='孙颖';catalogStatusFilters.word={};renderVocabulary()");q(`[data-catalog-open="${id}"]`).click();frame=q('.vocabulary-editor-frame');send();assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].status`),'pending');
main.run("document.querySelector('#current-account').textContent='鲍科羽'");assert.equal(main.run(`catalogCanReview(catalogEntries().find(e=>e.id==='${id}'))`),false);send(true);assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].status`),'pending');
main.run("renderVocabulary()");assert.equal(q('[data-catalog-mark]'),null);
main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:save',entryId:id,model:structuredClone(model),markReview:true}}));assert.equal(main.run(`data.vocabularyCatalogReview['${id}'].markedBy`),undefined);
main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:close',entryId:id}}));
for(const [actor,needsReview] of [['柴田',false],['鲍科羽',true]]){
 main.run(`document.querySelector('#current-account').textContent='${actor}';catalogStatusFilters.word={};renderVocabulary()`);
 q('#catalog-new').click();const newFrame=q('.vocabulary-editor-frame'),newId=new URL(newFrame.src).searchParams.get('entry');
 main.w.dispatchEvent(new main.w.MessageEvent('message',{source:newFrame.contentWindow,data:{type:'vocabulary:save',entryId:newId,model:structuredClone(model)}}));
 assert.equal(main.run(`data.vocabularyCatalogReview['${newId}']?.status==='pending'`),needsReview);
 main.w.dispatchEvent(new main.w.MessageEvent('message',{source:newFrame.contentWindow,data:{type:'vocabulary:close',entryId:newId}}));
}
const html=fs.readFileSync('examples/present-editor/index.html','utf8');
for(const mode of ['', '&mode=view']){const app=setup(html,'https://test.invalid/examples/present-editor/index.html?entry=90001'+mode);for(const name of ['data.js','../../vocabulary-catalog-data.js','catalog-entry.js','components.js','editor.js'])app.run(fs.readFileSync('examples/present-editor/'+name,'utf8'));assert.equal(app.doc.querySelector('#approveCatalog'),null);assert.equal(app.doc.querySelector('#markCatalogReview'),null);app.run('window.catalogPending=true;window.catalogCanReview=true;render()');assert.equal(app.doc.querySelector('#markCatalogReview'),null);assert.equal(!!app.doc.querySelector('#approveCatalog'),!mode);app.run('window.catalogCanReview=false;render()');assert.equal(app.doc.querySelector('#approveCatalog'),null);assert.equal(app.doc.querySelector('#markCatalogReview'),null);app.w.PresentUI.dispose();app.dom.window.close()}
assert.ok(main.run("catalogSectionStatus(catalogEntries()[0]).every(s=>['未填写','已填写'].includes(s.status)&&['needs-content','is-complete'].includes(s.tone))"));
main.w.BookUI.disposeHierarchies(main.doc.body);main.w.BookUI.disposeSelects();main.dom.window.close();console.log('PASS vocabulary review: listening creation, filters, ordinary save, authorized approval, unauthorized rejection, resubmission, editor button visibility');
