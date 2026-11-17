"""Read-only Excel selection for the 20-entry vocabulary demonstration."""
from pathlib import Path
import json,hashlib,openpyxl
from openpyxl.utils import get_column_letter
root=Path(__file__).resolve().parents[1]
p=Path('/Users/baokeyu/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_92fcl79py8ih12_e429/msg/file/2026-11/【词库】释义总表+基础属性+音节音标-20261112-1128.xlsx')
w=openpyxl.load_workbook(p,read_only=True,data_only=True)
sheets={k:list(w[n].values) for k,n in [('words','词库-基础属性'),('positions','词库-音节音标'),('meanings','释义表—（内文+1批听力&人名地名&附录增）')]}
def row(values,n):
 r={'row':n,**{get_column_letter(i):v if v is not None else '' for i,v in enumerate(values,1)}};r['_sourceBlank']=[k for k,v in r.items() if v==''];return r
def select(kind,name):return [row(r,n) for n,r in enumerate(sheets[kind],1) if r[1 if kind=='meanings' else 0]==name]
entries=[]
for i,name in enumerate(['record','set','back','clear','up','present1','present2','card','refer','invalid']):
 e={'id':str(90001+i),'word':name,'entryType':'word','sourceExact':True,**{k:select(k,name) for k in sheets}};assert e['words'] and e['meanings'];e['words'][0]['displayWord']=name;e['words'][0]['syllables']=e['positions'][0].get('B','') if e['positions'] else '';entries.append(e)
choices=[(1326,'短语动词'),(2736,'短语动词'),(13906,'动词短语'),(13070,'动词短语'),(150,'介词短语'),(5307,'名词短语'),(17512,'介词短语'),(28,'动词短语'),(20990,'动词短语'),(11690,'介词短语')]
for i,(n,typ) in enumerate(choices):
 source=sheets['meanings'][n-1];name=source[32];ms=[row(r,j) for j,r in enumerate(sheets['meanings'],1) if r[32]==name]
 for m in ms:m.update(B=name,I='',O=m['AH'],AG='',AH='',examples=[],chunks=[])
 entries.append({'id':str(90101+i),'word':name,'entryType':'chunk','chunkType':typ,'sourceExact':True,'words':[{'row':'chunk-'+str(n),'A':name,'displayWord':name,'chunkType':typ}],'positions':[],'meanings':ms})
for e in entries:e['storage']='vocabulary-catalog-'+e['id']+'-v1'
(root/'vocabulary-catalog-data.js').write_text('window.VocabularyCatalog='+json.dumps({'entries':entries,'chunkTypes':['短语动词','动词短语','名词短语','介词短语','形容词短语','副词短语','固定表达'],'source':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()},ensure_ascii=False)+';\n')
report=['# 基础词库演示案例','', '来源：'+p.name,'','只读提取。单词保留 Excel 全部释义及词性；词块从主表 AG/AH 提取，按相同英文词块合并多个中文义。词块类型为演示人工分类，不冒充 Excel 原字段。未补造音标、词形或例句。状态流程未确认时显示 —。','','| ID | 类型 | 词条 | 词性数 | 释义数 | 含释义词块 |','|---|---|---|---:|---:|---:|']
for e in entries:report.append(f"| {e['id']} | {e.get('chunkType','单词')} | {e['word']} | {len(e['positions'])} | {len(e['meanings'])} | {sum(bool(m.get('AG')) for m in e['meanings'])} |")
(root/'docs/vocabulary-demo-cases.md').write_text('\n'.join(report)+'\n');print('\n'.join(report))
