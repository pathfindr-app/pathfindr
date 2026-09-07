// Local-only gate isolates reserve selection from graph/scenery installation.
const fs=require('node:fs');let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
html=html.replace('</body>',`<aside style="position:fixed;top:110px;left:10px;z-index:99999;background:#142028;color:#dceef0;padding:12px;font:12px monospace;max-width:360px"><output id="startup-state">Choose a city normally.</output><button id="startup-continue" disabled>Install selected city</button></aside><script>
const startupTake=takeReadyCity;
takeReadyCity=async (...args)=>{const reserve=await startupTake(...args),s=reserve.scene;
 document.getElementById('startup-state').textContent=JSON.stringify({city:reserve.city,roads:reserve.data?.elements?.length,buildings:s?.buildings?.features?.length,world:s?.world?.features?.length});
 await new Promise(resolve=>{const button=document.getElementById('startup-continue');button.disabled=false;button.onclick=()=>{button.disabled=true;resolve();};});return reserve;};
</script></body>`);
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/startup-qa.html',html);
