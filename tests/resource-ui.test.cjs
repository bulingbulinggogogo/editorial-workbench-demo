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
run("page='resource-suites';resourceTab='suites';render()");
assert.equal($('[data-resource-action=rules]'),null);
assert.ok($('[data-resource-action=view]'));assert.ok($('[data-resource-action=edit]'));assert.ok($('[data-resource-action=delete]').classList.contains('resource-danger'));
assert.ok($('.bank-reference-button').textContent.includes('1个资源包'));assert.ok($('.bank-reference-button').textContent.includes('2本书'));
$('.bank-reference-button').dispatchEvent(new w.MouseEvent('mouseover',{bubbles:true}));await new Promise(r=>setTimeout(r,300));
assert.ok($('.bank-reference-popover').textContent.includes('直接引用'));assert.ok($('.bank-reference-popover').textContent.includes('校本'));
w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await new Promise(r=>setTimeout(r,30));
$('[data-resource-action=view]').click();assert.equal($('.resource-title-input'),null);assert.equal($('[data-resource-action=pick]'),null);assert.equal($('[data-resource-action=new-question]'),null);assert.equal($('[data-resource-action=unlink]'),null);assert.equal($('[data-resource-action=up]'),null);assert.equal($('[data-resource-action=question]').textContent,'查看试题');
assert.ok(!$('#page').textContent.includes('编辑此内容会同步'));assert.equal($('[data-resource-action=copy]'),null);assert.equal($('[data-resource-action=rename]'),null);
$('[data-resource-action=back]').click();$('[data-resource-action=edit]').click();
const input=$('.resource-title-input');assert.ok(input);input.value='修改后的套题';input.dispatchEvent(new w.Event('blur'));assert.equal(run('resourceStore().suites["14136"].name'),'修改后的套题');
input.value='';input.dispatchEvent(new w.Event('blur'));assert.equal(input.value,'修改后的套题');input.value='放弃修改';input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(input.value,'修改后的套题');
assert.ok($('[data-resource-action=pick]'));assert.ok($('[data-resource-action=unlink]').classList.contains('resource-danger'));
run("resourceTrail=[];page='resource-packages';render()");$('[data-resource-action=view]').click();$('[data-resource-action=child]').click();assert.equal(run('resourceTrail.at(-1).mode'),'view');assert.equal($('[data-resource-action=pick]'),null);
console.log('PASS: clean UI, read-only viewing, inline name persistence/validation, red delete, reference popover and inherited view mode');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
