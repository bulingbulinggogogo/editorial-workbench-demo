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
run("const m=bankData().materials['STATE-DEMO-M-0'];const seg=m.segments[0];const q=Object.values(bankData().questions).find(q=>q.scriptId===m.id);q.noDirectClue=false;q.clueNeedsReview=false;q.clues=[{segmentId:seg.id,start:0,end:seg.text.length,text:seg.text}];");
run("const extra=structuredClone(bankData().materials['STATE-DEMO-M-0']);extra.id='CLOZE-SECOND';extra.segments[0].text='Second recording only.';bankData().materials[extra.id]=extra;const eq=structuredClone(Object.values(bankData().questions).find(q=>q.scriptId==='STATE-DEMO-M-0'));eq.id='CLOZE-Q-SECOND';eq.scriptId=extra.id;eq.noDirectClue=true;eq.clues=[];bankData().questions[eq.id]=eq;const eq2=structuredClone(eq);eq2.id='CLOZE-Q-SECOND-2';eq2.number=2;bankData().questions[eq2.id]=eq2;data.teachingLibrary.suites[Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='STATE-DEMO-S-0').id].materialIds.push(extra.id)");
run("openWholeSuiteEditor({id:Object.values(data.teachingLibrary.suites).find(s=>s.sourceId==='STATE-DEMO-S-0').id})");await new Promise(r=>setTimeout(r,100));$('[data-edit-view=cloze]').click();
assert.equal(w.document.querySelectorAll('.lc-cloze-record').length,1);
$('[data-suite-recording="CLOZE-SECOND"]').click();assert.equal(w.document.querySelectorAll('.lc-cloze-record').length,1);assert.equal($('.lc-cloze-record').dataset.clozeRecord,'1');assert.ok($('.lc-cloze-line').textContent.includes('Second recording only.'));$('[data-suite-recording="STATE-DEMO-M-0"]').click();assert.equal($('.lc-cloze-record').dataset.clozeRecord,'0');
const row=$('.lc-cloze-line'),words=[...row.querySelectorAll('[data-cloze-start]')],whole=row.querySelector('[data-cloze-whole]');assert.ok(words.length>3);
row.click();assert.ok(words.every(b=>b.getAttribute('aria-pressed')==='true'));assert.equal(whole,null);assert.equal(row.querySelectorAll('.lc-cloze-gap.is-blank').length,words.length-1);row.click();assert.ok(words.every(b=>b.getAttribute('aria-pressed')==='false'));
words[1].click();assert.equal(words[1].getAttribute('aria-pressed'),'true');words[1].click();assert.equal(words[1].getAttribute('aria-pressed'),'false');
words[0].dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,buttons:1}));words[2].dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true,buttons:1}));words[2].dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true}));words[2].click();assert.ok(words.slice(0,3).every(b=>b.getAttribute('aria-pressed')==='true'));assert.equal(words[3].getAttribute('aria-pressed'),'false');
$('[data-edit-view=content]').click();$('[data-edit-view=cloze]').click();assert.equal($('.lc-cloze-line').querySelectorAll('.lc-cloze-word.is-blank').length,3);
$('#lc-save-progress').click();await new Promise(r=>setTimeout(r,100));console.log('Save feedback:', $('#lc-error').textContent);assert.ok(run("bankData().materials['STATE-DEMO-M-0'].segments.some(s=>s.clozeBlanks?.length===3)"));
assert.equal($('[data-cloze-from-clues]'),null);$('.lc-cloze-line').click();const currentWords=[...$('.lc-cloze-line').querySelectorAll('[data-cloze-start]')];assert.ok(currentWords.every(b=>b.getAttribute('aria-pressed')==='true'));
currentWords[0].dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0,buttons:1}));currentWords.at(-1).dispatchEvent(new w.MouseEvent('pointerover',{bubbles:true,buttons:1}));currentWords.at(-1).dispatchEvent(new w.MouseEvent('pointerup',{bubbles:true}));currentWords.at(-1).click();assert.ok(currentWords.every(b=>b.getAttribute('aria-pressed')==='false'));

console.log('PASS removed buttons and row whole sentence toggle, single word toggle, drag range without click reversal and tab persistence');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1})
