// Same application, no behavior overrides. Hash local asset URLs so browser
// caches cannot combine scripts from different development revisions.
const fs=require('node:fs'),crypto=require('node:crypto');
let html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">');
html=html.replace(/(src|href)="([^"?#]+)(?:\?[^"#]*)?"/g,(all,attribute,file)=>{
 if(/^(https?:|\/\/|#)/.test(file)||!fs.existsSync(file)||!fs.statSync(file).isFile())return all;
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
 return `${attribute}="${file}?qa=${hash}"`;
});
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/runtime-qa.html',html);
