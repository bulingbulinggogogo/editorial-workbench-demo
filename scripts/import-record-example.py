"""Read the original workbook; export record rows without filling source blanks."""
import argparse, hashlib, json
from pathlib import Path
import openpyxl
from openpyxl.utils import get_column_letter
parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
args=parser.parse_args()
book=openpyxl.load_workbook(args.source,read_only=True,data_only=True)
sheets={'words':('词库-基础属性',0),'positions':('词库-音节音标',0),'meanings':('释义表—（内文+1批听力&人名地名&附录增）',1)}
entry={'word':'record','storage':'record-inline-excel-20261112-v1','sourceExact':True,'source':{'filename':args.source.name,'sha256':hashlib.sha256(args.source.read_bytes()).hexdigest(),'sheets':{}}}
for kind,(name,column) in sheets.items():
 rows=[]
 for number,values in enumerate(book[name].iter_rows(values_only=True),1):
  if values[column]!='record':continue
  row={'row':number,**{get_column_letter(i):('' if value is None else value) for i,value in enumerate(values,1)}}
  row['_sourceBlank']=[k for k,v in row.items() if v=='']
  rows.append(row)
 entry[kind]=rows
 entry['source']['sheets'][kind]={'sheet':name,'rows':[r['row'] for r in rows]}
assert [len(entry[k]) for k in sheets]==[1,3,6]
# This display property is a relocation of source B, not inferred syllabification.
entry['words'][0]['syllables']=entry['positions'][0]['B']
entry['words'][0]['displayWord']=entry['words'][0]['A']
root=Path(__file__).resolve().parents[1]
(root/'examples/present-editor/record-data.js').write_text('// Generated from the original Excel by scripts/import-record-example.py. Do not hand-fill blanks.\nwindow.PRESENT_EXAMPLE='+json.dumps(entry,ensure_ascii=False,indent=2)+';\n')
print(json.dumps(entry['source'],ensure_ascii=False,indent=2))
