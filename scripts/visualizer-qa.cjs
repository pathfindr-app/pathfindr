/* Local test surface only: uses real fallback packs, no fullscreen takeover. */
const fs=require('node:fs');let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
html=html.replace('</body>',`<div style="position:fixed;right:8px;bottom:30px;z-index:9999;font:10px monospace"><button id="qa-next-city">QA next city</button><pre id="qa-state" style="max-width:400px;color:#cce0e0;pointer-events:none"></pre></div><script>
requestVisualizerFullscreen=()=>{};
document.getElementById('qa-next-city').onclick=()=>{GameState.visualizerState.currentVisualization=GameState.visualizerState.maxPerCity;};
const qaFetch=window.fetch;window.fetch=(url,options)=>/overpass|maps.mail.ru/.test(String(url))?Promise.reject(Error('QA simulated map API disconnect')):qaFetch(url,options);
setInterval(()=>{const s=JSON.parse(render_game_to_text());document.getElementById('qa-state').textContent=JSON.stringify({phase:s.phase,city:s.city,paused:!!GameState.visualizerState.paused,sequence:Math.round(GameState.vizState.sequenceMs||0),pitch:GameState.map.getPitch(),queue:VisualizerPreparedRoutes.state(),packs:PathfindrFallbackCities.state(),sceneError:s.cityScene.error});},300);
</script></body>`);
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/visualizer-qa.html',html);
