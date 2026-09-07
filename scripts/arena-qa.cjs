// Generated local-only UI test surface. Uses the normal game time hook; no grants or state cheats.
const fs=require('node:fs');let html=fs.readFileSync('arena/index.html','utf8').replace('<head>','<head><base href="/arena/">');
html=html.replace('</body>','<aside style="position:fixed;right:12px;top:210px;z-index:99"><button onclick="advanceTime(10000)">QA advance 10 seconds</button><button onclick="advanceTime(300000)">QA advance 5 minutes</button></aside></body>');
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/arena-qa.html',html);
