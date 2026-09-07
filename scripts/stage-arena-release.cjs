// Add the isolated prototype to the exact current shared production release.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-continuity-gEweRG';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_Cx4CYnfmrzSPEpHH2WQgZfQyHwYW')throw Error('Production changed: refresh and verify the shared baseline before staging');
const files=[];
function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Baseline hash mismatch: '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-arena-release-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
fs.mkdirSync(path.join(stage,'public/arena'),{recursive:true});
for(const file of ['index.html','arena.css','core.js','app.js']){
 const dest=path.join(stage,'public/arena',file);
 if(fs.existsSync(dest))throw Error('Refusing to overwrite an existing arena: '+file);
 fs.copyFileSync(path.join(root,'arena',file),dest);
}
for(const f of files)if(!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Existing production file changed: '+f.path);
console.log(JSON.stringify({stage,previousId:prod.id,previousDeployment:prod.url,preserved:files.length,added:4}));
