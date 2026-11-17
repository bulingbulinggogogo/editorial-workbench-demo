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
w.Range.prototype.getBoundingClientRect=()=>({top:0,left:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
const cascades=new Map(),original=w.BookUI.renderLinkedCascader;w.BookUI.renderLinkedCascader=(host,props)=>{cascades.set(host.id,props);original(host,props)};
run("var testMid=Object.keys(bankData().materials).find(id=>bankQuestions(id).length>1);openListeningCreate(true,{materialId:testMid,view:'analysis'})");await new Promise(r=>setTimeout(r,100));
const source=$('[data-teaching-source]');const range=w.document.createRange();range.selectNodeContents(source);w.getSelection().removeAllRanges();w.getSelection().addRange(range);source.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));$('#lc-add-note').click();
assert.equal($('#lc-selection-text').textContent,'');assert.equal($('.lc-note-form h3'),null);assert.ok($('#lc-note-highlight'));
assert.ok($('.lc-selection-bar').compareDocumentPosition($('.lc-teaching-editor>.lc-source-group-title'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
assert.equal(cascades.get('an-category-cascade').options.map(o=>o.value).join(','),'词汇,语音,实用表达,语法');
cascades.get('an-category-cascade').onChange(['词汇','重难点词汇']);assert.ok($('.an-vocab-card'));
const tree=cascades.get('an-vocab-cascade').options;const borneo=tree.find(w=>w.value==='100');assert.equal(borneo.children[0].label.includes(' · '),false);assert.ok(borneo.children.find(p=>p.value==='3706').children.some(m=>m.value==='6753'));
cascades.get('an-vocab-cascade').onChange(['100','3706','6753']);assert.equal($('.an-vocab-preview'),null);
assert.equal($('.lc-note-list').hidden,true);
const second=tree.find(x=>x.value!=='100'&&x.children.some(p=>p.children?.length));const secondPos=second.children.find(p=>p.children?.length);const secondPath=[second.value,secondPos.value,secondPos.children[0].value];
cascades.get('an-vocab-cascade').onChange(secondPath);cascades.get('an-vocab-cascade').onChange(secondPath);assert.equal(w.document.querySelectorAll('[data-selected-word]').length,2);
const transfer={effectAllowed:'',dropEffect:'',setData(){}};
function dragWord(from,to,after){const drag=new w.Event('dragstart',{bubbles:true});Object.defineProperty(drag,'dataTransfer',{value:transfer});$('[data-drag-word="'+from+'"]').dispatchEvent(drag);const row=$('[data-selected-word="'+to+'"]');row.getBoundingClientRect=()=>({top:100,height:40});for(const type of ['dragover','drop']){const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientY:after?135:105});Object.defineProperty(event,'dataTransfer',{value:transfer});row.dispatchEvent(event);if(type==='dragover')assert.ok(row.classList.contains(after?'is-drop-after':'is-drop-before'))}}
dragWord(0,1,true);assert.ok($('[data-selected-word="1"]').textContent.includes('Borneo'));
dragWord(1,0,false);assert.ok($('[data-selected-word="0"]').textContent.includes('Borneo'));
dragWord(0,1,true);assert.ok($('[data-selected-word="1"]').textContent.includes('Borneo'));
assert.equal($('[data-remove-word="0"]').textContent,'解除引用');
assert.equal(w.document.querySelectorAll('.is-drop-before,.is-drop-after').length,0);

assert.equal($('.ql-size'),null);assert.equal($('.ql-clean').textContent,'清除格式');assert.ok($('.an-vocab-inline'));const q=$('#an-rich')._teachingQuill;assert.ok(q);q.setText('格式保存测试');q.formatText(0,2,'bold',true);q.formatText(0,2,'color','#dc4446');q.formatText(0,2,'size','large');
const highlight=$('#lc-note-highlight');assert.equal(highlight.tagName,'SPAN');assert.equal(highlight.isContentEditable,undefined);
$('#lc-reposition-note').click();const fresh=$('[data-teaching-source]');const newRange=w.document.createRange();newRange.selectNodeContents(fresh);w.getSelection().removeAllRanges();w.getSelection().addRange(newRange);fresh.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));$('#lc-add-note').click();assert.equal($('#lc-note-highlight').textContent,fresh.textContent);assert.equal($('#lc-selection-text').textContent,'');
assert.ok($('#an-rich')._teachingQuill.getSemanticHTML().includes('ql-size-large'));assert.ok($('#an-rich')._teachingQuill.getSemanticHTML().includes('color'));
$('#lc-save-note').click();assert.equal($('.lc-note-form'),null);assert.equal($('.lc-note-list').hidden,false);const button=$('[data-open-note]');assert.equal(button.querySelector('small'),null);assert.equal(button.textContent,'编辑');assert.ok($('[data-delete-note]'));$('[data-preview-note]').dispatchEvent(new w.MouseEvent('mouseenter'));assert.ok($('.an-note-popover'));assert.ok($('.an-note-popover strong'));assert.ok($('.an-preview-word'));assert.equal($('.an-note-popover').textContent.includes('录音稿 ·'),false);const expand=$('.an-note-popover [data-expand-meanings]');assert.equal($('.an-note-popover .an-all-meanings').hidden,true);expand.click();assert.equal($('.an-note-popover .an-all-meanings').hidden,false);expand.click();assert.equal($('.an-note-popover .an-all-meanings').hidden,true);
button.click();assert.ok($('#an-rich')._teachingQuill.getSemanticHTML().includes('<strong'));assert.equal($('#lc-selection-text').textContent,'');$('#lc-cancel-note').click();
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,150));assert.ok(run('bankData().materials[testMid].teachingNotes.some(n=>n.wordSelections?.length===2&&n.wordSelections[1].meaningId==="6753"&&n.contentHtml.includes("<strong"))'));
console.log('PASS linked classification and vocabulary, card preview, Quill format persistence, highlight update, cleared selection, hover preview and layout order');
} finally {w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(resolve=>setTimeout(resolve,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
