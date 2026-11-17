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


let decodes=0,peaks=0;
w.File.prototype.arrayBuffer=async()=>new ArrayBuffer(8);
w.URL.createObjectURL=()=> 'blob:test-wave';
w.AudioContext=class{async decodeAudioData(bytes){assert.ok(bytes.byteLength);decodes++;return {duration:11.35,getChannelData:()=>new Float32Array([.1,.5,-.3,.7])}}async close(){}};
w.HTMLCanvasElement.prototype.getContext=()=>({setTransform(){},clearRect(){},fillRect(){peaks++}});
(async()=>{try{
run("openWholeSuiteEditor({id:Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='STATE-DEMO-S-0').id})");
await new Promise(r=>setTimeout(r,150));
assert.ok(decodes>0,'existing URL audio must be decoded');
assert.ok($('#listening-create .lc-recording-card #lc-wave'),'waveform is inline in recording card');
assert.ok($('.lc-wave-scroll'),'reuse horizontal waveform viewport');
assert.ok(peaks>0,'decoded samples drawn');
assert.equal(w.document.querySelectorAll('#listening-create').length,1);
const end=$('[data-sentence="0"] [data-sfield=end]');const old=end.value;
$('[data-boundary=end]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
assert.notEqual(end.value,old,'wave boundary updates sentence timestamp');
$('[data-edit-view=cloze]').click();$('[data-edit-view=content]').click();
assert.ok($('#lc-wave'),'waveform persists across tabs');
assert.equal($('.lc-wave-status'),null);
console.log('PASS existing URL audio decoding, inline shared waveform, timestamp editing and tab persistence');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
