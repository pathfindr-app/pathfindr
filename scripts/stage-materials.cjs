// Preserve the current shared deployment; overlay ONLY this game's materials.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),cached='/tmp/pathfindr-prints-accounts-release';
const api=p=>JSON.parse(execFileSync('vercel',['api',p,'--scope','pathfindr-apps-projects'],{encoding:'utf8'}));
const prod=api('/v13/deployments/www.pathfindr.world');
const tree=api(`/v6/deployments/${prod.id}/files`),files=[];
function walk(items,prefix=''){for(const f of items){const p=prefix+f.name;if(f.type==='directory')walk(f.children,p+'/');else files.push({path:p,sha:f.uid});}}
walk(tree.find(f=>f.name==='src').children);
const hash=b=>crypto.createHash('sha1').update(b).digest('hex');
for(const f of files)if(hash(fs.readFileSync(path.join(cached,f.path)))!==f.sha)throw Error('Production cache mismatch: '+f.path);
const stage=fs.mkdtempSync('/tmp/pathfindr-materials-');
for(const f of files){const dest=path.join(stage,f.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(cached,f.path),dest,fs.constants.COPYFILE_FICLONE);}
fs.cpSync(path.join(cached,'.vercel'),path.join(stage,'.vercel'),{recursive:true});
const overlay=['game.js','engine/world-renderer.js','engine/musical-routes.js','engine/collections.js','engine/discovery-emblems.css','engine/hardware-hud.css','engine/audio-reactivity.js','engine/trace-input.js','engine/game-adapter.js'];
for(const name of overlay)fs.copyFileSync(path.join(root,name),path.join(stage,'public',name));
const id='pathfindr-instruments-audio-20260906.39';
let index=fs.readFileSync(path.join(stage,'public/index.html'),'utf8');
for(const file of ['config.js',...overlay])index=index.replace(new RegExp(file.replaceAll('.','\\.')+'\\?v=\\d+','g'),file+'?v=39');
index=index.replace('</head>','<link rel="stylesheet" href="engine/discovery-emblems.css?v=39" />\n</head>');
fs.writeFileSync(path.join(stage,'public/index.html'),index);
const configPath=path.join(stage,'public/config.js');fs.writeFileSync(configPath,fs.readFileSync(configPath,'utf8').replace(/buildId: '[^']+'/,`buildId: '${id}'`));
fs.writeFileSync(path.join(stage,'public/build-info.json'),JSON.stringify({id,previousDeployment:prod.url,previousId:prod.id,scope:'Game materials only; deployed Printshop preserved'},null,2));
const allowed=new Set(['public/index.html','public/config.js','public/build-info.json',...overlay.map(f=>'public/'+f)]);
for(const f of files)if(!allowed.has(f.path)&&hash(fs.readFileSync(path.join(stage,f.path)))!==f.sha)throw Error('Unrelated change: '+f.path);
fs.writeFileSync(path.join(root,'output/material-release.json'),JSON.stringify({stage,id,previousId:prod.id,previousUrl:prod.url,preservedFiles:files.length-allowed.size},null,2));
console.log(JSON.stringify({stage,id,previousId:prod.id,preservedFiles:files.length-allowed.size}));
