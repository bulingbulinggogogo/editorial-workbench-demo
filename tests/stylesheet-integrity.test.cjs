const fs=require('node:fs');
const assert=require('node:assert/strict');
const {transformSync}=require('esbuild');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const styles=[...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m=>m[1]);
for(const file of styles){
 const css=fs.readFileSync(file,'utf8');
 assert.equal(transformSync(css,{loader:'css',logLevel:'silent'}).warnings.length,0,`${file}: invalid CSS`);
}
const errors=[];
const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
const css=fs.readFileSync('listening-create.css','utf8');
const dom=new JSDOM(`<style>${css}</style><button class="directory-sort-handle"></button><span class="bank-script-excerpt">Long transcript</span>`,{virtualConsole});
try {
 assert.deepEqual(errors,[]);
 const w=dom.window;
 const handle=w.getComputedStyle(w.document.querySelector('button'));
 assert.equal(handle.borderTopWidth,'0px');
 assert.equal(handle.backgroundColor,'rgba(0, 0, 0, 0)');
 assert.equal(handle.cursor,'grab');
 const excerpt=w.getComputedStyle(w.document.querySelector('span'));
 assert.equal(excerpt.overflow,'hidden');
 assert.equal(excerpt.display,'-webkit-box');
 assert.equal(excerpt.getPropertyValue('-webkit-line-clamp'),'2');
 console.log('Stylesheets parse; drag handles and transcript clipping styles are intact.');
}finally{dom.window.close()}
