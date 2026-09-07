// Fail closed if the shared production changed. Preserve every Printshop byte.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-recap-VKHB8z';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8',maxBuffer:64*1024*1024}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_4nrDGPZqRHSX1FDCqvvwSGfuSJUR')throw Error('Production changed; refresh baseline');
const files=[];function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Cache mismatch '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-lobby-perf-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const changed=['game.js','ads.js','config.js','index.html','engine/city-scene.js','engine/immersive.css','engine/lobby-preload.js','engine/map-labels.js','engine/survey-context.js','engine/world-renderer.js'];
const patch=execFileSync('git',['diff','4207adc','--',...changed.filter(f=>f!=='index.html')],{cwd:root});
execFileSync('git',['apply','--directory=public','--check','-'],{cwd:stage,input:patch});
execFileSync('git',['apply','--directory=public','-'],{cwd:stage,input:patch});
const id='pathfindr-lobby-performance-20260907.44';
const edit=(name,fn)=>{const p=path.join(stage,'public',name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')))};
edit('index.html',s=>{
    const replacements=[['<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9697527729469740" crossorigin="anonymous"></script>',''],['pathfindr<span aria-hidden="true">↗</span>','pathfindr'],['Play a round <span aria-hidden="true">↗</span>','Play a round']];
    for(const [before,after]of replacements){if(s.split(before).length!==2)throw Error('Unexpected live lobby markup');s=s.replace(before,after);}return s;
});
edit('index.html',s=>{for(const f of changed.filter(f=>/\.(js|css)$/.test(f)))s=s.replaceAll(new RegExp(f.replaceAll('.','\\.')+'\\?v=[^"\\s]+','g'),f+'?v=44');return s;});
edit('config.js',s=>s.replace(/buildId: '[^']+'/,`buildId: '${id}'`));
edit('build-info.json',()=>JSON.stringify({id,previousId:prod.id,previousDeployment:prod.url,scope:'Game loading, rendering, ads disabled; Printshop unchanged'},null,2));
const allowed=new Set([...changed.map(f=>'public/'+f),'public/build-info.json']);
for(const f of files)if(!allowed.has(f.path)&&!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Unrelated change '+f.path);
console.log(JSON.stringify({stage,id,previousId:prod.id,preserved:files.filter(f=>!allowed.has(f.path)).length}));
