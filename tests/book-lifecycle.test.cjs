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
run("page='books';activeBook='';bookType='听力书籍';render()");
const headings=[...w.document.querySelectorAll('.book-products-table th')].map(n=>n.textContent);
assert.ok(!headings.includes('产品简称'));assert.ok(!headings.includes('产品分类'));assert.ok(headings.includes('编稿状态'));assert.ok(headings.some(h=>h.startsWith('发布状态')));
assert.equal(run('data.books.filter(b=>b.demo).length'),10);assert.equal($('.book-products-table tbody tr td').style.paddingLeft,'20px');
assert.equal(w.document.querySelectorAll('.ant-table-filter-trigger').length,4);
assert.equal(w.document.querySelectorAll('.book-manuscript-dots')[0].children.length,3);
$('.book-manuscript-dots').focus();await new Promise(r=>setTimeout(r,200));assert.ok($('.book-manuscript-preview'));assert.match($('.book-manuscript-preview').textContent,/编书.*进行中.*编写解析.*未开始.*审核解析.*未开始/);$('.book-manuscript-dots').blur();

w.document.querySelectorAll('.ant-table-filter-trigger')[3].click();await new Promise(r=>setTimeout(r,100));
assert.ok($('.ant-table-filter-dropdown'));assert.equal($('.ant-table-filter-dropdown input[type=search]'),null);assert.ok($('.ant-table-filter-dropdown input[type=checkbox]'));
const item=[...w.document.querySelectorAll('.ant-dropdown-menu-item')].find(el=>el.textContent.includes('已发布'));assert.ok(item);item.click();await new Promise(r=>setTimeout(r,30));
const basic=[...w.document.querySelectorAll('.ant-dropdown-menu-item')].find(el=>el.textContent.includes('基础发布'));basic.click();await new Promise(r=>setTimeout(r,30));
const confirm=[...w.document.querySelectorAll('.ant-table-filter-dropdown button')].find(el=>el.textContent.includes('确'));assert.ok(confirm);confirm.click();await new Promise(r=>setTimeout(r,100));
assert.equal(run("bookTableFilters[bookType].publication.length"),2);assert.ok([...w.document.querySelectorAll('.book-publication-pill')].every(el=>['已发布','基础发布'].includes(el.textContent)));
run("bookTableFilters[bookType].version=['2026'];renderBookWorkspace()");assert.equal(run("bookTableFilters[bookType].publication.length"),2);
run("bookTableFilters[bookType]={version:['不存在']};renderBookWorkspace()");assert.match($('.book-products-table tbody').textContent,/没有符合/);assert.equal(w.document.querySelectorAll('.ant-table-filter-trigger').length,4);
run('bookTableFilters[bookType]={};renderBookWorkspace()');

assert.equal(run("data.books.filter(b=>b.demo).every(b=>bookAnalysisSuites(b).length===1&&bookBaseErrors(b).length===0)"),true);
assert.ok($('[data-book-lifecycle="delete"][data-book-id="BK-STATE-DEMO-1"]'));
assert.ok($('[data-book-lifecycle="unpublish"][data-book-id="BK-STATE-DEMO-5"]'));
assert.equal($('[data-book-lifecycle][data-book-id="BK-STATE-DEMO-7"]'),null);
assert.equal(run("applyBookLifecycle('BK-STATE-DEMO-5','delete')"),false);
assert.equal(run("applyBookLifecycle('BK-STATE-DEMO-5','unpublish')"),true);
assert.equal(run("bookPublicationStatus(data.books.find(b=>b.id==='BK-STATE-DEMO-5'))"),'已下架');assert.equal(run("bookPublishActionLabel(data.books.find(b=>b.id==='BK-STATE-DEMO-5'))"),'重新发布');assert.equal(run("bookTransition(data.books.find(b=>b.id==='BK-STATE-DEMO-5'),'relist')"),false);
assert.equal(run("applyBookLifecycle('BK-STATE-DEMO-5','delete')"),false);
assert.equal(run("bookPublicationRecords(bookFlow(data.books.find(b=>b.id==='BK-STATE-DEMO-5'))).length"),1);
assert.equal(run("bookTransition(data.books.find(b=>b.id==='BK-STATE-DEMO-5'),'publish')"),true);
assert.equal(run("bookPublicationRecords(bookFlow(data.books.find(b=>b.id==='BK-STATE-DEMO-5'))).length"),2);assert.equal(run("bookFlow(data.books.find(b=>b.id==='BK-STATE-DEMO-5')).history.at(-1).action"),'重新发布');assert.equal(run("bookPublicationStatus(data.books.find(b=>b.id==='BK-STATE-DEMO-5'))"),'基础发布');
const materials=run('Object.keys(bankData().materials).length');
assert.equal(run("applyBookLifecycle('BK-STATE-DEMO-1','delete')"),true);
assert.equal(run('Object.keys(bankData().materials).length'),materials);
run('ensureBookStateDemos()');assert.equal(run('data.books.filter(b=>b.demo).length'),9);
run("for(let i=0;i<25;i++)data.books.push({...structuredClone(data.books.find(b=>b.demo)),id:'PAGE-TEST-'+i,bookId:'PAGE-'+i,name:'分页测试 '+i});bookTableFilters[bookType]={};bookTablePages[bookType]={current:1,pageSize:10};renderBookWorkspace()");
assert.equal(w.document.querySelectorAll('.book-products-table .ant-table-row').length,10);assert.match($('#book-pagination').textContent,/10 条/);
$('#book-pagination .ant-pagination-item-2').click();assert.equal(run('bookTablePages[bookType].current'),2);assert.equal(w.document.querySelectorAll('.book-products-table .ant-table-row').length,10);
run("editorialQuery='分页测试';bookTableFilters[bookType]={version:['2026']};renderBookWorkspace()");$('#book-reset-filters').click();assert.equal(run('editorialQuery'),'');assert.equal(run('Object.keys(bookTableFilters[bookType]).length'),0);assert.equal(run('bookTablePages[bookType].current'),1);
$('#book-pagination .ant-select-selector').dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));await new Promise(r=>setTimeout(r,100));
assert.deepEqual([...w.document.querySelectorAll('.ant-select-item-option-content')].map(el=>el.textContent),['10 条/页','20 条/页','50 条/页']);
[...w.document.querySelectorAll('.ant-select-item-option')].find(el=>el.textContent.includes('20 条')).click();await new Promise(r=>setTimeout(r,30));assert.equal(run('bookTablePages[bookType].pageSize'),20);assert.equal(w.document.querySelectorAll('.book-products-table .ant-table-row').length,20);
console.log('PASS demo states, list columns, lifecycle guards, publication history, re-publishing and one-time seeding');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1})
