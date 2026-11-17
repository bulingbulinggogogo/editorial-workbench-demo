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
run("page='books';activeBook='';bookType='听力书籍';window.sortedBooks=[];BookUI.renderBookProductsTable=(host,options)=>{window.sortedBooks=options.rows.map(r=>r.id)};BookUI.renderBankPagination=()=>{};const candidates=data.books.filter(b=>b.sharedResources&&(b.bookType||'听力书籍')==='听力书籍');window.firstId=candidates[0].id;window.lastId=candidates.at(-1).id;data.operationAudit||={};data.operationAudit[JSON.stringify(['books',window.firstId])]={at:'2026-11-10T00:00:00Z'};data.operationAudit[JSON.stringify(['books',window.lastId])]={at:'2026-11-11T00:00:00Z'};renderBookWorkspace();");
assert.equal(w.sortedBooks[0],w.lastId);assert.equal(w.sortedBooks[1],w.firstId);
run("commitWorkspace(d=>{d.books.find(b=>b.id===window.firstId).shortName='最近编辑测试'});renderBookWorkspace()");
assert.equal(w.sortedBooks[0],w.firstId,'saving edits updates list order');
run("editorialQuery=data.books.find(b=>b.id===window.lastId).name;renderBookWorkspace()");assert.ok(w.sortedBooks.includes(w.lastId));
console.log('PASS descending audit time before pagination, saved edit moves to first row and search preserved');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
