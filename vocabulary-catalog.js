'use strict';
let vocabularyCatalogTab='word';
const catalogStatusFilters={word:{},chunk:{}};
function catalogMatchesStatus(entry){const filters=catalogStatusFilters[entry.entryType]||{};if(filters.review&&filters.review!==(catalogPending(entry)?'pending':'clear'))return false;return catalogSectionStatus(entry).every(item=>!filters[item.label]||filters[item.label]===item.status)}
function catalogMember(){const account=bookFlowActor();return data.members.find(m=>[m.id,m.name,m.account,m.username,m.phone].includes(account))}
function catalogInGroup(name){const member=catalogMember();return !!member&&(member.departments||[]).some(id=>data.departments.some(d=>d.id===id&&[name,name+'组'].includes(d.name)))}
function catalogPending(entry){return data.vocabularyCatalogReview?.[entry.id]?.status==='pending'}
function catalogCanReview(entry){return catalogPending(entry)&&catalogInGroup('词库')}
function catalogEntries(){return [...VocabularyCatalog.entries,...Object.values(data.vocabularyCatalogExtra||{})].filter(e=>!(data.vocabularyCatalogDeleted||[]).includes(e.id))}
function catalogModel(entry){const result=data.vocabularyCatalogEdits?.[entry.id]||{word:entry.word,words:structuredClone(entry.words),positions:structuredClone(entry.positions),meanings:entry.meanings.map(m=>({...structuredClone(m),examples:[],chunks:[]})),exampleRevision:1,wordAttributesRevision:1};return {...result,meanings:result.meanings.map(m=>({...m,meaningId:catalogMeaningId(m.meaningId||entry.meanings.find(x=>x.row===m.row)?.meaningId)}))}}
function catalogAudit(entry){return data.vocabularyCatalogAudit?.[entry.id]||data.operationAudit?.[JSON.stringify(['vocabularyCatalogEdits',entry.id])]||null}
function catalogName(entry){return catalogModel(entry).words[0].displayWord||entry.word}
function catalogSectionStatus(entry){
 const m=catalogModel(entry),w=m.words[0]||{},meanings=m.meanings||[];
 const filled=v=>String(v??'').trim().length>0;
 const status=(label,values)=>{const count=values.filter(filled).length;return {label,status:values.length&&count===values.length?'已填写':'未填写',tone:values.length&&count===values.length?'is-complete':'needs-content'}};
 const optional=Object.keys(w).filter(k=>/^[B-Z]$/.test(k)&&(!w._sourceBlank?.includes(k)||filled(w[k])));
 const items=[status('基础属性',[w.displayWord,...(entry.entryType==='chunk'?[w.chunkType]:[]),...optional.map(k=>w[k])])];
 if(entry.entryType==='word')items.push(status('音标音频',(m.positions||[]).flatMap(p=>['D','E','F','G'].map(k=>p[k]))));
 items.push(status('释义',meanings.flatMap(x=>filled(x.AG)||filled(x.AH)?[x.AG,x.AH]:[x.O])));
 const chunks=[...(m.wordChunks||[]),...meanings.flatMap(x=>[...(filled(x.AG)||filled(x.AH)?[{word:x.AG,meaning:x.AH}]:[]),...(x.chunks||[])])];
 items.push(status('词块',chunks.flatMap(c=>[c.word,c.meaning])));
 return items;
}

function catalogCanPublish(entry){return !catalogPending(entry)&&catalogSectionStatus(entry).slice(0,3).every(item=>item.tone==='is-complete')}

function catalogHeader(){
 return `<section class="page-head vocabulary-catalog-heading"><div class="page-title-row listening-vocabulary-heading"><h1>基础词库</h1><div class="tabs vocabulary-catalog-tabs listening-vocabulary-tabs" role="tablist" aria-label="词条类型">${[['word','单词'],['chunk','词块'],['publish','发布']].map(([key,label])=>`<button class="tab ${vocabularyCatalogTab===key?'active':''}" role="tab" aria-selected="${vocabularyCatalogTab===key}" data-catalog-tab="${key}">${label}${key==='publish'?'':` <span>${catalogEntries().filter(e=>e.entryType===key).length}</span>`}</button>`).join('')}</div></div></section>`;
}
function bindCatalogTabs(){document.querySelectorAll('[data-catalog-tab]').forEach(b=>b.onclick=()=>{vocabularyCatalogTab=b.dataset.catalogTab;editorialQuery='';renderVocabulary()})}
function ensureCatalogPublicationExample(){
 if(data.vocabularyPublicationExampleVersion===1){commitWorkspace(d=>{for(const r of d.vocabularyPublications||[])if(r.builtIn)r.actor=r.version===1?'鲍科羽':'陈浩杰';if(d.vocabularyPublishedSnapshot?.builtIn)d.vocabularyPublishedSnapshot.actor='陈浩杰';d.vocabularyPublicationExampleVersion=2})}
 if(data.vocabularyPublicationExampleVersion||(data.vocabularyPublications||[]).length)return;
 const entries=VocabularyCatalog.entries.map(entry=>({id:entry.id,entryType:entry.entryType,model:{word:entry.word,words:structuredClone(entry.words),positions:structuredClone(entry.positions),meanings:entry.meanings.map(m=>({...structuredClone(m),meaningId:catalogMeaningId(m.meaningId),examples:[],chunks:[]})),exampleRevision:1,wordAttributesRevision:1}}));
 const counts={words:entries.filter(e=>e.entryType==='word').length,chunks:entries.filter(e=>e.entryType==='chunk').length};
 const records=[{version:1,at:'2026-11-13T10:00:00+08:00',actor:'鲍科羽',...counts,note:'基础词库首次发布（内置示例）',builtIn:true},{version:2,at:'2026-11-16T09:30:00+08:00',actor:'陈浩杰',...counts,note:'单词与词块内容更新（内置示例）',builtIn:true}];
 commitWorkspace(d=>{d.vocabularyPublications=records;d.vocabularyPublishedSnapshot||={...records[1],entries};d.vocabularyPublicationExampleVersion=2});
}
function renderCatalogPublication(){
 ensureCatalogPublicationExample();
 const records=data.vocabularyPublications||[];
 $('#page').innerHTML=catalogHeader()+`<section class="panel book-status-maintenance catalog-publication-panel"><div class="book-status-heading"><h3>发布明细</h3><button class="btn publish-action" id="catalog-publish" ${canPublishWorkspace()?'':'disabled'}>发布</button></div>${records.length?`<div class="school-publication-scroll" tabindex="0" role="region" aria-label="词库发布记录时间线"><ol class="school-publication-timeline">${[...records].reverse().map((record,i)=>`<li class="${i===0?'is-latest':''}"><span class="publication-timeline-dot" aria-hidden="true"></span><div class="publication-timeline-entry"><div class="publication-timeline-heading"><strong>第 ${record.version} 次发布</strong>${i===0?'<span class="publication-latest-label">最近一次</span>':''}</div><time datetime="${esc(record.at)}">${esc(bookFlowTime(record.at))}</time><span class="publication-timeline-actor">发布人：${esc(record.actor)}</span><span>单词 ${record.words} · 词块 ${record.chunks}</span>${record.note?`<p>${esc(record.note)}</p>`:''}</div></li>`).join('')}</ol></div>`:'<p class="muted">暂无发布记录</p>'}</section>`;
 bindCatalogTabs();
 $('#catalog-publish').onclick=()=>{
  if(!requirePublishingPermission())return;
  openDialog('发布基础词库','<p>仅发布不在待审核状态且前三项状态均已完成的单词和词块。</p><label class="field"><span>发布说明（选填）</span><textarea class="input" id="catalog-publication-note" rows="3"></textarea></label>','<button class="btn" data-close>取消</button><button class="btn publish-action" id="catalog-confirm-publish">确认发布</button>');
  $('#catalog-confirm-publish').onclick=()=>{
   if(!requirePublishingPermission())return;
   const entries=catalogEntries().filter(catalogCanPublish),snapshot=entries.map(entry=>({id:entry.id,entryType:entry.entryType,model:structuredClone(catalogModel(entry))}));
   if(!snapshot.length){toast('暂无可发布词条');return}
   const record={version:(data.vocabularyPublications||[]).length+1,at:new Date().toISOString(),actor:bookFlowActor(),words:entries.filter(e=>e.entryType==='word').length,chunks:entries.filter(e=>e.entryType==='chunk').length,note:$('#catalog-publication-note').value.trim()};
   if(commitWorkspace(d=>{d.vocabularyPublications||=[];d.vocabularyPublications.push(record);d.vocabularyPublishedSnapshot={...record,entries:snapshot}})){closeDialog();renderVocabulary();toast('词库已发布')}
  };
 };
}

renderVocabulary=function(){
 BookUI.disposeHierarchies($('#page'));
 if(vocabularyCatalogTab==='publish'){renderCatalogPublication();return}
 const query=editorialQuery.trim().toLowerCase();const entries=catalogEntries().filter(e=>e.entryType===vocabularyCatalogTab);const rows=entries.filter(e=>catalogMatchesStatus(e)&&(e.id+' '+catalogName(e)+' '+catalogModel(e).meanings.map(m=>m.O||m.AH).join(' ')).toLowerCase().includes(query));
 $('#page').innerHTML=catalogHeader()+`<section class="panel vocabulary-catalog-list"><div class="toolbar"><form id="catalog-search-form" class="catalog-search-form"><input id="word-search" class="input" aria-label="搜索词条" placeholder="搜索${vocabularyCatalogTab==='word'?'单词':'词块'}、释义或 ID" value="${esc(editorialQuery)}"><button class="btn primary" type="submit">搜索</button></form><button class="btn primary" id="catalog-new">新增${vocabularyCatalogTab==='word'?'单词':'词块'}</button></div>${resourceTable(['单词 ID','单词',...(vocabularyCatalogTab==='chunk'?['词块类型']:[]),'状态','待审核','操作'],rows.map(e=>[esc(e.id),esc(catalogName(e)),...(vocabularyCatalogTab==='chunk'?[esc(catalogModel(e).words[0].chunkType||e.chunkType||'—')]:[]),`<span data-catalog-status="${e.id}"></span>`,catalogPending(e)?'<span class="catalog-review-pending">待审核</span>':'<span class="muted">—</span>',`<button class="linkbtn" data-catalog-view="${e.id}">查看</button><button class="linkbtn" data-catalog-open="${e.id}">修改词条</button><button class="linkbtn resource-danger" data-catalog-delete="${e.id}" ${vocabularyReferenceCount(e.id)?'disabled':''}>删除</button>`]))}${!rows.length?'<p class="muted catalog-empty">暂无词条</p>':''}</section>`;
 bindCatalogStatusFilter();
 bindCatalogReviewFilter();
 document.querySelectorAll('[data-catalog-status]').forEach(host=>BookUI.renderVocabularyStatus(host,catalogSectionStatus(entries.find(e=>e.id===host.dataset.catalogStatus))));
 $('#catalog-search-form').onsubmit=e=>{e.preventDefault();editorialQuery=$('#word-search').value;renderVocabulary()};
 bindCatalogTabs();
 document.querySelectorAll('[data-catalog-view]').forEach(b=>b.onclick=()=>openCatalogEditor(catalogEntries().find(e=>e.id===b.dataset.catalogView),true));
 document.querySelectorAll('[data-catalog-open]').forEach(b=>b.onclick=()=>openCatalogEditor(catalogEntries().find(e=>e.id===b.dataset.catalogOpen)));
 document.querySelectorAll('[data-catalog-delete]').forEach(b=>b.onclick=()=>{const entry=catalogEntries().find(e=>e.id===b.dataset.catalogDelete);if(vocabularyReferenceCount(entry.id))return;openDialog('删除词条',`<p>确认删除 ${esc(catalogName(entry))}？</p>`,'<button class="btn" data-close>取消</button><button class="btn danger" id="catalog-confirm-delete">删除</button>');$('#catalog-confirm-delete').onclick=()=>{if(vocabularyReferenceCount(entry.id)){toast('词条已被引用，不能删除');return}if(commitWorkspace(d=>{d.vocabularyCatalogDeleted||=[];d.vocabularyCatalogDeleted.push(entry.id)})){closeDialog();renderVocabulary()}}});
 $('#catalog-new').onclick=()=>{const id=String(Math.max(90200,...VocabularyCatalog.entries.map(e=>Number(e.id)),...Object.keys(data.vocabularyCatalogExtra||{}).map(Number),...(data.vocabularyCatalogDeleted||[]).map(Number))+1),type=vocabularyCatalogTab;openCatalogEditor({id,word:id,entryType:type,chunkType:type==='chunk'?'短语动词':undefined,words:[{A:id,row:'new-'+id,displayWord:'',...(type==='chunk'?{chunkType:'短语动词'}:{})}],positions:[],meanings:[],fresh:true})};
};
function openCatalogEditor(entry,readOnly=false){
 const frame=document.createElement('iframe');frame.className='vocabulary-editor-frame';frame.setAttribute('aria-label',(readOnly?'查看词条 ':'修改词条 ')+catalogName(entry));frame.src='examples/present-editor/index.html?entry='+encodeURIComponent(entry.id)+(readOnly?'&mode=view':'')+(entry.fresh?'&fresh=1&kind='+entry.entryType:'');
 const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.append(frame);
 function close(){window.removeEventListener('message',receive);frame.remove();document.body.style.overflow=previousOverflow;renderVocabulary()}
 frame.onload=()=>frame.contentWindow.postMessage({type:'vocabulary:init',entryId:entry.id,model:catalogModel(entry),audit:catalogAudit(entry),pending:catalogPending(entry),canReview:!readOnly&&catalogCanReview(entry),guidanceWords:catalogEntries().flatMap(e=>catalogModel(e).words)},'*');
 function receive(event){if(event.source!==frame.contentWindow||event.data?.entryId!==entry.id)return;const msg=event.data;
 if(msg.type==='vocabulary:close'){close();return}
 if(msg.type==='vocabulary:audio-select'&&!readOnly){
 openVocabularyAudioLibrary(item=>{if(frame.isConnected)frame.contentWindow.postMessage({type:'vocabulary:audio-selected',entryId:entry.id,requestId:msg.requestId,item:{name:item.name,assetId:item.assetId||'',data:item.inlineData||''}},'*')},msg.current||'');return;
}
if(msg.type==='vocabulary:audio-play'){
 const item=vocabularyAudioLibrary().find(a=>a.name===msg.name);
 if(item)vocabularyAudioBlob(item).then(blob=>{if(frame.isConnected)frame.contentWindow.postMessage({type:'vocabulary:audio-blob',entryId:entry.id,blob},'*')}).catch(()=>{if(frame.isConnected)frame.contentWindow.postMessage({type:'vocabulary:audio-blob',entryId:entry.id,blob:null},'*')});
 else frame.contentWindow.postMessage({type:'vocabulary:audio-blob',entryId:entry.id,blob:null},'*');
 return;
}
if(readOnly||msg.type!=='vocabulary:save')return;
 if(msg.approve&&!catalogCanReview(entry)){frame.contentWindow.postMessage({type:'vocabulary:error',entryId:entry.id},'*');return}
 const m=msg.model;if(!m?.words?.[0]?.displayWord?.trim()||!Array.isArray(m.meanings)||!Array.isArray(m.positions)){frame.contentWindow.postMessage({type:'vocabulary:error',entryId:entry.id},'*');return}
 if(entry.entryType==='chunk'){m.positions=[];for(const meaning of m.meanings)meaning.I=''}
 if(entry.entryType==='word'&&(!m.positions.length||m.positions.some(p=>['D','E','F','G'].some(k=>!String(p[k]??'').trim())))){frame.contentWindow.postMessage({type:'vocabulary:error',entryId:entry.id},'*');toast('请填写各词性的英美音标和发音音频');return}
 let nextMeaning=Math.max(Number(vocabularyNextId('meanings')),Number(catalogMeaningId(data.vocabularyMeaningNext))||10000);for(const meaning of m.meanings){if(meaning.meaningId)meaning.meaningId=catalogMeaningId(meaning.meaningId);else{if(nextMeaning>99999){toast('五位释义 ID 已用尽');return false}meaning.meaningId=String(nextMeaning++);}}
 const audit={actor:bookFlowActor(),at:new Date().toISOString()};
 const ok=commitWorkspace(d=>{d.vocabularyCatalogReview||={};const previous=d.vocabularyCatalogReview[entry.id];const isNew=entry.fresh&&!d.vocabularyCatalogExtra?.[entry.id];if(isNew&&!catalogInGroup('词库'))d.vocabularyCatalogReview[entry.id]={origin:'external',status:'pending',creatorId:catalogMember()?.id,createdAt:audit.at};else if(['listening','external'].includes(previous?.origin)&&!catalogInGroup('词库'))previous.status='pending';if(msg.approve)d.vocabularyCatalogReview[entry.id]={...d.vocabularyCatalogReview[entry.id],status:'approved',reviewerId:catalogMember()?.id,reviewedBy:audit.actor,reviewedAt:audit.at};d.vocabularyMeaningNext=nextMeaning;d.vocabularyCatalogAudit||={};d.vocabularyCatalogAudit[entry.id]=audit;d.vocabularyCatalogEdits||={};d.vocabularyCatalogEdits[entry.id]=m;if(entry.fresh){d.vocabularyCatalogExtra||={};d.vocabularyCatalogExtra[entry.id]=entry}d.vocabularyEdits||={};for(const kind of ['words','positions','meanings'])d.vocabularyEdits[kind]||={};for(const kind of ['positions','meanings'])for(const key of Object.keys(d.vocabularyEdits[kind]))if(key.startsWith('catalog:'+entry.id+':')||d.vocabularyEdits[kind][key].wordId===entry.id)delete d.vocabularyEdits[kind][key];d.vocabularyEdits.words[entry.id]={id:entry.id,word:m.words[0].displayWord,entryType:entry.entryType};for(const p of m.positions)d.vocabularyEdits.positions['catalog:'+entry.id+':'+p.row]={id:'catalog:'+entry.id+':'+p.row,wordId:entry.id,word:m.words[0].displayWord,label:p.C,ukIPA:p.D,usIPA:p.F};for(const meaning of m.meanings){const p=m.positions.find(p=>p.C===meaning.I);const id=meaning.meaningId;d.vocabularyEdits.meanings[id]={id,wordId:entry.id,word:m.words[0].displayWord,posId:p?'catalog:'+entry.id+':'+p.row:'',posLabel:meaning.I,chinese:meaning.O,english:meaning.Y,chunk:meaning.AG,chunkChinese:meaning.AH}}});
 frame.contentWindow.postMessage({type:ok?'vocabulary:saved':'vocabulary:error',entryId:entry.id,pending:catalogPending(entry),canReview:!readOnly&&catalogCanReview(entry),audit:ok?audit:null,model:ok?m:null},'*');
 }
 window.addEventListener('message',receive);
}

function bindCatalogStatusFilter(){
 const heading=document.querySelector('.vocabulary-catalog-list th:nth-last-child(3)');
 const filters=catalogStatusFilters[vocabularyCatalogTab],labels=['基础属性',...(vocabularyCatalogTab==='word'?['音标音频']:[]),'释义','词块'];
 const count=labels.filter(label=>filters[label]).length;
 heading.innerHTML=`<div class="catalog-status-heading"><span>状态</span><button type="button" id="catalog-status-filter" class="catalog-filter-button ${count?'active':''}" aria-label="筛选状态${count?'，已设置 '+count+' 项':''}" aria-expanded="false"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h18l-7 8v7l-4 2v-9z"/></svg></button></div>`;
 const panel=document.createElement('div');panel.id='catalog-status-panel';panel.className='catalog-status-panel';panel.setAttribute('popover','auto');
 panel.innerHTML=`<form id="catalog-status-form"><fieldset><legend>状态</legend><label class="catalog-review-option"><input type="checkbox" id="catalog-status-all" ${count?'':'checked'}><span>全部</span></label>${labels.map(label=>`<label class="catalog-review-option"><input type="checkbox" data-status-section="${label}" value="未填写" ${filters[label]==='未填写'?'checked':''}><span>${label}未完成</span></label>`).join('')}</fieldset><div class="catalog-filter-actions"><button type="button" class="btn" id="catalog-status-reset">重置</button><button class="btn primary" type="submit">确定</button></div></form>`;
 heading.append(panel);
 const button=$('#catalog-status-filter');
 button.onclick=()=>{
  const rect=button.getBoundingClientRect();panel.style.left=Math.max(12,Math.min(rect.right-320,window.innerWidth-332))+'px';panel.style.top=Math.min(rect.bottom+8,Math.max(12,window.innerHeight-420))+'px';
  panel.togglePopover();button.setAttribute('aria-expanded',String(panel.matches(':popover-open')));
 };
 panel.addEventListener('toggle',event=>button.setAttribute('aria-expanded',String(event.newState==='open')));
 const all=panel.querySelector('#catalog-status-all'),options=[...panel.querySelectorAll('[data-status-section]')];
 all.onchange=()=>{options.forEach(input=>input.checked=false);all.checked=true};
 options.forEach(input=>input.onchange=()=>{all.checked=!options.some(option=>option.checked)});
 $('#catalog-status-form').onsubmit=event=>{event.preventDefault();for(const label of labels)delete filters[label];for(const input of options)if(input.checked)filters[input.dataset.statusSection]='未填写';renderVocabulary()};
 $('#catalog-status-reset').onclick=()=>{catalogStatusFilters[vocabularyCatalogTab]={review:filters.review||''};renderVocabulary()};
}

function bindCatalogReviewFilter(){
 const heading=document.querySelector('.vocabulary-catalog-list th:nth-last-child(2)'),filters=catalogStatusFilters[vocabularyCatalogTab];
 heading.innerHTML=`<div class="catalog-status-heading"><span>待审核</span><button type="button" id="catalog-review-filter" class="catalog-filter-button ${filters.review?'active':''}" aria-label="筛选待审核" aria-expanded="false"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h18l-7 8v7l-4 2v-9z"/></svg></button></div><div id="catalog-review-panel" class="catalog-status-panel catalog-review-panel" popover="auto"><form id="catalog-review-form"><fieldset><legend>待审核</legend>${[['','全部'],['pending','待审核']].map(([value,label])=>`<label class="catalog-review-option"><input type="radio" name="review" value="${value}" ${(filters.review||'')===value?'checked':''}><span>${label}</span></label>`).join('')}</fieldset><div class="catalog-filter-actions"><button type="button" class="btn" id="catalog-review-reset">重置</button><button type="submit" class="btn primary">确定</button></div></form></div>`;
 const button=$('#catalog-review-filter'),panel=$('#catalog-review-panel');
 button.onclick=()=>{const rect=button.getBoundingClientRect();panel.style.left=Math.max(12,Math.min(rect.right-200,window.innerWidth-212))+'px';panel.style.top=Math.min(rect.bottom+8,Math.max(12,window.innerHeight-240))+'px';panel.togglePopover();button.setAttribute('aria-expanded',String(panel.matches(':popover-open')))};
 panel.addEventListener('toggle',event=>button.setAttribute('aria-expanded',String(event.newState==='open')));
 $('#catalog-review-form').onsubmit=event=>{event.preventDefault();filters.review=panel.querySelector('input:checked').value;renderVocabulary()};
 $('#catalog-review-reset').onclick=()=>{delete filters.review;renderVocabulary()};
}
