const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-arena-release-afdb7y';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_4tzafERn3FcMpy4qAMgJ2YYapAS3')throw Error('Production changed; refresh exact baseline');
const files=[];function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Hash mismatch: '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-camera-settle-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const patch=execFileSync('git',['diff','887d527','--','engine/game-adapter.js'],{cwd:root});
execFileSync('git',['apply','--directory=public','--check','-'],{cwd:stage,input:patch});
execFileSync('git',['apply','--directory=public','-'],{cwd:stage,input:patch});
const id='pathfindr-camera-settle-20260907.46';
const edit=(name,fn)=>{const p=path.join(stage,'public',name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));};
edit('index.html',s=>{if(!s.includes('engine/game-adapter.js?v=45'))throw Error('Unexpected entry');return s.replace('engine/game-adapter.js?v=45','engine/game-adapter.js?v=46').replace(/config.js\?v=45/g,'config.js?v=46');});
edit('config.js',s=>s.replace(/buildId: '[^']+'/,`buildId: '${id}'`));
edit('build-info.json',()=>JSON.stringify({id,previousId:prod.id,previousDeployment:prod.url,scope:'Mobile normal-stroke camera settling; Circuit and Printshop unchanged'},null,2));
const allowed=new Set(['public/engine/game-adapter.js','public/index.html','public/config.js','public/build-info.json']);
for(const f of files)if(!allowed.has(f.path)&&!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Unrelated change: '+f.path);
console.log(JSON.stringify({stage,id,preserved:files.length-allowed.size,previousId:prod.id}));
