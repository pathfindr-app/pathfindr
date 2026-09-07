// Generated local-only UI test surface. Uses the normal game time hook; no grants or state cheats.
const fs=require('node:fs');let html=fs.readFileSync('arena/index.html','utf8').replace('<head>','<head><base href="/arena/">');
html=html.replace('</body>','<aside style="position:fixed;right:12px;top:210px;z-index:99"><button onclick="advanceTime(10000)">QA advance 10 seconds</button><button onclick="advanceTime(300000)">QA advance 5 minutes</button></aside></body>');
const crypto=require('node:crypto');html=html.replace(/(src|href)="((?:\.\.\/engine\/|)(?:[\w-]+\.(?:js|css)))(?:\?[^"]*)?"/g,(all,attr,file)=>{const path=require('node:path').resolve('arena',file);if(!fs.existsSync(path))return all;return `${attr}="${file}?qa=${crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0,12)}"`;});
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/arena-qa.html',html);
