const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync('index.html','utf8');
function setup(html,url){const vc=new VirtualConsole();const errors=[];vc.on('jsdomError',e=>{if(!/stylesheet|navigation/.test(e.message))errors.push(e.message)});const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;w.structuredClone=structuredClone;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};const ctx=dom.getInternalVMContext();return {dom,w,doc:w.document,run:s=>vm.runInContext(s,ctx),errors}}
// Styles inside app-bootstrap are inert: boot only executes its scripts.
const shell=new JSDOM(source);const catalogStyles=shell.window.document.querySelector('head link[href="vocabulary-catalog.css"]');assert.ok(catalogStyles,'catalog styles must load outside the inert bootstrap template');assert.equal(shell.window.document.querySelector('#app-bootstrap').content.querySelector('link[href="vocabulary-catalog.css"]'),null);shell.window.close();
const main=setup(source.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),'https://test.invalid');main.run(source.match(/<script>([\s\S]*?)<\/script>/)[1]);for(const match of source.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='app-storage.js')main.run(fs.readFileSync(match[1],'utf8'));
assert.equal(main.run("catalogModel(catalogEntries().find(e=>e.id==='90001')).meanings[0].meaningId"),'10001');
assert.equal(main.run("vocabularyTable('meanings')['1000003'].chinese"),main.run("vocabularyTable('meanings')['10003'].chinese"));
assert.ok(main.run("catalogEntries().every(e=>catalogModel(e).meanings.every(m=>/^\\d{5}$/.test(m.meaningId)))"));
main.run("page='vocabulary';renderVocabulary()");const q=s=>main.doc.querySelector(s);assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,10);assert.equal(q('[data-catalog-status] [role=group]').getAttribute('aria-label').split('，').length,4);assert.equal(main.run("catalogSectionStatus(catalogEntries()[0]).find(s=>s.label==='音标音频').status"),'已填写');q('[data-catalog-tab="chunk"]').click();assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,10);assert.ok(main.doc.querySelector('thead').textContent.includes('词块类型'));assert.equal(q('[data-catalog-status] [role=group]').getAttribute('aria-label').split('，').length,3);q('[data-catalog-open="90109"]').click();let frame=q('.vocabulary-editor-frame');assert.ok(frame.src.endsWith('?entry=90109'));const style=main.doc.createElement('style');style.textContent=fs.readFileSync('vocabulary-catalog.css','utf8');main.doc.head.append(style);assert.equal(main.w.getComputedStyle(frame).position,'fixed');assert.equal(main.w.getComputedStyle(frame).width,'100vw');assert.equal(main.w.getComputedStyle(frame).zIndex,'10000');
const html=fs.readFileSync('examples/present-editor/index.html','utf8');const entries=JSON.parse(main.run('JSON.stringify(VocabularyCatalog.entries)'));
for(const id of ['90001','90101']){const view=setup(html,'https://test.invalid/examples/present-editor/index.html?entry='+id+'&mode=view');for(const name of ['data.js','../../vocabulary-catalog-data.js','catalog-entry.js','components.js','editor.js'])view.run(fs.readFileSync('examples/present-editor/'+name,'utf8'));assert.ok(view.doc.querySelector('#catalogBack'));assert.ok(view.doc.querySelector('.catalog-edit-meta').textContent.includes('最后编辑人：—'));assert.equal(view.doc.querySelector('#saveExample'),null);assert.equal(view.doc.querySelector('[data-view]'),null);assert.equal(view.doc.querySelector('.drag-host'),null);assert.equal(view.doc.querySelector('.meaning-insert-actions'),null);const before=view.run('JSON.stringify(model)');view.doc.querySelector('[data-pos="v"]')?.click();assert.equal(view.run('JSON.stringify(model)'),before);assert.equal(view.doc.querySelector('#saveExample'),null);assert.deepEqual(view.errors,[]);view.w.PresentUI.dispose();view.dom.window.close()}
for(const e of entries){const app=setup(html,'https://test.invalid/examples/present-editor/index.html?entry='+e.id);for(const name of ['data.js','../../vocabulary-catalog-data.js','catalog-entry.js','components.js','editor.js'])app.run(fs.readFileSync('examples/present-editor/'+name,'utf8'));assert.equal(app.run('word().displayWord'),e.word);if(e.id==='90001'){
app.run("pos='v';render()");
const pronunciationBefore=app.run('JSON.stringify(model)');
app.run("for(const p of model.positions){p.S='';p.T='';p._visible=(p._visible||[]).filter(k=>!['S','T'].includes(k))}render()");
assert.equal(app.doc.querySelector('#markCatalogReview'),null);
assert.equal(app.run("Array.from(widgets.values()).find(w=>w.props.label==='添加口语和书写级别').props.items.length"),2);
app.run("addField('positions',currentPosition(),'S')");assert.ok(app.run("currentPosition()._visible.includes('S')"));app.run("deleteField(currentPosition(),'S')");assert.equal(app.run("currentPosition().S"),'');
app.run("handleButton({id:'saveExample',dataset:{}})");assert.ok(app.w.localStorage.getItem(e.storage),'S and W optional');
for(const key of ['D','E','F','G']){app.run(`var oldPronunciation=model.positions[0]['${key}'];model.positions[0]['${key}']='';localStorage.removeItem(STORAGE);handleButton({id:'saveExample',dataset:{}})`);assert.equal(app.w.localStorage.getItem(e.storage),null,key+' required');app.run(`model.positions[0]['${key}']=oldPronunciation`)}
app.run('model='+pronunciationBefore+';render()');

assert.equal(app.run("Array.from(widgets.values()).find(w=>w.props.label==='添加单词标签').props.grouped"),true);
assert.equal(app.run("Array.from(widgets.values()).find(w=>w.props.label==='添加单词标签').props.items.find(g=>g.label==='听力').children[0].label"),'语音指导');
assert.equal(app.run("Array.from(widgets.values()).find(w=>w.props.label==='添加单词标签').props.items.find(g=>g.label==='听力标签').children.some(i=>i.children)"),false);

app.run("var dialectMeaning=model.meanings.find(m=>m.I==='v');dialectMeaning.dialect='BrE';dialectMeaning.AC='British';dialectMeaning.AD='American';render()");
assert.ok(app.doc.querySelector('.meaning-dialect-group [data-field="meanings-AD"]'));
assert.equal(app.doc.querySelector('[data-field="meanings-AC"]'),null);
app.run("dialectMeaning.dialect='AmE';render()");
assert.ok(app.doc.querySelector('.meaning-dialect-group [data-field="meanings-AC"]'));
assert.equal(app.doc.querySelector('[data-field="meanings-AD"]'),null);
assert.equal(app.run("Array.from(widgets.values()).filter(w=>w.props.label==='添加释义内容').some(w=>JSON.stringify(w.props.items).includes('@image')||JSON.stringify(w.props.items).includes('@example'))"),false);
app.run("dialectMeaning.AC='';render()");
assert.ok(!app.doc.querySelector('.meaning-dialect-group').textContent.includes('待填写'));
app.run("dialectMeaning.AA='equivalent';render()");
assert.equal(app.doc.querySelector('[data-field="meanings-AA"] .field-caption').textContent,'=');
assert.ok(app.doc.querySelector('[data-field="meanings-AA"]').classList.contains('relation-field'));
assert.equal(app.doc.querySelectorAll('[data-field="meanings-AA"]').length,1);
assert.equal(app.doc.querySelector('.frequency-host'),null);assert.ok(app.doc.querySelector('.sense-number'));
assert.equal(app.doc.querySelector('[data-field="positions-J"],[data-field="positions-L"],[data-field="positions-N"]'),null);
assert.ok(!app.doc.querySelector('.word-forms').textContent.includes('·英'));
assert.equal(app.run("Array.from(widgets.values()).some(w=>w.props.label==='添加单词标签'&&JSON.stringify(w.props.items).includes('听力说明'))"),false);
assert.equal(app.run("Array.from(widgets.values()).some(w=>w.props.label==='添加释义内容'&&JSON.stringify(w.props.items).includes('听力说明'))"),true);
app.run("addField('meanings',model.meanings.find(m=>m.I==='v'),'AI')");
assert.ok(app.doc.querySelector('[data-field="meanings-AI"]'));
app.run("model.meanings.find(m=>m.I==='v').AI='测试听力说明';for(const p of model.positions)for(const k of formKeysFor(p.C))p[k]='';render()");
assert.ok(!app.doc.querySelector('.word-forms').textContent.includes('待填写'));
assert.equal(app.doc.querySelector('.word-forms .unfilled-card'),null);
app.run("handleButton({id:'saveExample',dataset:{}})");
assert.ok(app.w.localStorage.getItem(e.storage),'empty word forms save');
app.run("model.meanings[0].examples=[{en:'',zh:'旧例句'}];model.meanings[0].chunks=[{word:'legacy',meaning:'旧词块',examples:[{en:'',zh:'旧引用例句'}]}];render();handleButton({id:'saveExample',dataset:{}})");
assert.equal(app.doc.querySelector('.examples,.example-item'),null);
assert.ok(!app.doc.body.textContent.includes('添加例句'));
assert.equal(JSON.parse(app.w.localStorage.getItem(e.storage)).model.meanings[0].examples[0].zh,'旧例句');
assert.equal(JSON.parse(app.w.localStorage.getItem(e.storage)).model.meanings[0].chunks[0].examples[0].zh,'旧引用例句');

}if(e.entryType==='word'){assert.ok(app.doc.querySelector('.word-syllables + .word-id'));assert.equal(app.doc.querySelector('.word-id').textContent,'单词ID：'+e.id);}assert.ok(app.doc.querySelector('.meaning-id').textContent.includes(app.run('model.meanings.find(m=>m.I===pos)?.meaningId||model.meanings[0].meaningId')));assert.ok(app.doc.querySelector('.sense-section > .meaning-id'));assert.match(app.doc.querySelector('.meaning-id').textContent,/^释义ID：\d{5}$/);assert.equal(app.doc.querySelector('.meaning-fields > .meaning-id'),null);assert.equal(app.run('model.meanings.length'),e.meanings.length);if(e.entryType==='chunk'){assert.equal(app.doc.querySelector('.pos-tabs'),null);assert.equal(app.doc.querySelector('.position-pane'),null);assert.equal(app.doc.querySelector('[data-audio-change]'),null);assert.ok(app.doc.querySelector('[aria-label="词块类型"]'));assert.equal(app.run('model.positions.length'),0);app.run("handleButton({id:'addMeaning',dataset:{}})");assert.equal(app.run('model.meanings.at(-1).I'),'');assert.equal([...app.doc.querySelectorAll('.meaning-id')].at(-1).textContent,'保存后生成ID');app.run("model.meanings.at(-1).O='新增义';handleButton({id:'saveExample',dataset:{}})");assert.ok(app.w.localStorage.getItem(e.storage))}else{assert.ok(app.doc.querySelector('.pos-tabs'));assert.ok(app.doc.querySelector('.position-pane'));app.run("for(const p of model.positions)for(const k of ['D','E','F','G'])if(!String(p[k]||'').trim())p[k]=k==='E'||k==='G'?'test.aac':'test';handleButton({id:'saveExample',dataset:{}})");assert.ok(app.w.localStorage.getItem(e.storage),e.word+' complete pronunciation save');}assert.deepEqual(app.errors,[],e.word);app.w.PresentUI.dispose();app.dom.window.close()}
const entry=entries.find(e=>e.id==='90109');const model={words:structuredClone(entry.words),positions:[],meanings:entry.meanings.map(m=>({...m,examples:[],chunks:[]}))};model.words[0].displayWord='edited long chunk';model.meanings.push({...model.meanings[0],row:'test-new',meaningId:undefined,O:'新释义'});main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:save',entryId:entry.id,model}}));assert.equal(main.run("data.vocabularyCatalogEdits['90109'].words[0].displayWord"),'edited long chunk');assert.match(main.run("data.vocabularyCatalogEdits['90109'].meanings.at(-1).meaningId"),/^\d{5}$/);assert.ok(main.run("vocabularyTable('meanings')[data.vocabularyCatalogEdits['90109'].meanings.at(-1).meaningId]"));main.w.dispatchEvent(new main.w.MessageEvent('message',{source:frame.contentWindow,data:{type:'vocabulary:close',entryId:entry.id}}));assert.ok(main.run("data.vocabularyCatalogAudit['90109'].actor"));assert.ok(main.run("data.vocabularyCatalogAudit['90109'].at"));assert.equal(q('.vocabulary-editor-frame'),null);assert.ok(q('tbody').textContent.includes('edited long chunk'));assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,10);
main.run("data.vocabularyCatalogDeleted=['90201'];data.vocabularyCatalogExtra={'90201':{id:'90201',entryType:'chunk'}};renderVocabulary()");q('#catalog-new').click();assert.ok(q('.vocabulary-editor-frame').src.includes('entry=90202&fresh=1&kind=chunk'));
main.run("data.vocabularyCatalogEdits['90001']={words:[{displayWord:'record'}],positions:[{D:'IPA',E:'file.aac',F:'',G:''}],meanings:[{O:'记录',examples:[{en:'A record.',zh:''}],chunks:[{word:'keep a record',meaning:''}]}]}");
assert.deepEqual(JSON.parse(main.run("JSON.stringify(catalogSectionStatus(catalogEntries().find(e=>e.id==='90001')).map(x=>x.status))")),['已填写','未填写','已填写','未填写']);
main.run("data.vocabularyCatalogEdits['90001']={words:[{displayWord:''}],positions:[],meanings:[]}");assert.ok(JSON.parse(main.run("JSON.stringify(catalogSectionStatus(catalogEntries().find(e=>e.id==='90001')))" )).every(x=>x.status==='未填写'));
main.run("vocabularyCatalogTab='word';editorialQuery='';renderVocabulary()");
assert.equal(q('[data-status-section="例句"]'),null);
q('[data-status-section="基础属性"][value="未填写"]').checked=true;
q('#catalog-status-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,1);
assert.ok(q('[data-catalog-open="90001"]'));
q('[data-status-section="音标音频"][value="未填写"]').checked=true;
q('#catalog-status-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,1);
q('#catalog-status-all').click();
q('#catalog-status-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,10);
q('#catalog-status-reset').click();
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,10);
q('[data-status-section="基础属性"][value="未填写"]').checked=true;
q('#catalog-status-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}));
q('#word-search').value='set';q('#catalog-search-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,0);
q('[data-catalog-tab="chunk"]').click();
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,10);
assert.equal(q('[data-status-section="例句"]'),null);
q('[data-catalog-tab="word"]').click();
assert.equal(main.doc.querySelectorAll('[data-catalog-open]').length,1);
main.w.BookUI?.disposeHierarchies?.(main.doc.body);
main.w.BookUI?.disposeSelects?.();main.dom.window.close();console.log('PASS catalog: 10+10 list, all 20 real entry pages, chunk structure/type, source-exact save, parent bridge and return');
