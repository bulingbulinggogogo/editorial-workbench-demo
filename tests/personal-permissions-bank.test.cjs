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

const legacy=JSON.parse(run('JSON.stringify(data)'));delete legacy.personalPermissionsOnly;
legacy.departmentPermissions={company:['books:0','books:1','books:2']};
const companyId=run('COMPANY_ID');legacy.departmentPermissions={[companyId]:['books:0','books:1','books:2']};
legacy.members[0].personalPermissionOverrides={'books:2':'deny'};
const migrationDom=new JSDOM(html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),{url:'https://migration.invalid',runScripts:'outside-only'});
migrationDom.window.structuredClone=structuredClone;migrationDom.window.matchMedia=w.matchMedia;
migrationDom.window.localStorage.setItem(run('KEY'),JSON.stringify(legacy));
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],migrationDom.getInternalVMContext());
const migrated=vm.runInContext("personalOverrides(data.members[0])",migrationDom.getInternalVMContext());
assert.equal(migrated['books:0'],'allow');assert.equal(migrated['books:1'],'allow');assert.equal(migrated['books:2'],undefined);
assert.equal(vm.runInContext('data.personalPermissionsOnly',migrationDom.getInternalVMContext()),true);
migrationDom.window.close();
assert.equal(w.document.querySelector('#permissions-subnav [data-page="roles"]'),null);
run("var pm=data.members[0];pm.personalPermissionOverrides={'books:0':'allow','books:1':'allow'};data.departmentPermissions[COMPANY_ID]=['vocabulary:0','vocabulary:1'];");
assert.equal(run("accountPermissions(pm).has('vocabulary:0')"),false);
run("page='permissions';render();editPersonalPermissions(pm.id)");
assert.equal($('#reset-personal-permissions'),null);
assert.ok(!$('#personal-permission-matrix').textContent.includes('部门'));
const original=run('JSON.stringify(pm.personalPermissionOverrides)');
$('[data-personal-grant="books:0"]').click();
assert.equal($('[data-personal-grant="books:1"]').checked,false);
run('closeDialog()');assert.equal(run('JSON.stringify(pm.personalPermissionOverrides)'),original);
run('editPersonalPermissions(pm.id)');
$('[data-personal-grant="vocabulary:1"]').click();
assert.equal($('[data-personal-grant="vocabulary:0"]').checked,true);
$('#save-personal-permissions').click();
assert.equal(run("accountPermissions(pm).has('vocabulary:1')"),true);
run("data.departmentPermissions={};pm.departments=[]");
assert.equal(run("accountPermissions(pm).has('vocabulary:1')"),true);
run("page='listening-bank';bankMaterialId=null;render()");
assert.equal($('#listening-basket'),null);
assert.equal($('.ant-table-selection-column'),null);
assert.ok($('[data-bank-view]'));
console.log('PASS personal direct permissions, dependency, save/cancel, independence from departments, bank controls removed');
}finally{await new Promise(r=>setTimeout(r,0));w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
