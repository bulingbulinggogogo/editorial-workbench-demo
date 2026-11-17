const source=require('fs').readFileSync('tests/directory-controls.test.cjs','utf8').split('try {')[0];
new Function('require',source+`
try {
 run("drawBankList=()=>{};updateBasketButton=()=>{};commitWorkspace=fn=>{fn(data);return true}");
 run("data.listeningBank.materials['selection-test']={id:'selection-test',text:'original'};data.listeningRevisions ||= {};data.listeningRevisions['selection-test']={2:{material:{id:'selection-test',text:'historical'},questions:[]},3:{material:{id:'selection-test',text:'latest'},questions:[]}};data.listeningBasket=[];data.listeningBasketVersions={}");
 run("ListeningAssembly.select([{id:'selection-test',version:2}],true)");
 assert.equal(run("ListeningAssembly.keys()[0]"),'selection-test::V2');
 assert.equal(run("basketSource('selection-test').material.text"),'historical');
 run("ListeningAssembly.select([{id:'selection-test',version:3}],true)");
 assert.equal(run("ListeningAssembly.keys().length"),1);
 assert.equal(run("ListeningAssembly.keys()[0]"),'selection-test::V3');
 run("data.listeningRevisions['selection-test'][2].status='offline';ListeningAssembly.select([{id:'selection-test',version:2}],true)");
 assert.equal(run("ListeningAssembly.keys()[0]"),'selection-test::V3');
 assert.equal(run("listeningVersionSelectable('selection-test',2)"),false);
 assert.equal(run("listeningVersionSelectable('selection-test',1)"),true);
 run("ListeningAssembly.select([{id:'selection-test',version:3}],false)");
 assert.equal(run("ListeningAssembly.keys().length"),0);
 console.log('PASS historical version selection, exact source, version switching, offline guard and deselection');
}finally {w.close()}
`)(require);
