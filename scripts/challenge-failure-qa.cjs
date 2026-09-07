// Local-only negative test: the production loader's exhausted-retry contract.
const fs=require('node:fs'),crypto=require('node:crypto');let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
const hash=crypto.createHash('sha256').update(fs.readFileSync('game.js')).digest('hex').slice(0,12);
html=html.replace(/src="game.js\?v=[^"]+"/,`src="game.js?v=qa-${hash}"`);
html=html.replace('</body>',`<aside style="position:fixed;right:12px;top:110px;z-index:99999;background:#142028;color:#dceef0;padding:12px;font:12px monospace;max-width:300px"><button id="qa-challenge-failure">Test unavailable challenge map</button><output id="qa-challenge-result"></output></aside><script>
document.getElementById('qa-challenge-failure').onclick=async()=>{
 const original=loadRoadNetwork,toast=showToast;let message='';
 loadRoadNetwork=async()=>{};showToast=(text,...args)=>{message=text;return toast(text,...args);};
 try{await beginChallengeGame({id:'local-negative-test',city_name:'Unavailable test city',center_lat:0,center_lng:0,start_lat:0,start_lng:0,end_lat:.001,end_lng:.001});
 document.getElementById('qa-challenge-result').textContent=JSON.stringify({message,active:!!GameState.challengeState.activeChallenge,started:!!GameState.gameStarted});
 }finally{loadRoadNetwork=original;showToast=toast;}
};
</script></body>`);
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/challenge-failure-qa.html',html);
