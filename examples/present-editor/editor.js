'use strict';
const $=id=>document.getElementById(id);
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const example=window.PRESENT_EXAMPLE;
const STORAGE=example?.storage||'present-inline-example-v2';
const copy=x=>JSON.parse(JSON.stringify(x));
function initial(){if(example)return {word:example.word,words:copy(example.words),positions:copy(example.positions),meanings:example.meanings.map(m=>({...copy(m),examples:[],chunks:[]})),exampleRevision:1,wordAttributesRevision:1};return {word:'present',words:copy(WORKBOOK_DATA.words.rows),positions:copy(WORKBOOK_DATA.positions.rows),meanings:WORKBOOK_DATA.meanings.rows.map(r=>{const ref=REFERENCE_DATA.find(s=>s.meaning===r.O)||REFERENCE_DATA.find(s=>r.O==='呈递；提交；出示'&&s.meaning==='出示；提交')||REFERENCE_DATA.find(s=>r.O==='上演；播出'&&s.meaning==='上演；播出');return {...copy(r),examples:copy(r.B==='present2'&&r.O==='礼物'?(ref?.examples||[]).slice(0,1):[]),chunks:[],exam:'',number:ref?.number||'',frequency:r.N==='高'?'high':'low',difficulty:r.R?'难度 '+r.R:'',refId:ref?.id||''}})}}
const readOnly=new URLSearchParams(location.search).get('mode')==='view';
const isChunkEntry=example?.entryType==='chunk';
const selectedWord=example?.word||'present2';
let model=initial(),pos='v',dirty=false,timer;
try{const saved=JSON.parse(localStorage.getItem(STORAGE));if(saved?.version===2&&saved.model?.words&&saved.model?.positions&&saved.model?.meanings)model=saved.model}catch{}
// Restore word grouping if the withdrawn entry-type preview was saved locally.
if(model._wordPositions){
 model.positions=model._wordPositions;
 for(const m of model.meanings)m.I=m._wordPos??model._wordPos??'';
}
for(const m of model.meanings)delete m._wordPos;
if(!isChunkEntry)for(const w of model.words)delete w.entryType;
delete model._wordPositions;delete model._wordPos;delete model._chunkPosition;
model.words=model.words.filter(w=>w.A===selectedWord);
model.positions=model.positions.filter(p=>p.A===selectedWord);
model.meanings=model.meanings.filter(m=>m.B===selectedWord);
model.exampleRevision=1;
if(!model.positions.some(p=>p.C===pos))pos=model.positions[0]?.C||'';
if(isChunkEntry){model.positions=[];for(const m of model.meanings)m.I='';pos=''}
wordInit();
function wordInit(){for(const p of model.positions)for(const key of ['S','T'])if(['-','—'].includes(p[key])){p[key]='';p._visible=(p._visible||[]).filter(k=>k!==key)}const w=model.words[0];if(!model.meaningListeningNoteRevision){if(w.listeningNote&&!model.meanings.some(m=>String(m.AI||'').trim())&&model.meanings.length)model.meanings[0].AI=w.listeningNote;model.meaningListeningNoteRevision=1;}if(!model.wordAttributesRevision){w.personTag=w.R?.includes('人名')?'听力人名':'';w.placeTag=w.R?.includes('地名')?'听力地名':'';w.syllables=model.positions.find(p=>p.B)?.B||'';w.R='';model.wordAttributesRevision=1;}if(!w.listeningTag)w.listeningTag=w.personTag?'听力人名':w.placeTag?'地名读音':'';delete w.personTag;delete w.placeTag;w._visible=(w._visible||[]).filter(k=>!['personTag','placeTag'].includes(k));model.words[0].displayWord??=example?.word||'present';if(model.layoutRevision!==4){model.words[0]._visible=[...new Set([...(model.words[0]._visible||[]),'C','B'])];model.layoutRevision=4}for(const m of model.meanings)if(!example?.sourceExact)m.N=m.N==='高'?'高':'低';for(const m of model.meanings)for(const e of [...m.examples,...m.chunks.flatMap(c=>c.examples)])e.sourceText??=e.sources?.join('；')||''}
const bindings=new Map(),attributeGroups=new Map(),audioBindings=new Map(),widgets=new Map();let bindingId=0;
const currentPosition=()=>model.positions.find(p=>p.C===pos);
const word=()=>model.words[0];
const wordExtras={listeningTag:{label:'听力标签',options:['听力人名','地名读音']},listeningNote:{label:'听力说明',options:[]},syllables:{label:'音节拆分'}};
const spec=(kind,key)=>kind==='meanings'&&key==='AA'?{key,label:'=',options:[]}:kind==='meanings'&&key==='AI'?{key,label:'听力说明',options:[]}:kind==='words'&&key==='chunkType'?{key,label:'词块类型',options:window.VocabularyCatalog?.chunkTypes||['短语动词','动词短语']}: kind==='meanings'&&key==='dialect'?{key,label:'英美标识',options:['BrE','AmE']}:kind==='words'&&wordExtras[key]?{key,...wordExtras[key]}:key==='N'&&kind==='meanings'?{key:'N',label:'义频',options:['高','低']}:({...WORKBOOK_DATA[kind].fields.find(f=>f.key===key),...(kind==='words'&&({S:'高中课标状态',F:'AW',N:'重难点词'})[key]?{label:({S:'高中课标状态',F:'AW',N:'重难点词'})[key]}:{})});
function changed(){dirty=true}
function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.add('hidden'),2600)}
function formControl(obj,key,label,opts=[],className='',placeholder='待填写'){
 if(model.meanings.includes(obj)&&key==='O')placeholder='中文释义';
 const id=String(++bindingId);bindings.set(id,{obj,key,label,opts});const value=obj[key]??'';
 const attrs=`class="inline-editor ${className}" data-edit="${id}" aria-label="${esc(label)}"`;
 if((model.positions.includes(obj)&&formKeysFor(obj.C).includes(key))||(model.words.includes(obj)&&label==='符号'))opts=[];
 if(opts.length)return `<select ${attrs}>${[...new Set([...opts.map(String),...(value!==''?[String(value)]:[])])].map(v=>`<option value="${esc(v)}" ${String(value)===v?'selected':''}>${esc(v||'待填写')}</option>`).join('')}</select>`;
 if(['en','zh','O','Y','english','listeningNote','AI'].includes(key))return `<textarea ${attrs} rows="${['en','zh'].includes(key)?2:1}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;

 return `<input ${attrs} value="${esc(value)}" placeholder="${esc(placeholder)}">`;
}
let activeEditor=null;
function control(obj,key,label,opts=[],className='',placeholder='待填写'){
 const id=String(++bindingId);bindings.set(id,{obj,key,label,opts,className,placeholder});
 return `<span class="inline-value ${className} ${obj[key]===undefined||obj[key]===''?'empty-value':''}" data-view="${id}" tabindex="0" role="button" aria-label="${esc(label)}">${esc(displayValue(obj,key,label))}</span>`;
}
function activate(el){
 if(readOnly)return;
 if(activeEditor)activeEditor.finish(true);
 const b=bindings.get(el.dataset.view);if(!b)return;el.closest('.pronunciation-block')?.classList.add('editing-audio');
 const old=b.obj[b.key]??'';const template=document.createElement('template');
 template.innerHTML=formControl(b.obj,b.key,b.label,b.opts,b.className,emptyFieldPlaceholder(el,b));
 const input=template.content.firstElementChild;const suggestions=template.content.querySelector('datalist');if(suggestions)document.body.append(suggestions);el.replaceWith(input);let done=false,selectHost=null,disposeSelect=null;
 function finish(save){if(done)return;done=true;activeEditor=null;
  if(save&&String(old)!==input.value){b.obj[b.key]=input.value;b.obj._sourceBlank=(b.obj._sourceBlank||[]).filter(k=>k!==b.key);changed()}
  el.textContent=displayValue(b.obj,b.key,b.label);el.classList.toggle('empty-value',!b.obj[b.key]);disposeSelect?.();selectHost?.remove();input.replaceWith(el);suggestions?.remove();markEmptyFields();if(save&&model.meanings.includes(b.obj)&&b.key==='dialect')render();
 }
 activeEditor={finish};input.onblur=()=>finish(true);
 input.onchange=()=>{if(input.tagName==='SELECT')finish(true)};
 input.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finish(false);el.closest('.pronunciation-block')?.classList.remove('editing-audio');el.focus()}else if(e.key==='Enter'&&(input.tagName!=='TEXTAREA'||e.ctrlKey||e.metaKey)){e.preventDefault();finish(true);el.closest('.pronunciation-block')?.classList.remove('editing-audio');el.focus()}};
 if(model.meanings.includes(b.obj)&&b.key==='L'){input.hidden=true;selectHost=document.createElement('span');selectHost.className='present-select-host usage-autocomplete';input.after(selectHost);disposeSelect=window.PresentUI.autocomplete(selectHost,{label:b.label,value:input.value,placeholder:input.placeholder,options:['［单数］','［复数］','［常用单数］','［常用复数］','［只用于名词前］','［常用于名词前］','［不用于名词前］','［常用于被动语态］'],onInput:value=>{input.value=value},onCommit:()=>finish(true),onCancel:()=>finish(false)});}else if(input.tagName==='SELECT'){input.hidden=true;selectHost=document.createElement('span');selectHost.className='present-select-host';input.after(selectHost);disposeSelect=window.PresentUI.select(selectHost,{label:b.label,value:input.value,options:[...input.options].map(o=>({value:o.value,label:o.textContent})),onChange:value=>{input.value=value;finish(true)},onCancel:()=>finish(false)});}else{input.focus();input.select?.();}
}
function optionalWordForm(obj,key){return (model.positions.includes(obj)&&formKeysFor(obj.C).includes(key))||(model.meanings.includes(obj)&&['AC','AD'].includes(key))}
function displayValue(obj,key,label){
 if(optionalWordForm(obj,key)&&!obj[key])return '';
 const v=obj[key];if(model.meanings.includes(obj)&&key==='dialect'&&v)return '['+v+']';if(v==null||v==='')return label||'待填写';
 if(model.meanings.includes(obj)&&['K','L','M'].includes(key))return String(v).trim().replace(/［/g,'[').replace(/］/g,']');
 if(model.words.includes(obj)){
  if(key==='E')return '词频 '+v;if(key==='N')return String(v)==='1'?'重难点词':'重难点词 '+v;
  if(key==='M')return 'R'+v;if(key==='F')return 'AW';if(key==='G')return 'AW '+v;
  if(key==='S')return String(v).startsWith('高中')?v:'高中'+v;
 }return String(v);
}
function widget(kind,props,cls=''){const id=String(++bindingId);widgets.set(id,{kind,props});return `<span class="component-host ${cls}" data-widget="${id}"></span>`}
function removeButton(label,onClick,trash=false){return widget('remove',{label,onClick,trash},'remove-host'+(trash?' meaning-delete-host':''))}
function deleteField(obj,key){if(model.positions.includes(obj)&&requiredPositionKeys(obj.C).includes(key))return;obj[key]='';obj._visible=(obj._visible||[]).filter(k=>k!==key);if(obj._audio)delete obj._audio[key];if(model.positions.includes(obj)&&['D','F'].includes(key)){const audioKey=key==='D'?'E':'G';obj[audioKey]='';if(obj._audio)delete obj._audio[audioKey]}changed();render()}
const formCaptions={H:'三单',I:'过去式',K:'过去分词',M:'现在分词'};
function field(kind,obj,key,label,cls='',required=false){const f={...spec(kind,key)};if(kind==='meanings'&&['dialect','AC','AD'].includes(key))cls+=' secondary-tag';if(kind==='positions'&&formKeysFor(obj.C).includes(key))f.options=[];required=required||(kind==='positions'&&requiredPositionKeys(obj.C).includes(key));return `<div class="form-field removable ${cls}" data-field="${kind}-${key}"><span class="field-caption">${esc(kind==='words'&&key==='syllables'?'音节：':kind==='positions'&&formCaptions[key]?formCaptions[key]:kind==='meanings'&&key==='AC'?'BrE':kind==='meanings'&&key==='AD'?'AmE':kind==='meanings'&&key==='Z'?'近':kind==='meanings'&&key==='AA'?'=':kind==='meanings'&&key==='AB'?'反':label||f.label)}</span>${f.options?.length===1?`<span class="inline-value static-tag" aria-label="${esc(label||f.label)}">${esc(displayValue(obj,key,label||f.label))}</span>`:control(obj,key,label||f.label,f.options)}${required?'':removeButton('删除'+(label||f.label),()=>deleteField(obj,key))}</div>`}
function has(obj,key){return (obj[key]!==''&&obj[key]!=null)||(obj._visible||[]).includes(key)}
function addField(kind,obj,key){if(has(obj,key))return;const f=spec(kind,key);if(f.options?.length)obj[key]=f.options[0];obj._visible=[...new Set([...(obj._visible||[]),key])];changed();render()}
function meaningMenuGroups(items){
 const groups=[['释义与用法',['J','K','L','M','Y','AI']],['词义关联',['Z','AA','AB']],['拼写与地区',['dialect']]];
 return groups.map(([label,keys],i)=>({type:'group',key:'group-'+i,label,children:items.filter(item=>keys.includes(item.key))})).filter(group=>group.children.length);
}
function wordMenuGroups(items){
 const regular=items.filter(item=>item.key!=='listeningTag'&&item.key!=='L');
 const tags=items.find(item=>item.key==='listeningTag')?.children||[];
 const listening=items.filter(item=>item.key==='L');
 return [{type:'group',key:'word-basic',label:'单词属性',children:regular},{type:'group',key:'word-listening-tags',label:'听力标签',children:tags},{type:'group',key:'word-listening',label:'听力',children:listening}].filter(group=>group.children.length);
}
function attributeMenu(kind,obj,keys,label,extra=[]){
 keys=keys.filter(key=>!has(obj,key));if(!keys.length&&!extra.length)return '';
 const items=[...keys.map(key=>key==='listeningTag'?{key,label:'加听力标签',children:spec(kind,key).options.map(value=>({key:'@listening:'+value,label:value==='听力人名'?'人名':'地名'}))}:{key,label:spec(kind,key).label}),...extra.map(x=>({key:x.key,label:x.label,disabled:x.disabled,className:x.className}))];
 return widget('menu',{label,grouped:kind==='meanings'||label==='添加单词标签',mode:kind==='meanings'?(isChunkMeaning(obj)?'chunk':'meaning'):undefined,onModeChange:value=>{if(value!==(isChunkMeaning(obj)?'chunk':'meaning'))switchMeaningMode(obj)},items:kind==='meanings'?meaningMenuGroups(items):label==='添加单词标签'?wordMenuGroups(items):items,onSelect:key=>{if(kind==='words'&&key.startsWith('@listening:')){obj.listeningTag=key.slice(11);changed();render();return}const item=extra.find(x=>x.key===key);if(item)item.action();else if(keys.includes(key))addField(kind,obj,key)}},'add-host');
}
function more(kind,obj,keys,label='添加属性',omitRender=[],extra=[],showMenu=true){return `<div class="optional-fields">${keys.filter(k=>has(obj,k)&&!omitRender.includes(k)).map(k=>keyField(kind,obj,k)).join('')}${showMenu?attributeMenu(kind,obj,keys,label,extra):''}</div>`}
function formKeysFor(c){return ['v','aux.v','link. v','modal v'].includes(c)?['H','I','K','M']:['n','proper n'].includes(c)?['O']:['adj','adv'].includes(c)?['P','Q']:[]}
function requiredPositionKeys(c){return ['D','E','F','G']}
function keyField(kind,obj,key){
 if(kind==='words'&&key==='L')return `<div class="guidance-module removable">${audioField(obj,key,'语音指导')}${removeButton('删除语音指导',()=>deleteField(obj,key))}</div>`;
 if(kind==='positions'&&['D','F'].includes(key)){const uk=key==='D';return `<section class="pronunciation-block removable">${field(kind,obj,key,uk?'英':'美','ipa-field',true)}${audioField(obj,uk?'E':'G',uk?'英式发音':'美式发音',true)}</section>`}
 if(kind==='positions'&&key==='R')return `<div class="form-field removable"><label class="check-field"><input type="checkbox" id="irregular" ${obj.R==='1'?'checked':''}>不规则动词</label></div>`;
 return field(kind,obj,key);
}
function audioField(obj,key,label,compact=false){const id=String(++bindingId);audioBindings.set(id,{obj,key,label});if(key==='L')return `<div class="audio-field guidance-audio"><button class="guidance-audio-name ${obj[key]?'':'empty-value'}" data-guidance-audio="${id}" aria-label="选择语音指导音频" ${readOnly?'disabled':''}>${esc(obj[key]||'待填写')}</button><button class="play-button" data-audio-play="${id}" aria-label="播放语音指导">${icon}</button><input hidden type="file" accept=".aac,audio/aac" data-audio-file="${id}" aria-label="语音指导文件"></div>`;return `<div class="audio-field ${compact?'compact-audio':''}">${!compact?`<span class="audio-name">${obj[key]?control(obj,key,label):esc(label)}</span>`:''}<button class="play-button" data-audio-play="${id}" aria-label="播放${esc(label)}">${icon}</button><button class="file-button" data-audio-change="${id}" aria-label="更换${esc(label)}音频">更换音频</button><input hidden type="file" accept=".aac,audio/aac" data-audio-file="${id}" aria-label="${esc(label)}文件"></div>`}
function audioReferenceName(name){return String(name||'').trim().replace(/\.(mp3|wav|m4a|ogg|aac)$/i,'.aac')}
function normalizeAudioReferences(){for(const obj of [...model.positions,word()])for(const key of obj===word()?['L']:['E','G']){if(obj[key])obj[key]=audioReferenceName(obj[key]);if(obj._audio?.[key]?.name)obj._audio[key].name=audioReferenceName(obj._audio[key].name)}}
function wordAudioChoices(target){
 return [...model.positions.flatMap(p=>['E','G'].map(key=>({obj:p,key,pos:p.C||'空词性',accent:key==='E'?'英音':'美音',ipa:p[key==='E'?'D':'F']||''}))),...(word().L||word()._audio?.L?.data?[{obj:word(),key:'L',pos:'—',accent:'语音指导',ipa:''}]:[])].map(a=>({...a,current:a.obj===target.obj&&a.key===target.key}));
}
function openGuidanceChooser(id){
 if(requestMaterialAudio(id))return;
 const target=audioBindings.get(id);if(!target||readOnly)return;
 document.getElementById('wordAudioChooser')?.remove();
 const rows=[...model.words,...(window.guidanceWords||[]),...(window.VocabularyCatalog?.entries||[]).flatMap(e=>e.words||[]),...(WORKBOOK_DATA.words.rows||[])];
 const assets=[...new Map(rows.filter(w=>w.L).map(w=>[audioReferenceName(w.L),{name:audioReferenceName(w.L),word:w.displayWord||w.A||''}])).values()];
 const dialog=document.createElement('dialog');dialog.id='wordAudioChooser';dialog.className='audio-chooser';dialog.setAttribute('aria-label','选择语音指导音频');
 dialog.innerHTML=`<div class="audio-chooser-heading"><strong>选择语音指导音频</strong><button data-close-audio aria-label="关闭音频选择">×</button></div><input class="guidance-audio-search" aria-label="搜索语音指导音频" placeholder="搜索音频文件名或单词"><div class="audio-choices"></div><div class="audio-upload-option"><button data-upload-audio>＋ 上传新音频</button><span>AAC 文件，最大 2 MB</span></div>`;
 document.body.append(dialog);const close=()=>dialog.close();dialog.querySelector('[data-close-audio]').onclick=close;dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 const search=dialog.querySelector('input'),results=dialog.querySelector('.audio-choices');
 function draw(){const q=search.value.trim().toLowerCase(),matches=assets.filter(a=>(a.name+' '+a.word).toLowerCase().includes(q));results.innerHTML=matches.length?`<table class="word-audio-table"><thead><tr><th>单词</th><th>音频文件名</th><th>操作</th></tr></thead><tbody>${matches.map(a=>`<tr><td>${esc(a.word)}</td><td>${esc(a.name)}</td><td><button data-guidance-select="${esc(a.name)}" ${audioReferenceName(target.obj.L)===a.name?'disabled':''}>${audioReferenceName(target.obj.L)===a.name?'已选择':'选择'}</button></td></tr>`).join('')}</tbody></table>`:'<p class="audio-empty">暂无匹配的语音指导音频，可上传新音频。</p>';results.querySelectorAll('[data-guidance-select]').forEach(b=>b.onclick=()=>{target.obj.L=b.dataset.guidanceSelect;if(target.obj._audio)delete target.obj._audio.L;changed();close();render()})}
 search.oninput=draw;draw();dialog.querySelector('[data-upload-audio]').onclick=()=>{close();document.querySelector(`[data-audio-file="${id}"]`)?.click()};dialog.showModal();search.focus();
}
function openAudioChooser(id){
 if(requestMaterialAudio(id))return;
 const target=audioBindings.get(id);if(!target)return;
 document.getElementById('wordAudioChooser')?.remove();
 const choices=wordAudioChoices(target),dialog=document.createElement('dialog');dialog.id='wordAudioChooser';dialog.className='audio-chooser';dialog.setAttribute('aria-label','更换'+target.label+'音频');
 dialog.innerHTML=`<div class="audio-chooser-heading"><strong>更换${esc(target.label)}音频</strong><button data-close-audio aria-label="关闭音频选择">×</button></div><div class="audio-choices"><table class="word-audio-table"><thead><tr><th>词性</th><th>类型</th><th>音标</th><th>音频</th><th>操作</th></tr></thead><tbody>${choices.map((a,i)=>{const file=a.obj._audio?.[a.key],name=file?.name||a.obj[a.key];return `<tr class="${a.current?'current-audio':''}"><td>${esc(a.pos)}</td><td>${esc(a.accent)}</td><td>${esc(a.ipa||'未填写音标')}</td><td><span>${esc(name||'未添加音频')}</span></td><td><button data-reuse-audio="${i}" ${name&&!a.current?'':'disabled'}>${a.current?'已选择':'选择'}</button></td></tr>`}).join('')}</tbody></table></div><div class="audio-upload-option"><button data-upload-audio>＋ 上传新音频</button><span>AAC 文件，最大 2 MB</span></div>`;
 document.body.append(dialog);const close=()=>dialog.close();dialog.querySelector('[data-close-audio]').onclick=close;
 dialog.addEventListener('close',()=>{if(playingAudio)playingAudio.pause();dialog.remove()},{once:true});
 dialog.querySelector('[data-upload-audio]').onclick=()=>{close();document.querySelector(`[data-audio-file="${id}"]`)?.click()};
 dialog.querySelectorAll('[data-preview-audio]').forEach(button=>button.onclick=()=>{const a=choices[+button.dataset.previewAudio];if(playingAudio)playingAudio.pause();playingAudio=new Audio(a.obj._audio[a.key].data);playingAudio.play().catch(()=>toast('此音频无法播放，请更换文件'))});
 dialog.querySelectorAll('[data-reuse-audio]').forEach(button=>button.onclick=()=>{const a=choices[+button.dataset.reuseAudio];target.obj[target.key]=audioReferenceName(a.obj[a.key]||a.obj._audio?.[a.key]?.name);if(target.obj._audio)delete target.obj._audio[target.key];changed();close();render()});
 dialog.showModal();
}
function isChunkMeaning(m){return m.contentMode==='chunk'||(!m.contentMode&&!m.O&&(!!m.AG||!!m.AH))}
function switchMeaningMode(m){
 if(isChunkMeaning(m)){m._chunkDraft={AG:m.AG||'',AH:m.AH||''};m.AG='';m.AH='';m.O=m._meaningDraft||'';m.contentMode='meaning'}
 else{m._meaningDraft=m.O||'';m.O='';m.AG=m._chunkDraft?.AG||m.AG||'';m.AH=m._chunkDraft?.AH||m.AH||'';m.contentMode='chunk'}
 m._visible=(m._visible||[]).filter(k=>!['O','AG','AH'].includes(k));changed();render();
}
function openExternalChunkPicker(afterIndex=null){
 if(afterIndex!=='@word'&&(afterIndex===null||!model.meanings[afterIndex])){toast('请先新增释义，再在释义下引用词块');return}
 if(activeEditor)activeEditor.finish(true);
 const host=$('externalChunkPicker'+(afterIndex===null?'':afterIndex));host.innerHTML='<div class="chunk-picker"><input aria-label="搜索词库词块" placeholder="搜索词库中的词块"><button data-cancel-picker>取消</button><div class="chunk-results"></div></div>';
 host.querySelector('[data-cancel-picker]').onclick=()=>{host.innerHTML=''};
 const input=host.querySelector('input');input.oninput=()=>{const q=input.value.trim().toLowerCase();const matches=q?WORKBOOK_DATA.chunkLibrary.filter(c=>(c.word+' '+c.meaning).toLowerCase().includes(q)).slice(0,30):[];
 host.querySelector('.chunk-results').innerHTML=matches.map(c=>`<button data-chunk-id="${esc(c.id)}">${esc(c.word)}　${esc(c.meaning)}</button>`).join('');
 host.querySelectorAll('[data-chunk-id]').forEach(button=>button.onclick=()=>{const c=WORKBOOK_DATA.chunkLibrary.find(c=>c.id===button.dataset.chunkId);const chunks=afterIndex==='@word'?(model.wordChunks??=[]):model.meanings[afterIndex].chunks;if(!chunks.some(item=>item.id===c.id))chunks.push({...c,examples:[]});changed();render()});};input.focus();
}
function meaningDialectGroup(m){
 if(!has(m,'dialect'))return '';
 const key=m.dialect==='AmE'?'AC':'AD',label=key==='AC'?'英式拼写':'美式拼写';
 return `<div class="meaning-dialect-group">${field('meanings',m,'dialect','英美标识','dialect-inline')}<div class="form-field" data-field="meanings-${key}"><span class="field-caption">${label}（选填）</span>${control(m,key,label,[],'optional-spelling','')}</div></div>`;
}
function meaningActions(i){return []}
function usageKeysFor(c){return formKeysFor(c).includes('H')?['J']:formKeysFor(c).includes('O')?['K']:[]}
function meaningInsertion(afterIndex=null){return `<div class="meaning-insert-actions" data-insert-after="${afterIndex??''}">${widget('add',{label:'新增释义',text:'新增释义',onClick:()=>runAction(afterIndex===null?{}:{insertAfter:String(afterIndex)},'addMeaning')},'add-meaning-host')}${widget('add',{label:'引用词块',text:'引用词块',onClick:()=>openExternalChunkPicker(afterIndex)},'add-chunk-host')}</div><div id="externalChunkPicker${afterIndex??''}"></div>`}
function nestReferencedChunks(){
 for(const ref of [...model.meanings].filter(m=>m.chunkRefId)){
  const index=model.meanings.indexOf(ref);
  let parent=model.meanings.slice(0,index).reverse().find(m=>!m.chunkRefId&&m.I===ref.I)||model.meanings.find(m=>!m.chunkRefId&&m.I===ref.I);
  if(!parent){parent={B:ref.B,I:ref.I,O:'',N:'高',examples:[],chunks:[],row:'parent-'+ref.row};model.meanings.splice(index,0,parent)}
  parent.chunks??=[];parent.chunks.push({id:ref.chunkRefId,word:ref.AG,meaning:ref.AH,examples:ref.examples||[],referenceData:ref});model.meanings.splice(model.meanings.indexOf(ref),1);
 }
}
function referencedChunkHTML(c,i,ci){return `<div class="chunk-node referenced-chunk-section removable" data-chunk-reference="${ci}">${removeButton('解除引用词块 '+c.word,()=>runAction({unlink:`${i},${ci}`}),true)}<div class="referenced-chunk-card"><div class="referenced-chunk-heading"><span class="referenced-chunk-word">${esc(c.word)}</span><span class="referenced-chunk-label">引用词块</span></div><div class="referenced-chunk-meaning">${esc(c.meaning)}</div></div></div>`}

function meaningHTML(m,i,n){n=model.meanings.slice(0,i).filter(x=>x.I===m.I&&!x.chunkRefId).length;const usageKeys=isChunkEntry?[]:usageKeysFor(m.I);const keys=WORKBOOK_DATA.meanings.fields.flatMap(f=>f.key==='AC'?['dialect','AC']:[f.key]).filter(k=>!['B','I','O','N','AJ','AE','AF','AG','AH','AC','AD'].includes(k)&&(!['J','K'].includes(k)||usageKeys.includes(k)));return `<section class="sense-section removable ${m.image?'has-meaning-image':''}" data-meaning="${i}"><div class="meaning-controls">${widget('drag',{index:i,label:'拖动释义 '+(n+1)+' 排序，或按 Alt 加上下方向键'},'drag-host')}<span class="sense-number" aria-label="释义序号 ${n+1}">${n+1}</span></div>${removeButton('删除释义 '+(n+1),()=>{model.meanings.splice(i,1);changed();render()},true)}<input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-image-file="${i}" aria-label="上传释义图片 ${n+1}">${m.image?`<div class="meaning-image removable"><button class="meaning-thumbnail" data-image-preview="${i}" aria-label="查看释义图片 ${n+1}"><img src="${esc(m.image.data)}" alt="释义配图"></button><button class="image-replace" data-image-replace="${i}" aria-label="更换释义图片 ${n+1}">换图</button>${removeButton('删除释义图片 '+(n+1),()=>{delete m.image;changed();render()})}</div>`:''}${example?.catalog?`<span class="entry-id meaning-id ${m.meaningId?'':'meaning-id-pending'}" aria-label="释义 ID">${m.meaningId?"释义ID："+esc(catalogMeaningId(m.meaningId)):"保存后生成ID"}</span>`:""}<div class="meaning-fields"><div class="usage-cluster">${[...usageKeys,'L'].filter(k=>has(m,k)).map(k=>field('meanings',m,k,k==='L'?'用法强调':'用法','compact-field')).join('')}${has(m,'M')?field('meanings',m,'M','语域','register-field'):''}</div>${isChunkMeaning(m)?`<div class="meaning-chunk-pair">${field('meanings',m,'AG','释义词块-英','chunk-english',true)}${field('meanings',m,'AH','释义词块-中','meaning-text',true)}</div>`:field('meanings',m,'O','中文释义','meaning-text',true)}${has(m,'Y')?field('meanings',m,'Y','英文释义','english-meaning'):''}${['Z','AA','AB'].filter(k=>has(m,k)).map(k=>field('meanings',m,k,null,'relation-field')).join('')}${attributeMenu('meanings',m,keys,'添加释义内容',meaningActions(i))}</div>${meaningDialectGroup(m)}${more('meanings',m,keys,'添加释义内容',['J','K','L','M','dialect','Y','Z','AA','AB'],[],false)}${m.chunks.map((c,ci)=>referencedChunkHTML(c,i,ci)).join('')}<div data-picker="${i}"></div></section>`}
function defaultSelections(){
 for(const kind of ['words','positions','meanings'])for(const obj of model[kind]){
  const keys=[...WORKBOOK_DATA[kind].fields.map(f=>f.key),...(obj._visible||[])];
  for(const key of keys){
   if(obj._sourceBlank?.includes(key))continue;
   if(kind==='positions'&&formKeysFor(obj.C).includes(key))continue;
   const required=kind==='positions'&&requiredPositionKeys(obj.C).includes(key);
   if(!required&&!(obj._visible||[]).includes(key))continue;
   const options=spec(kind,key).options;
   if(options?.length&&(obj[key]==null||obj[key]==='')){obj[key]=options[0];changed()}
  }
 }
}
function catalogAuditMarkup(){
 const audit=window.catalogAudit;let time='—';
 if(audit?.at&&!Number.isNaN(new Date(audit.at).getTime()))time=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(audit.at));
 return `<div class="catalog-edit-meta"><span>最后编辑人：${esc(audit?.actor||'—')}</span><span>编辑时间：${esc(time)}</span></div>`;
}
function spellingFields(w,keys){
 const shown=keys.filter(k=>has(w,k)),menu=attributeMenu('words',w,keys,'添加拼写属性');
 const column=(fields,cls,withMenu)=>`<div class="optional-fields ${cls}${withMenu&&menu?' spelling-with-add':''}" style="--spelling-add-row:${Math.max(1,fields.length)}">${fields.map(k=>keyField('words',w,k)).join('')}${withMenu?menu:''}</div>`;
 return `<div class="spelling-columns">${column(shown,'spelling-primary',true)}</div>`;
}
function positionForms(p,keys){
 if(!keys.length)return '';
 const groups=keys.includes('H')?[['现在',['H']],['过去',['I']],['过去分词',['K']],['现在分词',['M']]]:[['',keys]];
 return `<div class="position-card word-forms">${keys.includes('H')?`<div class="irregular-row">${keyField('positions',p,'R')}</div>`:''}${groups.map(([label,fields])=>`<section class="form-group" aria-label="${label||'词形'}"><div class="optional-fields">${fields.map(k=>field('positions',p,k,null,'',true)).join('')}</div></section>`).join('')}</div>`;
}
function render(){nestReferencedChunks();normalizeAudioReferences();for(const m of model.meanings)if(!Object.getOwnPropertyDescriptor(m,'dialect')?.get)Object.defineProperty(m,'dialect',{configurable:true,get(){return this.AE||this.AF||''},set(value){this.AE=value==='BrE'?'BrE':'';this.AF=value==='AmE'?'AmE':'';this._visible=(this._visible||[]).filter(k=>!['AE','AF'].includes(k));this._sourceBlank=(this._sourceBlank||[]).filter(k=>!['AE','AF'].includes(k))}});if(!model.positionOrderRevision){model.positions.sort((a,b)=>Number(b.C==='')-Number(a.C===''));model.positionOrderRevision=1}defaultSelections();if(activeEditor)activeEditor.finish(true);window.PresentUI?.dispose();const scroll=window.scrollY;bindings.clear();attributeGroups.clear();audioBindings.clear();widgets.clear();bindingId=0;const w=word(),p=currentPosition();
 const wordTop=['U','T','S','E','F','M','V','listeningTag','L'];const spellings=['C','B','D','I','J','K'];const formKeys=formKeysFor(pos);
 document.querySelector('.board').innerHTML=`<header class="edit-actions">${example?.catalog?catalogAuditMarkup():''}${example?.catalog?'<button id="catalogBack">返回基础词库</button>':''}${example?.catalog&&window.catalogPending&&window.catalogCanReview&&!readOnly?'<button id="approveCatalog" class="save review-save">通过审核并保存</button>':''}<button id="saveExample" class="save" aria-label="保存">保存</button></header><section class="word-overview" aria-label="单词信息"><div class="word-summary"><div class="word-heading"><div class="word-title-row"><label class="word-title">${control(w,'displayWord','单词',[],'word-input',example?.word||'present')}</label><div class="word-syllables">${more('words',w,['syllables'],'添加音节拆分')}</div>${example?.catalog?`<span class="entry-id word-id">单词ID：${esc(example.id)}</span>`:""}</div>${more('words',w,wordTop,'添加单词标签',['listeningTag','L'])}${['listeningTag','L'].some(k=>has(w,k))?`<div class="word-guidance">${more('words',w,['listeningTag','L'],'',[],[],false)}</div>`:''}</div></div><aside class="spelling-row" aria-label="单词拼写属性">${spellingFields(w,spellings)}</aside></section><nav class="pos-tabs" role="tablist" aria-label="词性">${model.positions.map((p,i)=>`<div class="pos-tab removable"><button id="pos-${i}" data-pos="${esc(p.C)}" role="tab" tabindex="${p.C===pos?0:-1}" aria-controls="wordPanel" aria-selected="${p.C===pos}" class="${p.C===pos?'active':''}"><span class="pos-abbr">${esc(p.C||'空词性')}</span><span class="pos-count">${model.meanings.filter(m=>m.I===p.C&&!m.chunkRefId).length}</span></button>${removeButton('删除词性 '+(p.C||'空词性'),()=>{model.positions.splice(i,1);model.meanings=model.meanings.filter(m=>m.I!==p.C);if(pos===p.C)pos=model.positions[0]?.C||'';changed();render()})}</div>`).join('')}${widget('menu',{label:'添加词性或词块',menuClass:'pos-choice-menu',items:[{key:'@wordChunks',label:'词块'},{type:'divider'},{type:'group',key:'@positions',label:'词性',children:['',...spec('positions','C').options].filter(c=>!model.positions.some(p=>p.C===c)).map(c=>({key:c||'@empty',label:c||'空词性'}))}],onSelect:key=>{if(key==='@wordChunks'){model.wordChunks??=[];pos='@wordChunks';render();openExternalChunkPicker('@word')}else addPosition(key==='@empty'?'':key)}},'add-host')}</nav><main id="wordPanel" class="editor-columns" role="tabpanel" ${p?`aria-labelledby="pos-${model.positions.indexOf(p)}"`: 'aria-label="词性内容"'}><div class="meanings-pane">${model.meanings.map((m,i)=>({m,i})).filter(x=>x.m.I===pos).map(({m,i},n)=>meaningHTML(m,i,n)+meaningInsertion(i)).join('')}${p?`${model.meanings.some(m=>isChunkEntry||m.I===pos)?'':meaningInsertion()}`:''}</div>${p?`<aside class="position-pane" aria-label="当前词性属性"><div class="position-card pronunciation-card"><div class="pronunciations">${['D','F'].map(k=>keyField('positions',p,k)).join('')}</div><div class="position-levels">${more('positions',p,['S','T'],'添加口语和书写级别')}</div></div>${positionForms(p,formKeys)}</aside>`:''}</main>`;
 if(isChunkEntry){document.querySelector('.word-overview').outerHTML=`<section class="word-overview chunk-overview"><div class="word-heading chunk-title-row"><label class="word-title">${control(w,'displayWord','词块',[],'word-input')}</label><div class="chunk-type">${control(w,'chunkType','词块类型',spec('words','chunkType').options,'chunk-type-tag')}</div></div></section>`;document.querySelector('.pos-tabs')?.remove();document.querySelector('.position-pane')?.remove();const panel=$('wordPanel');panel.classList.add('chunk-editor');panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label','词块释义');panel.querySelector('.meanings-pane').innerHTML=model.meanings.map((m,i)=>meaningHTML(m,i,i)+meaningInsertion(i)).join('')+`${model.meanings.some(m=>isChunkEntry||m.I===pos)?'':meaningInsertion()}`;}
 if(!isChunkEntry&&(model.wordChunks?.length||pos==='@wordChunks')){
 const tab=document.createElement('div');tab.className='word-chunks-tab';tab.innerHTML=`<button id="wordChunksTab" data-pos="@wordChunks" role="tab" aria-controls="wordPanel" aria-selected="${pos==='@wordChunks'}" class="${pos==='@wordChunks'?'active':''}"><span>词块</span><span class="pos-count">${model.wordChunks?.length||0}</span></button>`;const nav=document.querySelector('.pos-tabs');nav.insertBefore(tab,nav.lastElementChild);
 if(pos==='@wordChunks'){$('wordPanel').setAttribute('aria-labelledby','wordChunksTab');$('wordPanel').innerHTML=`<div class="word-level-chunks">${(model.wordChunks||[]).map((c,ci)=>`<div class="referenced-chunk-section removable">${removeButton('解除引用词块 '+c.word,()=>{model.wordChunks.splice(ci,1);changed();render()},true)}<div class="referenced-chunk-card"><div class="referenced-chunk-heading"><span class="referenced-chunk-word">${esc(c.word)}</span><span class="referenced-chunk-label">引用词块</span></div><div class="referenced-chunk-meaning">${esc(c.meaning)}</div></div></div>`).join('')}${widget('add',{label:'引用单词级词块',text:'引用词块',onClick:()=>openExternalChunkPicker('@word')},'add-host')}<div id="externalChunkPicker@word"></div></div>`}
 }
 if(!isChunkEntry)document.querySelector('.word-summary').append(document.querySelector('.pos-tabs'));
 const gift=model.meanings.findIndex(m=>m.O==='礼物');const first=document.querySelector(`[data-meaning="${gift}"] .example-item`);if(first){const b=document.createElement('button');b.className='gift-picture';b.setAttribute('aria-label','放大礼物配图');b.innerHTML='<img src="'+$('giftDialog').querySelector('img').src+'" alt="金黄色礼物盒，系着红色蝴蝶结">';b.onclick=()=>$('giftDialog').showModal();first.appendChild(b)}
 for(const [id,w] of widgets){const host=document.querySelector(`[data-widget="${id}"]`);if(host)window.PresentUI?.mount(host,w.kind,w.props)}
 if(!readOnly&&!isChunkEntry)window.PresentUI?.sortable(document.querySelector('.pos-tabs'),reorderPosition,{handle:'[role=tab]',draggable:'.pos-tab',direction:'horizontal',filter:'.remove-host',delay:150,delayOnTouchOnly:true,touchStartThreshold:4});
 if(!readOnly&&document.querySelector('.meanings-pane'))window.PresentUI?.sortable(document.querySelector('.meanings-pane'),(from,to)=>{const slots=model.meanings.map((m,i)=>m.I===pos?i:-1).filter(i=>i>=0);reorderMeaning(slots[from],slots[to],to>from)});
 markEmptyFields();if(readOnly)applyReadOnly();window.scrollTo?.(0,scroll);
}
function applyReadOnly(){
 document.body.classList.add('read-only');
 document.querySelectorAll('.frequency-host').forEach(el=>{const text=el.textContent;el.replaceChildren(document.createTextNode(text))});
 document.querySelectorAll('.board button').forEach(b=>{if(!b.matches('#catalogBack,[data-pos],[data-guidance-audio],[data-audio-play],[data-image-preview],.gift-picture'))b.remove()});
 document.querySelectorAll('.remove-host,.drag-host,.meaning-insert-actions,.image-replace,.board input[type=file]').forEach(el=>el.remove());
 document.querySelectorAll('[data-view]').forEach(el=>{el.removeAttribute('data-view');el.removeAttribute('role');el.removeAttribute('tabindex')});
}
function emptyFieldPlaceholder(el,b){
 if(optionalWordForm(b.obj,b.key))return '';
 const field=el.closest('.form-field');
 const caption=field&&[...field.children].find(child=>child.matches('.field-caption,span:not(.inline-value):not(.component-host)')&&child.textContent.trim()&&getComputedStyle(child).display!=='none'&&getComputedStyle(child).visibility!=='hidden');
 return caption?'待填写':b.label;
}
function markEmptyFields(){
 document.querySelectorAll('[data-view]').forEach(el=>{const b=bindings.get(el.dataset.view);if(b&&!String(b.obj[b.key]??'').trim())el.textContent=emptyFieldPlaceholder(el,b)});
 document.querySelectorAll('[data-view],[data-edit]').forEach(el=>{const b=bindings.get(el.dataset.view||el.dataset.edit);if(!b)return;const card=el.closest('.pronunciation-block')||el.closest('.form-field,.word-title');if(card)card.classList.toggle('unfilled-card',!optionalWordForm(b.obj,b.key)&&!String(el.matches('[data-edit]')?el.value:b.obj[b.key]??'').trim())});
 document.querySelectorAll('[data-audio-play]').forEach(el=>{const b=audioBindings.get(el.dataset.audioPlay);const card=el.closest('.guidance-module');if(card)card.classList.toggle('unfilled-card',!String(b?.obj[b.key]??'').trim())});
}
document.addEventListener('input',e=>{if(e.target.matches('[data-edit]'))markEmptyFields()});
function speak(text,lang='en-GB'){if(!window.speechSynthesis){toast('当前浏览器不支持系统朗读');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.85;speechSynthesis.speak(u)}
let playingAudio=null;

document.addEventListener('change',async e=>{
 if(e.target.dataset.imageFile!==undefined){const m=model.meanings[+e.target.dataset.imageFile],file=e.target.files?.[0];if(!m||!file)return;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)){toast('请选择 PNG、JPEG、WebP 或 GIF 图片');return}if(file.size>2*1024*1024){toast('请选择 2 MB 以内的图片');return}const reader=new FileReader();reader.onload=()=>{if(!model.meanings.includes(m))return;m.image={name:file.name,data:reader.result};changed();render()};reader.onerror=()=>toast('图片读取失败，请重新选择');reader.readAsDataURL(file);return}
 if(e.target.id==='irregular'){currentPosition().R=e.target.checked?'1':'';changed()}
 if(e.target.dataset.audioFile){const a=audioBindings.get(e.target.dataset.audioFile),file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){toast('请选择 2 MB 以内的音频');e.target.value='';return}if(!/\.aac$/i.test(file.name)){toast('请选择 AAC 音频文件');e.target.value='';return}a.obj[a.key]=audioReferenceName(file.name);if(a.obj._audio)delete a.obj._audio[a.key];changed();render()}
});
document.addEventListener('focusin',e=>{document.querySelectorAll('.editing-audio').forEach(block=>{if(!block.contains(e.target))block.classList.remove('editing-audio')})});
document.addEventListener('click',e=>{document.querySelectorAll('.editing-audio').forEach(block=>{if(!block.contains(e.target))block.classList.remove('editing-audio')});const value=e.target.closest('[data-view]');if(value){activate(value);return}const b=e.target.closest('button');if(b)handleButton(b)});
function runAction(dataset,id=''){handleButton({dataset,id})}
function addPosition(value){if(model.positions.some(p=>p.C===value))return;const p=Object.fromEntries(WORKBOOK_DATA.positions.fields.map(f=>[f.key,'']));Object.assign(p,{A:selectedWord,C:value,row:'pos-'+Date.now()});if(value==='')model.positions.unshift(p);else model.positions.push(p);pos=p.C;changed();render()}
function handleButton(b){if(activeEditor)activeEditor.finish(true);
 if(b.id==='catalogBack'){if(dirty&&!confirm('有未保存的修改，确定返回吗？'))return;window.parent.postMessage({type:'vocabulary:close',entryId:example.id},'*');return}
 if(b.dataset.guidanceAudio){if(!readOnly)openGuidanceChooser(b.dataset.guidanceAudio);return}
 if(b.dataset.audioChange){openAudioChooser(b.dataset.audioChange);return}
 if(b.dataset.imageReplace!==undefined){document.querySelector(`[data-image-file="${b.dataset.imageReplace}"]`).click();return}
 if(b.dataset.imagePreview!==undefined){const m=model.meanings[+b.dataset.imagePreview];const dialog=$('meaningImageDialog');dialog.querySelector('img').src=m.image.data;dialog.showModal();return}
 if(b.dataset.pos!==undefined){pos=b.dataset.pos;render();return}
 if(b.id==='saveExample'||b.id==='approveCatalog'){if(readOnly||(b.id==='approveCatalog'&&(!window.catalogPending||!window.catalogCanReview)))return;if(isChunkEntry&&!word().chunkType){toast('请选择词块类型');return}if(!word().displayWord?.trim()){toast('请填写单词');document.querySelector('[aria-label="'+(isChunkEntry?'词块':'单词')+'"]').focus();return}if(model.meanings.some(m=>(isChunkMeaning(m)?!String(m.AG||'').trim()||!String(m.AH||'').trim():!String(m.O||'').trim()))){toast('请填写中文释义或成对的释义词块（英、中）');return}if(!isChunkEntry&&(!model.positions.length||model.positions.some(p=>requiredPositionKeys(p.C).some(k=>!String(p[k]??'').trim())))){toast('请填写各词性的英美音标和发音音频');return}try{if(example?.catalog&&window.parent!==window){window.parent.postMessage({type:'vocabulary:save',entryId:example.id,approve:b.id==='approveCatalog',model:copy(model)},'*');return}localStorage.setItem(STORAGE,JSON.stringify({version:2,model}));dirty=false;toast('已保存到本机')}catch{toast('本机存储空间不足或不可用，修改仍保留在页面中')}return}
 if(b.dataset.unlink){const [i,c]=b.dataset.unlink.split(',').map(Number);model.meanings[i].chunks.splice(c,1);changed();render()}
 if(b.id==='addMeaning'){const m=Object.fromEntries(WORKBOOK_DATA.meanings.fields.map(f=>[f.key,'']));Object.assign(m,{B:selectedWord,I:pos,O:'',N:'高',examples:[],chunks:[],row:'meaning-'+Date.now()});const at=b.dataset.insertAfter===undefined?model.meanings.length:Number(b.dataset.insertAfter)+1;model.meanings.splice(at,0,m);changed();render();document.querySelector(`[data-meaning="${at}"] .meaning-text [data-view]`)?.click()}
 if(b.dataset.linkChunk!==undefined){const i=+b.dataset.linkChunk,host=document.querySelector(`[data-picker="${i}"]`);host.innerHTML='<div class="chunk-picker"><input aria-label="搜索词库词块" placeholder="搜索词库中的词块"><div class="chunk-results"></div></div>';const input=host.querySelector('input');input.oninput=()=>{const q=input.value.trim().toLowerCase();const matches=q?WORKBOOK_DATA.chunkLibrary.filter(c=>(c.word+' '+c.meaning).toLowerCase().includes(q)).slice(0,30):[];host.querySelector('.chunk-results').innerHTML=matches.map(c=>`<button data-chunk-id="${esc(c.id)}">${esc(c.word)}　${esc(c.meaning)}</button>`).join('');host.querySelectorAll('[data-chunk-id]').forEach(button=>button.onclick=()=>{const c=WORKBOOK_DATA.chunkLibrary.find(c=>c.id===button.dataset.chunkId);if(!model.meanings[i].chunks.some(x=>x.id===c.id)){model.meanings[i].chunks.push({...c,examples:[]});changed()}render()})};input.focus()}
 if(b.dataset.speak){const [i,c,j]=b.dataset.speak.split(',');speak((c===''?model.meanings[i].examples:model.meanings[i].chunks[c].examples)[j].en)}
 if(b.dataset.audioPlay){const a=audioBindings.get(b.dataset.audioPlay),file=a.obj._audio?.[a.key];if(!file?.data){if(example?.catalog&&window.parent!==window){window.parent.postMessage({type:'vocabulary:audio-play',entryId:example.id,name:a.obj[a.key]},'*');return}toast('尚未载入此音频文件，请先添加或更换音频');return}if(playingAudio)playingAudio.pause();playingAudio=new Audio(file.data);playingAudio.play().catch(()=>toast('此音频无法播放，请更换文件'))}
}
document.addEventListener('keydown',e=>{if(e.target.matches('[data-view]')&&['Enter',' '].includes(e.key)){e.preventDefault();activate(e.target);return}if(!e.altKey&&e.target.matches('[role="tab"]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...document.querySelectorAll('[role="tab"]')],i=tabs.indexOf(e.target);const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();document.querySelectorAll('[role="tab"]')[next].focus()}});

function reorderPosition(from,to){
 if(from===to||!model.positions[from]||!model.positions[to])return;
 const [item]=model.positions.splice(from,1);model.positions.splice(to,0,item);changed();render();
 document.querySelector(`#pos-${to}`)?.focus();
}
document.addEventListener('keydown',e=>{if(readOnly)return;const handle=e.target.closest('.pos-tabs [role=tab]');if(!handle||!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const from=model.positions.findIndex(p=>p.C===handle.dataset.pos);reorderPosition(from,from+(e.key==='ArrowRight'?1:-1))});
function reorderMeaning(from,to,after=false){
 if(readOnly)return;
 const source=model.meanings[from],target=model.meanings[to];if(!source||!target||source===target||source.I!==pos||target.I!==pos)return;
 const slots=model.meanings.map((m,i)=>m.I===pos?i:-1).filter(i=>i>=0),items=slots.map(i=>model.meanings[i]);
 items.splice(items.indexOf(source),1);items.splice(items.indexOf(target)+(after?1:0),0,source);slots.forEach((slot,i)=>model.meanings[slot]=items[i]);changed();render();
 document.querySelector(`[data-drag-meaning="${model.meanings.indexOf(source)}"]`)?.focus();
}
document.addEventListener('keydown',e=>{const handle=e.target.closest('[data-drag-meaning]');if(!handle||!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const from=Number(handle.dataset.dragMeaning),slots=model.meanings.map((m,i)=>m.I===pos?i:-1).filter(i=>i>=0),next=slots[slots.indexOf(from)+(e.key==='ArrowDown'?1:-1)];if(next!==undefined)reorderMeaning(from,next,e.key==='ArrowDown')});
const imageDialog=document.createElement('dialog');imageDialog.id='meaningImageDialog';imageDialog.className='gift-dialog';imageDialog.setAttribute('aria-label','释义图片预览');imageDialog.innerHTML='<button class="image-dialog-close" aria-label="关闭释义图片">×</button><img alt="释义图片">';document.body.append(imageDialog);imageDialog.querySelector('button').onclick=()=>imageDialog.close();imageDialog.onclick=e=>{if(e.target===imageDialog)imageDialog.close()};
$('closeGift').onclick=()=>$('giftDialog').close();$('giftDialog').onclick=e=>{if(e.target===$('giftDialog'))$('giftDialog').close()};
window.addEventListener('beforeunload',e=>{if(activeEditor)activeEditor.finish(true);if(dirty){e.preventDefault();e.returnValue=''}});
render();

let materialAudioRequest=null,materialPlaybackUrl=null;
function requestMaterialAudio(id){
 if(!example?.catalog||window.parent===window)return false;
 if(readOnly)return true;
 const target=audioBindings.get(id);if(!target)return true;
 const requestId=String(Date.now())+'-'+Math.random();
 materialAudioRequest={target,requestId};
 window.parent.postMessage({type:'vocabulary:audio-select',entryId:example.id,requestId,current:target.obj[target.key]||''},'*');
 return true;
}
window.addEventListener('message',event=>{
 if(event.source!==window.parent||window.parent===window||event.data?.entryId!==example?.id)return;
 const msg=event.data;
 if(msg.type==='vocabulary:audio-selected'&&materialAudioRequest?.requestId===msg.requestId&&!readOnly){
  const {target}=materialAudioRequest;materialAudioRequest=null;
  target.obj[target.key]=msg.item.name;target.obj._audio??={};target.obj._audio[target.key]={name:msg.item.name,assetId:msg.item.assetId,data:msg.item.data};
  changed();render();
 }
 if(msg.type==='vocabulary:audio-blob'){
  if(!msg.blob){toast('此素材仅有文件名记录，尚未载入音频文件');return}
  if(playingAudio)playingAudio.pause();if(materialPlaybackUrl)URL.revokeObjectURL(materialPlaybackUrl);
  materialPlaybackUrl=URL.createObjectURL(msg.blob);playingAudio=new Audio(materialPlaybackUrl);playingAudio.play().catch(()=>toast('音频无法播放'));
 }
});
window.addEventListener('pagehide',()=>{if(materialPlaybackUrl)URL.revokeObjectURL(materialPlaybackUrl)});
