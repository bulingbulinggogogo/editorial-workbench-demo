"""Read the source workbook without changing it; preserve every original field and ID."""
import json,openpyxl
from pathlib import Path
source=Path('/Users/baokeyu/Documents/Codex/2026-09-29/zhe/outputs/听力一期一批_词库_最终清理.xlsx')
book=openpyxl.load_workbook(source,read_only=True,data_only=True)
tables={}
for sheet in book:
 rows=list(sheet.values);headers=list(rows[0]);tables[sheet.title]={'headers':headers,'rows':[list(r) for r in rows[1:] if any(v is not None for v in r)]}
words={r[0] for r in tables['单词']['rows']};positions={r[2]:r[0] for r in tables['词性']['rows']}
assert len(words)==len(tables['单词']['rows'])
assert len(positions)==len(tables['词性']['rows'])
assert len({r[4] for r in tables['释义']['rows']})==len(tables['释义']['rows'])
assert all(r[0] in words for r in tables['词性']['rows'])
assert all(positions.get(r[2])==r[0] for r in tables['释义']['rows'])
Path('vocabulary-seed.js').write_text('window.VocabularySeed='+json.dumps(tables,ensure_ascii=False,separators=(',',':'))+';\n')
print({k:len(v['rows']) for k,v in tables.items()})
