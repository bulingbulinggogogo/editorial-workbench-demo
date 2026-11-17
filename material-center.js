'use strict';
// Shared material library and legacy sample media.
const materialCenterSamples=[
 {id:'MC-001',name:'zd_record',references:['record','present1'],category:'语音指导音频',format:'AAC',duration:'00:32',size:'256 KB'},
 {id:'MC-002',name:'听力微技能：捕捉关键词',references:[],category:'微技能视频',format:'MP4',duration:'02:15',size:'18.6 MB'}
];
let materialCenterCategories=[],materialCenterQuery='';
titles['material-center']='素材中心';
const materialCenterNav=document.createElement('button');
materialCenterNav.dataset.page='material-center';
materialCenterNav.innerHTML=icon('grid')+'素材中心';
document.querySelector('#sidebar [data-page="dashboard"]').after(materialCenterNav);
materialCenterNav.onclick=()=>{page='material-center';closeMenu();render()};
function renderMaterialCenter(){
 const root=$('#page');
 root.innerHTML=`<section class="page-head"><h1>素材中心</h1><span class="muted">${materialCenterItems().length} 个素材</span></section><section class="panel material-center"><div class="toolbar"><label class="search">${icon('search')}<input id="material-center-search" aria-label="搜索素材" placeholder="搜索素材名称" value="${esc(materialCenterQuery)}"></label><button class="btn primary" id="material-audio-library">基础词库音频 · 上传</button></div><div id="material-center-results"></div></section>`;
 $('#material-center-search').oninput=e=>{materialCenterQuery=e.target.value;renderMaterialCenterRows()};
 $('#material-audio-library').onclick=()=>openVocabularyAudioLibrary(()=>{materialCenterCategories=['基础词库音频'];renderMaterialCenter()});
 renderMaterialCenterRows();
}
function renderMaterialCenterRows(){
 const q=materialCenterQuery.trim().toLowerCase();
 const rows=materialCenterItems().filter(item=>(!materialCenterCategories.length||materialCenterCategories.includes(item.category))&&(!q||item.name.toLowerCase().includes(q)));
 $('#material-center-results').innerHTML=`<div class="table-scroll"><table><thead><tr><th>素材名称</th><th id="material-type-heading">类型</th><th>扩展名</th><th>引用</th><th>时长</th><th>大小</th><th>操作</th></tr></thead><tbody>${rows.map(item=>`<tr><td class="material-center-name">${esc(item.name)}</td><td>${esc(item.category)}</td><td>${item.format?'.'+esc(item.format.toLowerCase()):'—'}</td><td>${item.references.length?`<button class="linkbtn" data-material-references="${item.id}" aria-label="查看${esc(item.name)}的引用">${item.references.length}</button>`:'<span class="muted">0</span>'}</td><td>${item.duration}</td><td>${item.size}</td><td class="material-center-actions"><button class="linkbtn" data-material-preview="${item.id}">查看</button>${item.basicAudio?'':`<button class="linkbtn" data-material-replace="${item.id}">替换</button><button class="linkbtn material-delete" data-material-delete="${item.id}" ${item.references.length?'disabled aria-label="已被引用，不能删除"':''}>删除</button>`}</td></tr>`).join('')||'<tr><td colspan="7"><div class="empty">暂无匹配素材</div></td></tr>'}</tbody></table></div>`;
 bindMaterialTypeFilter();
 const itemFor=id=>materialCenterItems().find(item=>item.id===id);
 document.querySelectorAll('[data-material-preview]').forEach(button=>button.onclick=()=>{const item=itemFor(button.dataset.materialPreview);if(item.basicAudio){previewVocabularyAudio(item);return}openDialog('查看素材',`<div class="material-center-preview"><strong>${esc(item.name)}</strong><span class="muted">${item.duration} · ${item.size}</span><p class="muted">素材预览占位</p></div>`,'<button class="btn" data-close>关闭</button>')});
 document.querySelectorAll('[data-material-references]').forEach(button=>button.onclick=()=>{const item=itemFor(button.dataset.materialReferences);BookUI.openReferenceDrawer({subject:item.name,rows:item.references.map((name,i)=>({key:String(i),type:'基础词库',name,relation:'素材引用',versionText:'版本未记录'}))})});
 document.querySelectorAll('[data-material-replace]').forEach(button=>button.onclick=()=>{const item=itemFor(button.dataset.materialReplace);openDialog('替换素材',`<form id="material-replace-form"><p>${esc(item.name)}</p><label class="field"><span>选择替换文件</span><input type="file" id="material-replace-file" accept="${item.category==='语音指导音频'?'audio/*':'video/*'}" required></label><p class="muted">占位演示，仅更新列表信息，保留原有引用。</p></form>`,'<button class="btn" data-close>取消</button><button class="btn primary" form="material-replace-form" type="submit">确认替换</button>');$('#material-replace-form').onsubmit=e=>{e.preventDefault();const file=$('#material-replace-file').files[0];if(!file)return;item.name=file.name.replace(/\.[^.]+$/,'');item.format=(file.name.match(/\.([^.]+)$/)?.[1]||'').toUpperCase();item.size=file.size>=1048576?(file.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(file.size/1024))+' KB';item.duration='—';$('#dialog').close();renderMaterialCenter()}});
 document.querySelectorAll('[data-material-delete]').forEach(button=>button.onclick=()=>{const item=itemFor(button.dataset.materialDelete);if(!item||item.references.length)return;openDialog('删除素材',`<p>确认删除“${esc(item.name)}”？</p>`,'<button class="btn" data-close>取消</button><button class="btn danger" id="material-delete-confirm">删除</button>');$('#material-delete-confirm').onclick=()=>{if(item.references.length)return;materialCenterSamples.splice(materialCenterSamples.indexOf(item),1);$('#dialog').close();renderMaterialCenter()}});
}

function vocabularyAudioLibrary(){
 const assets=new Map();
 for(const entry of catalogEntries()){
  const model=catalogModel(entry);
  for(const obj of [...model.positions,...model.words]){
   for(const key of model.positions.includes(obj)?['E','G']:['L']){
    const raw=obj[key];if(!raw)continue;
    const name=String(raw).split(/[\\/]/).pop();
    if(!assets.has(name))assets.set(name,{id:'vocab-audio:'+name,name,category:'基础词库音频',format:'AAC',duration:'—',size:'—',references:[],basicAudio:true});
    const item=assets.get(name);if(!item.references.includes(entry.word))item.references.push(entry.word);
    if(obj._audio?.[key]?.data)item.inlineData=obj._audio[key].data;
    if(obj._audio?.[key]?.assetId)item.assetId=obj._audio[key].assetId;
   }
  }
 }
 for(const saved of data.basicVocabularyAudio||[]){
  const previous=assets.get(saved.name);
  assets.set(saved.name,{...saved,references:previous?.references||[],category:'基础词库音频',basicAudio:true,format:'AAC',duration:'—'});
 }
 return [...assets.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
function materialCenterItems(){return [...materialCenterSamples,...vocabularyAudioLibrary()]}
async function storeVocabularyAudio(file){
 if(!file||!file.size||file.size>2*1024*1024||!/\.aac$/i.test(file.name))throw Error('请选择不超过 2 MB 的 AAC 音频文件');
 if(vocabularyAudioLibrary().some(a=>a.name.toLowerCase()===file.name.toLowerCase()&&(a.assetId||a.inlineData)))throw Error('同名音频已存在，请选择已有音频或修改文件名后上传');
 const assetId='VOCAB-AUDIO-'+crypto.randomUUID();
 await audioFileStore(assetId,file);
 const item={id:assetId,assetId,name:file.name,size:Math.max(1,Math.round(file.size/1024))+' KB'};
 if(!commitWorkspace(d=>{d.basicVocabularyAudio||=[];d.basicVocabularyAudio.push(item)}))throw Error('音频信息保存失败，请重试');
 return item;
}
async function vocabularyAudioBlob(item){
 if(item.assetId){const blob=await audioFileStore(item.assetId);if(blob)return blob}
 if(item.inlineData)return await (await fetch(item.inlineData)).blob();
 return null;
}
async function previewVocabularyAudio(item){
 try{
  const blob=await vocabularyAudioBlob(item);if(!blob){toast('此素材仅有文件名记录，尚未载入音频文件');return}
  const url=URL.createObjectURL(blob);
  openDialog('音频预览',`<p>${esc(item.name)}</p><audio controls src="${esc(url)}"></audio>`,'<button class="btn" data-close>关闭</button>');
  $('#dialog').addEventListener('close',()=>URL.revokeObjectURL(url),{once:true});
 }catch(error){toast(error.message)}
}
function openVocabularyAudioLibrary(onSelect,current=''){
 openDialog('素材中心 · 基础词库音频',`<div class="toolbar"><label class="search"><input id="vocabulary-audio-search" aria-label="搜索音频文件名" placeholder="搜索音频文件名"></label><label class="btn primary">上传新音频<input hidden type="file" accept=".aac,audio/aac" id="vocabulary-audio-upload"></label></div><p class="muted">AAC 文件，最大 2 MB</p><p id="vocabulary-audio-error" class="error" role="alert"></p><div id="vocabulary-audio-results"></div>`,'<button class="btn" data-close>取消</button>');
 const root=$('#dialog'),search=$('#vocabulary-audio-search'),upload=$('#vocabulary-audio-upload'),error=$('#vocabulary-audio-error'),results=$('#vocabulary-audio-results');
 function select(item){closeDialog();onSelect(item)}
 function draw(){
  const rows=vocabularyAudioLibrary().filter(a=>a.name.toLowerCase().includes(search.value.trim().toLowerCase()));
  results.innerHTML=`<div class="table-scroll" style="max-height:420px;overflow:auto"><table><thead><tr><th>音频文件名</th><th>大小</th><th>操作</th></tr></thead><tbody>${rows.map((a,i)=>`<tr><td>${esc(a.name)}</td><td>${esc(a.size)}</td><td><button class="btn primary" data-vocab-audio-pick="${i}" ${a.name===current?'disabled':''}>${a.name===current?'已选择':'选择'}</button></td></tr>`).join('')||'<tr><td colspan="3">暂无匹配音频，可上传新音频</td></tr>'}</tbody></table></div>`;
  results.querySelectorAll('[data-vocab-audio-pick]').forEach(b=>b.onclick=()=>select(rows[Number(b.dataset.vocabAudioPick)]));
 }
 search.oninput=draw;
 upload.onchange=async()=>{
  const file=upload.files?.[0];if(!file)return;upload.disabled=true;error.textContent='';
  try{const item=await storeVocabularyAudio(file);if(root.open&&root.contains(results)){search.value=item.name;draw()}}
  catch(e){if(root.contains(error))error.textContent=e.message}
  finally{upload.disabled=false;upload.value=''}
 };
 draw();search.focus();
}

function bindMaterialTypeFilter(){
 const heading=$('#material-type-heading');
 const categories=[...new Set(materialCenterItems().map(item=>item.category))];
 heading.innerHTML=`<div class="catalog-status-heading"><span>类型</span><button type="button" id="material-type-filter" class="catalog-filter-button ${materialCenterCategories.length?'active':''}" aria-label="筛选素材类型" aria-expanded="false"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h18l-7 8v7l-4 2v-9z"/></svg></button></div><div id="material-type-panel" class="catalog-status-panel" popover="auto"><form id="material-type-form"><fieldset><legend>类型</legend><label class="catalog-review-option"><input id="material-type-all" type="checkbox" ${materialCenterCategories.length?'':'checked'}><span>全部</span></label>${categories.map(category=>`<label class="catalog-review-option"><input type="checkbox" name="category" value="${esc(category)}" ${materialCenterCategories.includes(category)?'checked':''}><span>${esc(category)}</span></label>`).join('')}</fieldset><div class="catalog-filter-actions"><button type="button" class="btn" id="material-type-reset">重置</button><button type="submit" class="btn primary">确定</button></div></form></div>`;
 const button=$('#material-type-filter'),panel=$('#material-type-panel'),all=$('#material-type-all'),options=[...panel.querySelectorAll('[name=category]')];
 button.onclick=()=>{const rect=button.getBoundingClientRect();panel.style.left=Math.max(12,Math.min(rect.right-320,innerWidth-332))+'px';panel.style.top=Math.max(12,Math.min(rect.bottom+8,innerHeight-360))+'px';panel.togglePopover()};
 panel.addEventListener('toggle',event=>button.setAttribute('aria-expanded',String(event.newState==='open')));
 all.onchange=()=>{options.forEach(option=>option.checked=false);all.checked=true};
 options.forEach(option=>option.onchange=()=>{all.checked=!options.some(input=>input.checked)});
 $('#material-type-form').onsubmit=event=>{event.preventDefault();materialCenterCategories=options.filter(option=>option.checked).map(option=>option.value);renderMaterialCenterRows()};
 $('#material-type-reset').onclick=()=>{materialCenterCategories=[];renderMaterialCenterRows()};
}
