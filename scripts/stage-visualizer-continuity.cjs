// Clone the verified CURRENT shared deployment. Never reconstruct the print shop.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-lobby-perf-vh9Um2';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_AAk8jKraGafbD89GKDmjz1hcox8Y')throw Error('Production changed; refresh the exact shared baseline first');
const files=[];function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Baseline hash mismatch: '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-continuity-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const changed=['game.js','engine/edge-pan.js','engine/game-adapter.js','engine/immersive.css','engine/immersive.js','engine/lobby-preload.js','engine/share-game.js','engine/visualizer-camera.js'];
const added=['engine/fallback-cities.js','engine/visualizer-preparation.js'];
const patch=execFileSync('git',['diff','c4c220a','--',...changed],{cwd:root});
execFileSync('git',['apply','--directory=public','--check','-'],{cwd:stage,input:patch});
execFileSync('git',['apply','--directory=public','-'],{cwd:stage,input:patch});
for(const f of added)fs.copyFileSync(path.join(root,f),path.join(stage,'public',f));
fs.cpSync(path.join(root,'data/cities/fallback'),path.join(stage,'public/data/cities/fallback'),{recursive:true});
const id='pathfindr-visualizer-continuity-20260907.45';
const edit=(name,fn)=>{const p=path.join(stage,'public',name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));};
edit('index.html',s=>{
 const insert=(pattern,lines)=>{if(!pattern.test(s))throw Error('Live entry script missing');s=s.replace(pattern,match=>match+'\n'+lines);};
 insert(/<script src="engine\/immersive.js(?:\?v=[^"]+)?"><\/script>/,'    <script src="engine/visualizer-preparation.js?v=45"></script>');
 insert(/<script src="data\/cities\/miami.js(?:\?v=[^"]+)?"><\/script>/,'    <script src="data/cities/fallback/catalog.js?v=45"></script>\n    <script src="data/cities/fallback/starter.js?v=45"></script>\n    <script src="engine/fallback-cities.js?v=45"></script>');
 for(const f of [...changed,'config.js'])s=s.replaceAll(new RegExp(f.replaceAll('.','\\.')+'(?:\\?v=[^"\\s]+)?(?=")','g'),f+'?v=45');return s;
});
edit('config.js',s=>s.replace(/buildId: '[^']+'/,`buildId: '${id}'`));
edit('build-info.json',()=>JSON.stringify({id,previousId:prod.id,previousDeployment:prod.url,scope:'Game Visualizer, 36 offline cities and mobile head-follow; Printshop unchanged'},null,2));
const allowed=new Set([...changed,...added,'index.html','config.js','build-info.json'].map(f=>'public/'+f));
for(const f of files)if(!allowed.has(f.path)&&!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Unrelated change: '+f.path);
console.log(JSON.stringify({stage,id,previousId:prod.id,preserved:files.filter(f=>!allowed.has(f.path)).length}));
