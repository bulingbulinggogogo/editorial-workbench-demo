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

try {
run("var paper=Object.values(bankData().papers).find(p=>p.listeningSuiteId);var paperId=paper.id;resourceTrail=[];page='gaokao-bank';resourceOpen('papers',paperId,'edit')");
assert.equal(w.document.querySelectorAll('.paper-composition-table>table>tbody>tr').length,6);assert.equal($('#page .tabs'),null);assert.equal($('#paper-add-section'),null);assert.equal($('[data-paper-toggle]'),null);
run("data.paperQuestionBanks={'阅读理解':{'42':{id:'42',name:'阅读来源',text:'A passage',questions:[{text:'A question'}]}},'写作':{'43':{id:'43',name:'写作来源'}}};render()");
$('[data-paper-pick]').click();assert.ok($('#resource-picker input[value="42"]'));assert.equal($('#resource-picker input[value="43"]'),null);$('#resource-picker input[value="42"]').checked=true;$('#resource-picker').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(run('bankData().papers[paperId].sections[1].references[0]'),'42');
$('[data-paper-question]').click();assert.ok($('#dialog').textContent.includes('A passage'));run('closeDialog()');
$('[data-paper-unlink]').click();assert.equal(run('bankData().papers[paperId].sections[1].references.length'),0);assert.ok(run("data.paperQuestionBanks['阅读理解']['42']"));
run("resourceOpen('papers',paperId,'view')");assert.equal($('#paper-add-section'),null);assert.equal($('[data-paper-remove]'),null);assert.equal($('[data-paper-pick]'),null);
console.log('PASS paper one-row-per-type table, type-specific reference actions, source preservation and read-only controls');
}finally{w.close()}
