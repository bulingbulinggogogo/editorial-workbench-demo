const fs=require('fs');
const setup=fs.readFileSync('tests/listening-bank-dom.test.cjs','utf8').split('(async()=>{')[0];
new Function('require',setup+String.raw`
(async()=>{
 w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
 w.confirm=()=>true;
 w.URL.createObjectURL=()=> 'blob:demo';w.URL.revokeObjectURL=()=>{};
 w.AudioContext=class{async decodeAudioData(){return {duration:11.35,getChannelData:()=>new Float32Array(1000)}}async close(){}};
 w.HTMLCanvasElement.prototype.getContext=()=>({setTransform(){},clearRect(){},fillRect(){}});
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.Blob.prototype.arrayBuffer=async()=>new ArrayBuffer(10);
 w.File.prototype.arrayBuffer=async()=>new ArrayBuffer(10);
 let network=0;w.fetch=async()=>{network++;throw Error('offline')};
 const wait=()=>new Promise(r=>setTimeout(r,60));
 run("page='listening-bank';delete data.listeningBatchDraft;renderListeningBank();openListeningCreate(true)");
 assert.equal(w.document.querySelectorAll('.lc-file-list li').length,3);assert.ok($('#lc-batch-raw').value.includes('station.aac'));
 $('#lc-next').click();await wait();assert.equal(w.document.querySelectorAll('[data-batch-record]').length,3);
 assert.equal(w.document.querySelectorAll('[data-question]').length,2);
 $('#lc-next').click();await wait();assert.ok($('#lc-sentences'));assert.equal(network,0);
 $('#lc-next').click();await wait();assert.ok($('.lc-clue-layout'));
 $('#lc-next').click();await wait();assert.ok($('#lc-translation-paste'));assert.ok($('#lc-translation-paste').value.includes('[R03-'));
 for(const tab of [...w.document.querySelectorAll('[data-batch-record]')].map(b=>b.dataset.batchRecord)){
  $('[data-batch-record="'+tab+'"]').click();
  const fields=[...w.document.querySelectorAll('[data-translation-code]')];assert.ok(fields.length>=12);assert.ok(fields.every(f=>f.value.trim()),'all transcript, stem and option translations prefilled');
 }
 $('#lc-import-translations').click();assert.equal(network,0);assert.ok([...w.document.querySelectorAll('[data-translation-code]')].every(f=>f.value.trim()));
 $('#lc-close').click();
 console.log('PASS three offline demo recordings, six questions, automatic alignment, full prefilled translations and recognition');w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1});
`)(require);
