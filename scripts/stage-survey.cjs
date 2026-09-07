/* Scoped game diff on the current shared production. Fail closed on any drift. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cached='/tmp/pathfindr-prints-next-release';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8'}));
const prod=api('/v13/deployments/www.pathfindr.world'),tree=api(`/v6/deployments/${prod.id}/files`),files=[];
function walk(items,prefix=''){for(const f of items){const p=prefix+f.name;if(f.type==='directory')walk(f.children,p+'/');else files.push({path:p,sha:f.uid});}}
walk(tree.find(f=>f.name==='src').children);
const hash=b=>crypto.createHash('sha1').update(b).digest('hex');
for(const f of files)if(hash(fs.readFileSync(path.join(cached,f.path)))!==f.sha)throw Error('Production cache mismatch: '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-survey-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cached,f.path),dest,fs.constants.COPYFILE_FICLONE);}
fs.cpSync('/tmp/pathfindr-materials-rpXXWH/.vercel',path.join(stage,'.vercel'),{recursive:true});
const changed=['game.js','index.html','engine/collections.js','engine/emission.js','engine/city-scene.js','engine/route-cinema.js','engine/visualizer-camera.js'];
const added=['engine/round-metrics.js','engine/visual-fidelity.js','engine/survey-context.js','engine/immersive.js','engine/immersive.css'];
const patch=execFileSync('git',['diff','55227c5','--',...changed],{cwd:root});
execFileSync('git',['apply','--directory=public','--check','-'],{cwd:stage,input:patch});
execFileSync('git',['apply','--directory=public','-'],{cwd:stage,input:patch});
for(const name of added)fs.copyFileSync(path.join(root,name),path.join(stage,'public',name));
const id='pathfindr-survey-score-20260907.42';
const indexPath=path.join(stage,'public/index.html');let index=fs.readFileSync(indexPath,'utf8');
for(const file of ['config.js',...changed.filter(f=>f!=='index.html')])index=index.replace(new RegExp(file.replaceAll('.','\\.')+'(?:\\?v=\\d+)?(?=")','g'),file+'?v=42');
fs.writeFileSync(indexPath,index);
const configPath=path.join(stage,'public/config.js');fs.writeFileSync(configPath,fs.readFileSync(configPath,'utf8').replace(/buildId: '[^']+'/,`buildId: '${id}'`));
fs.writeFileSync(path.join(stage,'public/build-info.json'),JSON.stringify({id,previousDeployment:prod.url,previousId:prod.id,scope:'Game survey and scoring only; current Printshop retained byte-for-byte'},null,2));
const allowed=new Set([...changed,...added,'config.js','build-info.json'].map(f=>'public/'+f));
for(const f of files)if(!allowed.has(f.path)&&hash(fs.readFileSync(path.join(stage,f.path)))!==f.sha)throw Error('Unrelated change: '+f.path);
fs.writeFileSync(path.join(root,'output/survey-release.json'),JSON.stringify({stage,id,previousId:prod.id,previousUrl:prod.url,preservedFiles:files.filter(f=>!allowed.has(f.path)).length},null,2));
console.log(JSON.stringify({stage,id,previousId:prod.id}));
