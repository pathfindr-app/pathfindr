/* Local-only deterministic UI harness; never stage output/ in production. */
const fs=require('node:fs');
let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
html=html.replace('<div class="location-options">','<div class="location-options"><button class="location-option" data-mode="miami">QA Miami</button>');
html=html.replace('</body>',`<pre id="qa-errors" style="position:fixed;bottom:0;z-index:99999;color:red;pointer-events:none"></pre><script>const qaError=console.error;console.error=(...args)=>{if(String(args[0]).includes('Render loop'))document.getElementById('qa-errors').textContent=args.map(a=>a?.stack||String(a)).join(' ').slice(0,1200);qaError(...args)};getNextVisualizerCity=async()=>({...PathfindrCityPacks.miami.location,packId:'miami'});</script></body>`);
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/survey-preview.html',html);
