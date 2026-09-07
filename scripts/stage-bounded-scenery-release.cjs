const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-camera-settle-afq8GE';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_HftYU5dtYSYEfFmEShwzcvM6mgr3')throw Error('Production changed; refresh exact shared baseline');
const files=[];function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Hash mismatch: '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-bounded-scenery-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const changed=['game.js','engine/world-data.js','engine/world-renderer.js','engine/fallback-cities.js'];
const patch=execFileSync('git',['diff','4494048','--',...changed],{cwd:root});
execFileSync('git',['apply','--directory=public','--check','-'],{cwd:stage,input:patch});
execFileSync('git',['apply','--directory=public','-'],{cwd:stage,input:patch});
fs.cpSync(path.join(root,'data/cities/fallback'),path.join(stage,'public/data/cities/fallback'),{recursive:true});
const id='pathfindr-bounded-scenery-20260907.47';
const edit=(name,fn)=>{const p=path.join(stage,'public',name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));};
edit('index.html',s=>{
 for(const file of [...changed,'config.js','data/cities/fallback/catalog.js','data/cities/fallback/starter.js']){
  const pattern=new RegExp('(["\\\'])'+file.replaceAll('.','\\.')+'(?:\\?[^"\\\']*)?(["\\\'])','g');
  if(!pattern.test(s))throw Error('Missing asset reference '+file);pattern.lastIndex=0;s=s.replace(pattern,(_,a,b)=>a+file+'?v=47'+b);
 }return s;
});
edit('config.js',s=>s.replace(/buildId: '[^']+'/,`buildId: '${id}'`));
edit('build-info.json',()=>JSON.stringify({id,previousId:prod.id,previousDeployment:prod.url,scope:'Bound regional scenery before triangulation; preclip 36 packs; reject stale challenge maps. Circuit and Printshop unchanged.'},null,2));
const allowed=new Set([...changed,'index.html','config.js','build-info.json'].map(f=>'public/'+f));
for(const f of files)if(!allowed.has(f.path)&&!f.path.startsWith('public/data/cities/fallback/')&&!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Unrelated change: '+f.path);
console.log(JSON.stringify({stage,id,previousId:prod.id,preserved:files.filter(f=>!allowed.has(f.path)&&!f.path.startsWith('public/data/cities/fallback/')).length}));
