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

w.URL.revokeObjectURL=()=>{};w.scrollTo=()=>{};
(async()=>{try{
w.URL.createObjectURL=()=> 'blob:fixture/'+Math.random();w.Blob.prototype.arrayBuffer=async()=>new ArrayBuffer(4);
w.AudioContext=class{async decodeAudioData(){return {duration:11.35,getChannelData:()=>new Float32Array(1000)}}async close(){}};
w.HTMLCanvasElement.prototype.getContext=()=>({setTransform(){},clearRect(){},fillRect(){}});
run('var batchTestFiles=new Map();audioFileStore=async(id,file)=>{if(file)batchTestFiles.set(id,file);return batchTestFiles.get(id)}');
const wait=()=>new Promise(r=>setTimeout(r,700));run(`openWholeSuiteEditor({id:Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='REVIEW-DEMO-2-S').id})`);await wait();
const original=$('[data-qfield=text]').value;$('[data-qfield=text]').value=original+' ';
$('[data-add-recording]').click();$('#lc-next').click();await wait();assert.ok($('#lc-step2.active'));
$('#lc-next').click();await wait();assert.ok($('#lc-step3.active'),$('#listening-create #lc-error').textContent);
$('#lc-next').click();await wait();assert.ok($('#lc-step4.active'));
for(const b of [...w.document.querySelectorAll('#listening-create [data-clue-question]')]){b.click();if(!$('#lc-no-clue').checked)$('#lc-no-clue').click()}
$('#lc-next').click();await wait();assert.ok($('#lc-step5.active'));
w.document.querySelectorAll('[data-translation-code]').forEach(el=>{if(!el.value.trim())el.value='测试译文'});
$('#lc-next').click();await wait();assert.equal($('.lc-batch-overlay'),null);assert.equal(w.document.querySelectorAll('[data-suite-recording]').length,2);assert.equal(run(`data.teachingLibrary.suites[Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='REVIEW-DEMO-2-S').id].materialIds.length`),1);
console.log('PASS real batch workflow saves and returns new recording to the existing suite draft');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
