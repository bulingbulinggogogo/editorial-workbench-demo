const fs=require('fs');
const setup=fs.readFileSync('tests/workspace.test.cjs','utf8').split('\n').slice(0,7).join('\n');
new Function('require',setup+`
for(const f of ['book-690.js','book-content.js','suite-editor.js','recording-audio.js','book-blocks.js','listening-bank.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
run(\`const book=data.books.find(b=>b.sourceBookId==='690');
const directoryBefore=JSON.stringify(bookDirectoryNodes(book));
const b2=builtinBook690.suites.filter(s=>String(s['旧单元id'])==='19392');
for(const suite of b2){const id=String(suite['旧套题id']),content=localSuiteContent(book,{id:'suite-'+id,sourceSuiteId:id});
book.listeningRefs['suite-'+id]=true;
for(const m of content.scripts)data.listeningBank.materials[m.id]=structuredClone(m);
for(const q of content.questions){const {number,...fields}=q;data.listeningBank.questions[q.id]=fields}}
const removed=Object.values(bankData().questions).find(q=>!Object.values(bankData().materials).find(m=>m.id===q.scriptId)?.unit);
removed.text='B1U2 已编辑题干';removed.analysisText='B1U2 共用解析';
const copied=localSuiteContent(book,{id:'suite-'+b2[0]['旧套题id'],sourceSuiteId:String(b2[0]['旧套题id'])});
data.books.push({id:'copy',name:'引用书',directoryNodes:[{id:'copy-suite',kind:'套题',name:'引用套题'}],suiteContent:{'copy-suite':copied}});
data.listeningBank.imports.b1u1b1u2.version=2;\`);
assert.equal(run('Object.keys(bankData().questions).length'),120);
assert.equal(run('migrateListening690(data)'),true);
assert.equal(run('Object.keys(bankData().questions).length'),60);
assert.equal(run('Object.keys(bankData().materials).length'),30);
assert.equal(run('JSON.stringify(bookDirectoryNodes(book))'),run('directoryBefore'));
assert.ok(run("Object.values(book.suiteContent).some(c=>c.questions.some(q=>q.text==='B1U2 已编辑题干'&&q.analysisText==='B1U2 共用解析'))"));
assert.ok(run("data.books.find(b=>b.id==='copy').suiteContent['copy-suite'].questions.some(q=>q.analysisText==='B1U2 共用解析')"));
assert.equal(run('migrateListening690(data)'),false);
run('const restored=parseAppData(serializeAppData(data));hydrateBuiltin690(restored)');
assert.equal(run('Object.keys(restored.listeningBank.questions).length'),60);
assert.ok(run("Object.values(restored.books.find(b=>b.sourceBookId==='690').suiteContent).some(c=>c.questions.some(q=>q.analysisText==='B1U2 共用解析'))"));
console.log('PASS: 120 -> 60 migration preserves book directory, excluded edits/analysis and other book references across reload');
`)(require);
