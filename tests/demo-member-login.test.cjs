const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync('index.html','utf8');
function setup(html,url){const vc=new VirtualConsole();const errors=[];vc.on('jsdomError',e=>{if(!/stylesheet|navigation/.test(e.message))errors.push(e.message)});const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;w.structuredClone=structuredClone;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};const ctx=dom.getInternalVMContext();return {dom,w,doc:w.document,run:s=>vm.runInContext(s,ctx),errors}}
// Styles inside app-bootstrap are inert: boot only executes its scripts.
const shell=new JSDOM(source);const catalogStyles=shell.window.document.querySelector('head link[href="vocabulary-catalog.css"]');assert.ok(catalogStyles,'catalog styles must load outside the inert bootstrap template');assert.equal(shell.window.document.querySelector('#app-bootstrap').content.querySelector('link[href="vocabulary-catalog.css"]'),null);shell.window.close();
const main=setup(source.replace(/<script[^>]*>[\s\S]*?<\/script>/g,''),'https://test.invalid');main.run(source.match(/<script>([\s\S]*?)<\/script>/)[1]);for(const match of source.matchAll(/<script src="([^"]+)"/g))if(match[1]!=='app-storage.js')main.run(fs.readFileSync(match[1],'utf8'));

const q=s=>main.doc.querySelector(s);
function login(account,password='123456'){q('#account').value=account;q('#password').value=password;q('#login-form').dispatchEvent(new main.w.Event('submit',{bubbles:true,cancelable:true}))}
login('sunying');assert.equal(q('#current-account').textContent,'孙颖');assert.equal(q('#app').hidden,false);assert.equal(main.run("catalogInGroup('听力')"),true);assert.equal(main.run("catalogInGroup('词库')"),false);assert.equal(main.run('canPublishWorkspace()'),false);
q('#logout').click();q('#confirm-logout').click();assert.equal(q('#login').hidden,false);
login('chaitian');assert.equal(q('#current-account').textContent,'柴田');assert.equal(main.run("catalogInGroup('词库')"),true);assert.equal(main.run('canPublishWorkspace()'),false);
main.run("data.vocabularyCatalogReview={'90001':{status:'pending'}}");assert.equal(main.run("catalogCanReview(catalogEntries().find(e=>e.id==='90001'))"),true);
q('#logout').click();q('#confirm-logout').click();login('sunying','wrong');assert.equal(q('#login').hidden,false);assert.equal(q('#login-error').textContent,'账号或密码不正确');
main.run("data.members.find(m=>m.name==='孙颖').status='已禁用'");login('sunying');assert.equal(q('#login').hidden,false);assert.ok(q('#login-error').textContent.includes('已禁用'));
login('baokeyu');assert.equal(q('#current-account').textContent,'baokeyu');assert.equal(main.run('canPublishWorkspace()'),true);
main.w.BookUI.disposeHierarchies(main.doc.body);main.w.BookUI.disposeSelects();main.dom.window.close();console.log('PASS demo login: listening and vocabulary identities, review/publish roles, logout, wrong password, disabled account, existing login');
