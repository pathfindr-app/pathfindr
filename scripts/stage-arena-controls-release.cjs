// Preserve the exact current shared site; replace only the isolated Circuit files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-bounded-scenery-EMadYw';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_8gTog7HcR5jtgqfeizAXHhfhXBMc')throw Error('Production changed: refresh the exact shared source baseline first');
const files=[];function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Baseline hash mismatch: '+f.path);
const shared=['route-input','trace-guide','trace-input','edge-pan','motion','visual-fidelity','search-afterglow','route-cinema'];
for(const file of shared)if(!fs.readFileSync(path.join(root,'engine',file+'.js')).equals(fs.readFileSync(path.join(cache,'public/engine',file+'.js'))))throw Error('Shared dependency differs from tested source: '+file);
const stage=fs.mkdtempSync('/tmp/pathfindr-arena-controls-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const changed=['index.html','arena.css','core.js','keyboard.js','input.js','presentation.js','app.js'];
for(const file of changed)fs.copyFileSync(path.join(root,'arena',file),path.join(stage,'public/arena',file));
for(const f of files)if(!changed.some(file=>f.path==='public/arena/'+file)&&!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Unrelated production change: '+f.path);
console.log(JSON.stringify({stage,previousId:prod.id,previousDeployment:prod.url,changed,preserved:files.filter(f=>!f.path.startsWith('public/arena/')).length}));
