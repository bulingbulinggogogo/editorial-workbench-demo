// Select an entry before the shared editor is initialized; no present/record fallback for invalid IDs.
(()=>{
 const id=new URLSearchParams(location.search).get('entry');if(!id)return;
 const params=new URLSearchParams(location.search);const entry=window.VocabularyCatalog.entries.find(e=>e.id===id)||(params.get('fresh')==='1'?{id,word:id,entryType:params.get('kind')==='chunk'?'chunk':'word',sourceExact:true,storage:'vocabulary-catalog-'+id+'-v1',words:[{A:id,row:'new-'+id,displayWord:'',chunkType:params.get('kind')==='chunk'?'短语动词':undefined}],positions:[],meanings:[]}:null);
 if(!entry){document.body.innerHTML='<p>词条不存在，请返回基础词库。</p>';throw new Error('Unknown vocabulary entry '+id)}
 window.PRESENT_EXAMPLE=JSON.parse(JSON.stringify(entry));
 window.PRESENT_EXAMPLE.catalog=true;
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||window.parent===window)return;
  const msg=event.data;if(msg?.entryId!==id)return;
  if(msg.type==='vocabulary:init'&&msg.model){window.catalogPending=msg.pending===true;window.catalogCanReview=msg.canReview===true;window.catalogAudit=msg.audit||null;window.guidanceWords=msg.guidanceWords||[];model=copy(msg.model);pos=model.positions[0]?.C||'';wordInit();dirty=false;render()}
  if(msg.type==='vocabulary:saved'){if(msg.model)model=copy(msg.model);window.catalogPending=msg.pending===true;window.catalogCanReview=msg.canReview===true;window.catalogAudit=msg.audit||null;dirty=false;render();toast('已保存');}
  if(msg.type==='vocabulary:error')toast('保存失败，修改仍保留在页面中');
 });
})();
