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


(async()=>{try{
run("var src=data.books.find(b=>b.id==='REVIEW-DEMO-3');var child=structuredClone(src);child.id='SCHOOL-GATE';child.bookType='校本书籍';child.sourceListeningBookId=src.id;child.workflow={stage:'编书中',steps:[],round:0,reviews:{},history:[],published:null};data.books.push(child);page='books';activeBook=child.id;bookSection='状态维护';render()");
assert.ok($('[data-book-flow=publish]').disabled);assert.equal(run("bookTransition(child,'publish')"),false);
run("src.workflow.published={at:new Date().toISOString(),withAnalysis:false};render()");assert.equal($('[data-book-flow=publish]').disabled,false);assert.equal(run("bookTransition(child,'publish')"),true);assert.ok(run("bookFlow(data.books.find(b=>b.id==='SCHOOL-GATE')).published"));
assert.equal(run("bookFlow(data.books.find(b=>b.id==='SCHOOL-GATE')).publications.at(-1).withAnalysis"),false);
run("data.books.find(b=>b.id===src.id).workflow.published.withAnalysis=true");assert.equal(run("bookTransition(data.books.find(b=>b.id==='SCHOOL-GATE'),'publish')"),true);assert.equal($('.school-publication-timeline>li .publication-type').textContent,'完全发布');assert.equal(w.document.querySelectorAll('.school-publication-timeline .publication-type')[1].textContent,'基础发布');
run("data.books.find(b=>b.id===src.id).workflow.published=null;render()");assert.ok($('[data-book-flow=publish]').disabled);assert.ok($('#school-unpublish'));assert.equal(run("bookTransition(data.books.find(b=>b.id==='SCHOOL-GATE'),'publish')"),false);
run("data.books=data.books.filter(b=>b.id!==src.id);render()");assert.ok($('[data-book-flow=publish]').disabled);assert.equal(run("schoolBookSourceStatus(data.books.find(b=>b.id==='SCHOOL-GATE'))"),'来源不存在');
run("data.books.find(b=>b.id==='SCHOOL-GATE').workflow.publications=[{at:'2026-11-09T01:00:00Z',actor:'first'},{at:'2026-11-10T01:00:00Z',actor:'latest'}];render()");
assert.equal($('.school-publication-records table'),null);assert.equal(w.document.querySelectorAll('.school-publication-timeline>li').length,2);assert.ok($('.school-publication-timeline>li').textContent.includes('latest'));assert.ok($('.school-publication-timeline>li').textContent.includes('基础发布'));assert.ok(!$('.school-publication-timeline').textContent.includes('次发布'));assert.equal($('.school-publication-scroll').tabIndex,0);
console.log('PASS source publication gate: unpublished blocked, basic published allowed, down/missing blocked, unpublish retained');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});