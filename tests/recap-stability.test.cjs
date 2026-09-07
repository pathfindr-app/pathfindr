const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');
test('recap electricity has identical brightness for repeated paints and bounded slow motion',()=>{
 const start=source.indexOf('    getFlicker() {'),end=source.indexOf('\n    },',start)+7;
 const obj=vm.runInNewContext('({time:0,'+source.slice(start,end)+'})',{Math});
 for(let t=0;t<20;t+=.1){obj.time=t;const a=obj.getFlicker();assert.equal(a,obj.getFlicker());assert.ok(a>=.95&&a<=1.05);obj.time=t+.1;assert.ok(Math.abs(obj.getFlicker()-a)<.008);}
});
test('same-size viewport notifications do not erase canvas pixels',()=>{
 let writes=0;const canvas=()=>{let w=390,h=844;return {get width(){return w},set width(v){writes++;w=v},get height(){return h},set height(v){writes++;h=v}}};
 const container={offsetWidth:390,offsetHeight:844};const context={document:{getElementById:()=>container},GameState:{drawCanvas:canvas(),vizCanvas:canvas(),previewCanvas:canvas()},refreshMapPresentation(){}};
 const start=source.indexOf('function resizeCanvases()'),end=source.indexOf('\nfunction ',start+10);
 vm.runInNewContext(source.slice(start,end)+';resizeCanvases();resizeCanvases();',context);assert.equal(writes,0);
 container.offsetHeight=800;vm.runInNewContext('resizeCanvases();',context);assert.equal(writes,3);
});
