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
const cascades=new Map(),original=w.BookUI.renderLinkedCascader;w.BookUI.renderLinkedCascader=(host,props)=>{cascades.set(host.id,props);original(host,props)};
w.Range.prototype.getBoundingClientRect=()=>({top:0,left:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
assert.equal(run('Object.keys(vocabularyTable("words")).length'),4802);assert.equal(run('Object.keys(vocabularyTable("positions")).length'),5658);assert.equal(run('Object.keys(vocabularyTable("meanings")).length'),9190);
run("page='vocabulary';render()");assert.ok($('#page').textContent.includes('基础词库'));assert.ok($('#word-search'));
run("vocabularyDetailId='100';renderVocabulary()");assert.ok($('#page').textContent.includes('Borneo'));assert.ok($('#page').textContent.includes('UK_Borneo.aac'));
run("vocabularyEdit('meanings','6753','100','3706')");$('#vocab-form [name=english]').value='Borneo test';$('#vocab-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('vocabularyTable("meanings")["6753"].english'),'Borneo test');assert.equal(run('vocabSeed.meanings["6753"].english'),'');
// Batch editor preserves IDs and commits all three sections together.
run("vocabularyEditAll('100')");assert.equal(w.document.querySelectorAll('.vocab-editor-section').length,3);
const batch=$('[data-vocab-draft="meanings"][data-record="6753"][data-key="english"]');batch.value='Batch meaning';batch.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(run('vocabularyTable("meanings")["6753"].english'),'Borneo test');$('#vocab-save-all').click();assert.equal(run('vocabularyTable("meanings")["6753"].english'),'Batch meaning');
assert.equal(run('vocabularySelectionValid({wordId:"100",posId:"3706",meaningId:"6753"})'),true);assert.equal(run('vocabularySelectionValid({wordId:"10",posId:"3706",meaningId:"6753"})'),false);
run("var testMid=Object.keys(bankData().materials).find(id=>bankQuestions(id).length>1);openListeningCreate(true,{materialId:testMid,view:'analysis'})");await new Promise(r=>setTimeout(r,100));
assert.equal(w.document.querySelectorAll('[data-group-note="微技能"]').length,run('bankQuestions(testMid).length'));
$('[data-group-note="话题词汇"]').click();$('#an-title').value='旅行词汇';$('#an-rich')._teachingQuill.clipboard.dangerouslyPasteHTML('<b>travel</b> 旅行');$('#lc-save-note').click();assert.equal($('#an-category-cascade'),null);
$('[data-group-note="百科知识"]').click();$('#an-title').value='测试百科';$('#an-rich')._teachingQuill.setText('百科说明');$('#lc-save-note').click();assert.ok($('#an-category-cascade'));assert.ok($('#lc-error').textContent.includes('上传'));$('#lc-cancel-note').click();
// Select a source fragment then choose vocabulary and its exact IDs.
const source=$('[data-teaching-source]');const range=w.document.createRange();range.selectNodeContents(source);const sel=w.getSelection();sel.removeAllRanges();sel.addRange(range);source.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));$('#lc-add-note').click();cascades.get('an-category-cascade').onChange(['词汇','重难点词汇']);cascades.get('an-vocab-cascade').onChange(['100','3706','6753']);$('#lc-save-note').click();assert.equal($('#an-category-cascade'),null);
// Persist through the real recording-save path, then reopen in read mode.
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,120));const notes=run('bankData().materials[testMid].teachingNotes');assert.ok(notes.some(n=>n.category==='话题词汇'&&n.title==='旅行词汇'));assert.ok(notes.some(n=>n.wordId==='100'&&n.posId==='3706'&&n.meaningId==='6753'));assert.ok(run('vocabularyReferenceCount("100")')>0);run('vocabularyDeleteWord("100")');assert.ok(run('vocabularyWord("100")')); 
assert.equal(w.document.querySelectorAll('[contenteditable="true"]').length,0);
run("document.getElementById('listening-create').close()");
run("page='interactive-sentences';resourceTrail=[];render()");$('#interactive-new').click();$('#interactive-form [name=title]').value='长难句测试';$('#an-rich')._teachingQuill.clipboard.dangerouslyPasteHTML('<strong>Example sentence.</strong>');$('#interactive-add-step').click();$('#interactive-form [name=prompt]').value='找主干';$('#interactive-form [name=answer]').value='主语 + 谓语';$('#interactive-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));const iid=run('Object.keys(data.interactiveTeaching)[0]');assert.ok(iid);run('previewInteractiveTeaching('+JSON.stringify(iid)+')');assert.ok($('.teaching-preview details'));$('.teaching-preview').close();
run('commitWorkspace(d=>{d.listeningBank.materials[testMid].teachingNotes.push({interactiveId:'+JSON.stringify(iid)+',mode:"引用长难句互动教学"})});render()');assert.equal($('[data-interactive-delete]').disabled,true);
assert.equal(run('safeTeachingHTML('+JSON.stringify('<script>alert(1)</script><img src=x onerror=alert(1)><b onclick="x">ok</b>')+')'),'<b>ok</b>');
console.log('PASS workbook IDs and relationships, structured vocabulary edits, rich notes, exact meaning selection, recording save, interactive creation and deletion protection, safe HTML');
} finally {w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(resolve=>setTimeout(resolve,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
