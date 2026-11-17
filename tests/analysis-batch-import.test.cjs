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
run(`var fixture=[{materialId:'m1',segments:[{id:'s1',text:'Stay indoors.'}],questions:[{id:'q1',text:'Where?',options:[{key:'C',text:'Stay indoors.'}]}],teachingNotes:[]},{materialId:'m2',segments:[{id:'s2',text:'Second sentence.'}],questions:[],teachingNotes:[]}];
var sample='·分类：词汇\\n·二级：重难点词汇\\n·录音稿1/\\n·题号：1\\n·类型：C\\n·凸显：indoors\\n·内容：\\n单词表：23456';
var savedVT=vocabularyTable,savedVW=vocabularyWord;
vocabularyTable=key=>key==='meanings'?{'23456':{id:'23456',wordId:'w',posId:'p',chinese:'在室内'}}:key==='positions'?{p:{id:'p',wordId:'w',label:'adv.'}}:{};
vocabularyWord=id=>({id:'w',word:'indoors'});`);
assert.equal(run('parseAnalysisBatch(sample)[0].item.meaningId'),'23456');
assert.equal(run('matchAnalysisBatch(parseAnalysisBatch(sample),fixture).matched[0].note.sourceKey'),'option:q1:C');
assert.equal(run("matchAnalysisBatch(parseAnalysisBatch(sample.replace('类型：C','类型：录音稿')),fixture).matched[0].note.sourceKey"),'segment:s1');
assert.equal(run("matchAnalysisBatch(parseAnalysisBatch(sample.replace('类型：C','类型：录音稿/A/B/C')),fixture).unmatched.length"),1);
assert.equal(run("matchAnalysisBatch(parseAnalysisBatch(sample.replace('单词表：23456','')),fixture).matched.length"),1);
assert.equal(run("matchAnalysisBatch(parseAnalysisBatch(sample.replace('23456','99999')),fixture).unmatched.length"),1);
assert.equal(run('parseAnalysisBatch(sample+"\\n"+sample).length'),2);
assert.equal(run('matchAnalysisBatch(parseAnalysisBatch(sample+"\\n"+sample),fixture).unmatched.length'),1);
run("var imported=0;openAnalysisBatchImport({getRecords:()=>fixture,onImported:n=>imported=n})");
$('#analysis-batch-text').value=run('sample');$('#analysis-batch-confirm').click();assert.equal(run('imported'),1);assert.equal(run('fixture[0].teachingNotes.length'),1);
run("fixture[0].teachingNotes=[];openAnalysisBatchImport({getRecords:()=>fixture,onImported:n=>imported=n})");
$('#analysis-batch-text').value=run("sample+'\\n'+sample.replace('indoors','unknown')");$('#analysis-batch-confirm').click();assert.ok($('#analysis-batch-details').value.includes('找不到'));assert.equal(run('fixture[0].teachingNotes.length'),0);let copied='';Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}});$('#analysis-batch-copy').click();await new Promise(r=>setTimeout(r,0));assert.ok(copied.includes('unknown'));$('[data-cancel]').click();assert.equal(run('fixture[0].teachingNotes.length'),0);
run("openAnalysisBatchImport({getRecords:()=>fixture,onImported:n=>imported=n})");$('#analysis-batch-text').value=run("sample+'\\n'+sample.replace('indoors','unknown')");$('#analysis-batch-confirm').click();$('#analysis-batch-confirm').click();assert.equal(run('fixture[0].teachingNotes.length'),1);
run('vocabularyTable=savedVT;vocabularyWord=savedVW');
run("var ids=Object.keys(bankData().materials).slice(0,2);openListeningCreate(true,{materialId:ids[0],view:'analysis'},{suiteMaterials:ids})");
await new Promise(r=>setTimeout(r,100));
assert.ok($('#lc-batch-analysis'));$('#lc-batch-analysis').click();
$('#analysis-batch-text').value=run("JSON.stringify(ids.map((id,i)=>({category:'语法',subcategory:'其他',recording:i+1,type:'录音稿',highlight:bankData().materials[id].segments[0].text,content:'批量测试讲解'})))");
$('#analysis-batch-confirm').click();assert.equal($('.analysis-batch-dialog'),null);assert.ok($('.lc-note-list').textContent.includes('批量测试讲解'));
w.document.querySelectorAll('[data-suite-recording]')[1].click();assert.ok($('.lc-note-list').textContent.includes('批量测试讲解'));
assert.ok(!run("JSON.stringify(bankData().materials[ids[1]].teachingNotes||[])").includes('批量测试讲解'));
console.log('PASS labelled sample, word reference, option/transcript location, ambiguity, duplicates, all/partial import and cancellation');
} finally {w.document.querySelectorAll('[data-quill-editor]').forEach(el=>el.remove());await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1})
