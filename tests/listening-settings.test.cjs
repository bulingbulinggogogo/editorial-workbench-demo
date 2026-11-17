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

try{
 run("page='listening-settings';render()");assert.ok($('#listening-nav-pages [data-page=listening-settings]'));assert.equal(w.document.querySelectorAll('[data-listening-dictionary]').length,3);
 const add=(key,parent,name)=>{run(`addListeningDictionary(${JSON.stringify(key)},${JSON.stringify(parent)})`);const form=$('#listening-dictionary-form');form.elements.name.value=name;form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
 add('examPoints',null,'测试一级考点');add('examPoints','测试一级考点','测试二级考点');
 assert.equal(run("listeningSecondaryValue('examPoints','测试一级考点','测试二级考点')"),'测试二级考点');assert.equal(run("listeningSecondaryValue('examPoints','地点与去向','测试二级考点')"),'');
 add('topics',null,'测试一级话题');add('topics','测试一级话题','测试二级话题');assert.ok(run("listeningTagTree('topics').find(n=>n.label==='测试一级话题').children.includes('测试二级话题')"));
 add('abilities',null,'测试能力');assert.ok(run("listeningTagChoices().abilities.includes('测试能力')"));
 add('abilities',null,'测试能力');assert.ok($('#listening-dictionary-error').textContent.includes('重复'));
 run("window.host=document.createElement('div');document.body.append(host);host.innerHTML=listeningHierarchySelect('topics','测试一级话题','测试二级话题','','');bindListeningHierarchies(host)");
 const parent=w.host.querySelector('[data-hierarchy-parent]'),child=w.host.querySelector('[data-hierarchy-child]');assert.equal(child.value,'测试二级话题');parent.value='旅行';parent.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(child.value,'');assert.ok([...child.options].some(o=>o.value==='行程安排'));assert.ok(![...child.options].some(o=>o.value==='测试二级话题'));w.BookUI.disposeHierarchies(w.host);w.host.remove();
 run("closeDialog();listeningSettingsTab='examPoints';renderListeningSettings()");
 assert.equal(w.document.querySelectorAll('.listening-dict-list').length,2);
 const findParent=name=>[...w.document.querySelectorAll('[data-dictionary-parent]')].find(el=>el.lastElementChild.textContent===name);
 findParent('测试一级考点').click();assert.ok(w.document.querySelectorAll('.listening-dict-list')[1].textContent.includes('测试二级考点'));
 findParent('地点与去向').click();assert.ok(!w.document.querySelectorAll('.listening-dict-list')[1].textContent.includes('测试二级考点'));assert.ok(w.document.querySelectorAll('.listening-dict-list')[1].textContent.includes('所在地点'));
 assert.equal($('.listening-dict-layout [draggable]'),null);assert.equal($('.listening-dict-layout [title]'),null);
 assert.ok($('#listening-dictionary-add').closest('header'));assert.ok($('#listening-dictionary-add-child').closest('header'));assert.equal($('.listening-dict-items .listening-dict-add'),null);
 $('#listening-dictionary-add-child').click();assert.equal($('#listening-dictionary-form').elements.parent.value,'地点与去向');run('closeDialog()');
 assert.ok(/^\d+$/.test(findParent('地点与去向').closest('.listening-dict-row').querySelector('.listening-dict-number').textContent));assert.equal($('.listening-dict-columns'),null);assert.equal($('.listening-dict-value'),null);
 findParent('地点与去向').closest('.listening-dict-row').querySelector('[data-dictionary-edit]').click();
 let form=$('.listening-dict-inline');form.querySelector('input').value='地点与方向';form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.ok(run("listeningTagTree('examPoints').some(n=>n.label==='地点与方向')"));assert.ok(!run("listeningTagTree('examPoints').some(n=>n.label==='地点与去向')"));
 assert.ok($('.listening-dict-history').textContent.includes(run('bookFlowActor()')));assert.ok(run("data.listeningDictionaryHistory.examPoints[0].detail.includes('地点与方向')"));
 assert.equal(run('data.listeningDictionaryHistory.topics.length'),2);
 $('#listening-dictionary-history').click();assert.ok(w.document.querySelector('.listening-dict-log').textContent.includes('地点与方向'));run('closeDialog()');
 const row=findParent('地点与方向').closest('.listening-dict-row');row.querySelector('[data-dictionary-toggle]').click();
 assert.equal(run("listeningDictionaryDisabled('examPoints','地点与方向')"),true);
 assert.equal(run("listeningSelectableTree('examPoints').find(n=>n.label==='地点与方向').disabled"),true);
 assert.equal(run("listeningSecondaryValue('examPoints','地点与方向','所在地点')"),'所在地点');
 assert.ok(run("listeningHierarchySelect('examPoints','地点与方向','所在地点','','')").includes('selected disabled'));
 findParent('地点与方向').closest('.listening-dict-row').querySelector('[data-dictionary-toggle]').click();
 assert.equal(run("listeningDictionaryDisabled('examPoints','地点与方向')"),false);
 w.document.querySelectorAll('.listening-dict-list')[1].querySelector('[data-dictionary-toggle]').click();
 assert.equal(run("listeningDictionaryDisabled('examPoints','所在地点','地点与方向')"),true);
 assert.ok(run("listeningSelectableTree('examPoints').find(n=>n.label==='地点与方向').disabledChildren.includes('所在地点')"));
 run("listeningSettingsTab='abilities';renderListeningSettings()");$('.listening-dict-status').click();
 assert.equal(run("listeningDictionaryDisabled('abilities',listeningTagChoices().abilities[0])"),true);
 assert.ok(run("data.listeningDictionaryHistory.abilities[0].detail.startsWith('停用')"));
 assert.ok(!$('.listening-settings').textContent.includes('删除'));
 console.log('PASS settings tabs, primary/secondary additions, parent scope, shared choices and duplicate validation');
}finally{w.close()}
