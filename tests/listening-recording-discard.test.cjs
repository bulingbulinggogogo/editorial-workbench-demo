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

(async()=>{try{
run("window.sourceId='BK-SOURCE-686';window.suiteId=bookAnalysisSuites(data.books.find(b=>b.id===window.sourceId))[0].id;window.oldOrder=[...data.teachingLibrary.suites[window.suiteId].materialIds];openWholeSuiteEditor({id:window.suiteId,bookReference:{bookId:window.sourceId}})");await new Promise(r=>setTimeout(r,150));
assert.ok($('.lc-recording-sort'));assert.equal($('.lc-revision-summary').textContent.includes('保存范围'),false);assert.ok($('.lc-revision-book .book-status-label.is-pending'));
const field=$('[data-sentence="0"] [data-sfield=text]');const changed=field.value+' unsaved';field.value=changed;field.dispatchEvent(new w.Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,0));
$('.lc-recording-sort').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
assert.equal($('[data-recording-row]').dataset.recordingRow,w.oldOrder[1]);assert.equal($('.lc-recording-row.active').dataset.recordingRow,w.oldOrder[0]);assert.equal($('[data-sentence="0"] [data-sfield=text]').value,changed);
assert.deepEqual([...run('data.teachingLibrary.suites[window.suiteId].materialIds')],[...w.oldOrder]);
assert.equal(run('bookAnalysisSuites(data.books.find(b=>b.id===window.sourceId))[0].materialIds[0]'),w.oldOrder[1]);
assert.notEqual(run('data.listeningBank.materials[window.oldOrder[0]].segments[0].text'),changed);
assert.equal($('[data-revision-save=correction]').disabled,false);
const rows=[...w.document.querySelectorAll('[data-recording-row]')],transfer={setData(){}};
function drag(type,el){const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientY:100});Object.defineProperty(event,'dataTransfer',{value:transfer});el.dispatchEvent(event)}
drag('dragstart',rows[0].querySelector('.lc-recording-sort'));drag('dragover',rows[1]);drag('drop',rows[1]);
assert.equal($('[data-recording-row]').dataset.recordingRow,w.oldOrder[0]);
assert.equal(run('bookAnalysisSuites(data.books.find(b=>b.id===window.sourceId))[0].materialIds[0]'),w.oldOrder[0]);
// Unsaved changes block switching; discard restores the full recording.
$('[data-suite-recording="'+w.oldOrder[1]+'"]').click();
assert.equal($('.lc-recording-row.active').dataset.recordingRow,w.oldOrder[0]);
assert.ok($('#lc-error').textContent.includes('请先保存'));
assert.equal($('#lc-discard-recording').disabled,false);
$('#lc-discard-recording').click();
assert.equal($('#lc-revision-status').textContent,'当前录音稿暂无修改');
assert.equal($('[data-sentence="0"] [data-sfield=text]').value,run('data.listeningBank.materials[window.oldOrder[0]].segments[0].text'));
assert.ok($('#lc-discard-recording').disabled);assert.ok($('[data-revision-save=correction]').disabled);
assert.equal($('.lc-footer').classList.contains('has-unsaved-changes'),false);
$('[data-suite-recording="'+w.oldOrder[1]+'"]').click();assert.equal($('.lc-recording-row.active').dataset.recordingRow,w.oldOrder[1]);
console.log('PASS reorder persisted per book, source suite unchanged, active recording and unsaved text retained, capsule and footer');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
