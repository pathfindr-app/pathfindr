// Patch the verified current shared production; retain every non-game file.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),cache='/tmp/pathfindr-survey-lLW5Ks';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8'}));
const prod=api('/v13/deployments/www.pathfindr.world');
if(prod.id!=='dpl_BR3z4CckNcnmVkfjTvtU7fhBdLqV')throw Error('Production changed; refresh baseline before release');
const files=[];function walk(items,p=''){for(const f of items)f.type==='directory'?walk(f.children,p+f.name+'/'):files.push({path:p+f.name,sha:f.uid});}
walk(api(`/v6/deployments/${prod.id}/files`).find(f=>f.name==='src').children);
for(const f of files)if(crypto.createHash('sha1').update(fs.readFileSync(path.join(cache,f.path))).digest('hex')!==f.sha)throw Error('Cache mismatch '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-recap-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cache,f.path),dest);}
fs.cpSync(path.join(cache,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const patch=execFileSync('git',['diff','1a36d23','--','game.js'],{cwd:root});
execFileSync('git',['apply','--directory=public','--check','-'],{cwd:stage,input:patch});
execFileSync('git',['apply','--directory=public','-'],{cwd:stage,input:patch});
const id='pathfindr-recap-stability-20260907.43';
const edit=(name,fn)=>{const p=path.join(stage,'public',name);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')))};
edit('index.html',s=>s.replace('game.js?v=42','game.js?v=43').replace('config.js?v=42','config.js?v=43'));
edit('config.js',s=>s.replace(/buildId: '[^']+'/,`buildId: '${id}'`));
edit('build-info.json',()=>JSON.stringify({id,previousId:prod.id,previousDeployment:prod.url,scope:'Recap rendering only; Printshop unchanged'},null,2));
const allowed=new Set(['public/game.js','public/index.html','public/config.js','public/build-info.json']);
for(const f of files)if(!allowed.has(f.path)&&!fs.readFileSync(path.join(stage,f.path)).equals(fs.readFileSync(path.join(cache,f.path))))throw Error('Unrelated change '+f.path);
console.log(JSON.stringify({stage,id,previousId:prod.id}));
