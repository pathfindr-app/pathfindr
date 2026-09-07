const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../data/cities/fallback');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
fs.writeFileSync(path.join(dir,'catalog.js'),'window.PathfindrFallbackCatalog='+JSON.stringify(manifest.cities)+';\n');
const starters={};for(const id of ['washington','paris'])starters['fallback-'+id]=JSON.parse(fs.readFileSync(path.join(dir,id+'.json')));
fs.writeFileSync(path.join(dir,'starter.js'),'Object.assign(window.PathfindrCityPacks ||= {},'+JSON.stringify(starters)+');\n');
console.log(JSON.stringify({cities:manifest.cities.length,starterBytes:fs.statSync(path.join(dir,'starter.js')).size}));
