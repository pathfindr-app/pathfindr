/* Stage only reviewed game changes over the verified .36 production artifact. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const baseline='/Users/bradleyarakaki/Desktop/Pathfindr/output/releases/hardware36';
const target=path.join(root,'output/releases/launch37');
if(fs.existsSync(target))throw Error('Release directory already exists; inspect it instead of overwriting.');
const files=['index.html','game.js','config.js','build-info.json','payments.js',
 'engine/audio-reactivity.js','engine/collections.js','engine/edge-pan.js','engine/game-adapter.js',
 'engine/hardware-hud.css','engine/mobile-ui.js','engine/musical-routes.js','engine/share-cloud.js',
 'engine/share-ui.js','engine/world-renderer.js','engine/launch-polish.css','engine/onboarding.js'];
fs.cpSync(baseline,target,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(target,file));
// Cache keys are release-specific; never rewrite the user's original checkout.
const index=path.join(target,'index.html');let html=fs.readFileSync(index,'utf8');
for(const file of files.filter(f=>/\.(js|css)$/.test(f)))html=html.replace(new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\\?v=[^"\\s]+)?','g'),file+'?v=37');
fs.writeFileSync(index,html);
if(/prints\/|PRINT STUDIO/.test(html))throw Error('Unrelated Print Studio link in release.');
console.log(target);
