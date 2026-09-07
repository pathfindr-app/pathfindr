// Verify served prototype bytes, not just a successful SPA/redirect response.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const origin=process.argv[2],preview=process.argv.includes('--preview');
if(!origin)throw Error('Usage: node check-arena-release.cjs ORIGIN [--preview]');
for(const file of ['index.html','arena.css','core.js','app.js']){
 const urlPath=file==='index.html'?'/arena/':'/arena/'+file;
 const args=preview?['curl',urlPath,'--deployment',origin,'--scope','pathfindr-apps-projects','--','-fsS']:['-fsS',origin.replace(/\/$/,'')+urlPath];
 const served=execFileSync(preview?'vercel':'curl',args,{maxBuffer:4*1024*1024});
 assert.ok(served.equals(fs.readFileSync(path.resolve(__dirname,'../arena',file))),'Served bytes differ: '+urlPath);
 console.log('PASS '+urlPath);
}
