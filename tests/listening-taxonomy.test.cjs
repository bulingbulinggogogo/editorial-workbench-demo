const fs=require('fs');
const setup=fs.readFileSync('tests/listening-bank-dom.test.cjs','utf8').split('(async()=>{')[0];
new Function('require',setup+String.raw`
(async()=>{
w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
const wait=()=>new Promise(r=>setTimeout(r,30));
const change=(el,value)=>{el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
run("commitWorkspace(d=>{d.listeningBank.materials['TAX']={id:'TAX',text:'Hello.',topics:['学校生活'],questionType:'短对话',segments:[]};for(let i=0;i<2;i++)d.listeningBank.questions['TAX-Q'+i]={id:'TAX-Q'+i,scriptId:'TAX',text:'Where?',questionType:'短对话',examPoints:['地点与去向'],examPointSecondary:i?'目的地':'所在地点',abilities:['能力1'],options:[{key:'A',text:'Here.'}],answerKey:'A'}})");
if($('#listening-create'))$('#lc-close').click();run('openListeningCreate(true,{materialId:"TAX"})');await wait();
assert.equal(w.document.querySelectorAll('[data-qfield=questionType]').length,0);
assert.equal($('[data-question="0"] [data-qfield=examPointSecondary]').value,'所在地点');assert.equal($('[data-question="1"] [data-qfield=examPointSecondary]').value,'目的地');
change($('#lc-edit-record-type'),'独白');
change($('#lc-edit-topic-secondary'),'校园活动');change($('#lc-edit-topic'),'旅行');assert.equal($('#lc-edit-topic-secondary').value,'');assert.deepEqual(Array.from($('#lc-edit-topic-secondary').options,o=>o.value),['','交通出行','行程安排']);change($('#lc-edit-topic-secondary'),'行程安排');
const parent=$('[data-question="0"] [data-qfield=examPoints]'),child=$('[data-question="0"] [data-qfield=examPointSecondary]');change(parent,'原因与目的');assert.equal(child.value,'');assert.deepEqual(Array.from(child.options,o=>o.value),['','原因','目的']);change(child,'原因');
assert.equal(run("listeningSecondaryValue('examPoints','人物与事件','目的地')"),'');
$('#lc-save-progress').click();await wait();assert.equal(run('bankData().materials.TAX.questionType'),'独白');assert.equal(run('bankData().materials.TAX.topicSecondary'),'行程安排');assert.equal(run("bankData().questions['TAX-Q0'].examPointSecondary"),'原因');assert.equal(run("bankData().questions['TAX-Q1'].examPointSecondary"),'目的地');assert.equal(run("bankData().questions['TAX-Q1'].questionType"),'独白');
if($('#listening-create'))$('#lc-close').click();run('openListeningCreate(true,{materialId:"TAX"})');await wait();assert.equal($('#lc-edit-record-type').value,'独白');assert.equal($('#lc-edit-topic-secondary').value,'行程安排');assert.equal($('[data-question="0"] [data-qfield=examPointSecondary]').value,'原因');
change($('#lc-edit-topic'),'其他');assert.equal($('#lc-edit-topic-secondary').disabled,true);assert.equal($('#lc-edit-topic-secondary').value,'');assert.equal($('#listening-create [required]'),null);$('#lc-close').click();
console.log('PASS: parent-child restrictions, clearing on parent change, separate question values, persistence and recording-level type');
w.BookUI.disposeTable();dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
`)(require);
