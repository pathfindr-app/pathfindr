// Local deterministic startup diagnostic. Not part of any deployment.
const fs=require('node:fs'),crypto=require('node:crypto');
let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
html=html.replace(/src="([^"?]+)(?:\?[^"]*)?"/g,(all,file)=>{
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return all;
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);return `src="${file}?qa=${hash}"`;
});
html=html.replace('</body>',`<output id="camera-qa" style="position:fixed;right:0;top:140px;max-width:180px;z-index:9999;pointer-events:none;color:#cde8eb;background:#121820;font:9px monospace"></output><script>
requestVisualizerFullscreen=()=>{};
takeReadyCity=async mode=>{const id=new URLSearchParams(location.search).get('city')||(mode==='global'?'paris':'washington');const pack=await PathfindrFallbackCities.load(id);return {city:{...pack.location},data:pack.roads,scene:pack};};
const cameraQaFetch=window.fetch;window.fetch=(url,options)=>/overpass|maps.mail.ru/.test(String(url))?Promise.reject(Error('QA disconnected map provider')):cameraQaFetch(url,options);
setInterval(()=>{const node=GameState.nodes.get(getActivePathAnchorNode()),head=node?GameState.map.project([node.lng,node.lat]):null;
 document.getElementById('camera-qa').textContent=JSON.stringify({phase:GameController.phase,input:PathfindrTrace.mode,head:head&&[Math.round(head.x),Math.round(head.y)],nodes:GameState.userPathNodes.length,center:GameState.map.getCenter()});},250);
</script></body>`);
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/camera-qa.html',html);
