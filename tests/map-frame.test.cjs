const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c={window:{}};vm.runInNewContext(fs.readFileSync('engine/map-frame.js','utf8'),c);const frame=c.window.PathfindrMapFrame;
test('edge coordinates normalize world copies and reject invalid ground points',()=>{
 assert.equal(frame.format(-80.12345,'lng'),'80.123°W');assert.equal(frame.format(25.75,'lat'),'25.750°N');
 assert.equal(frame.format(190,'lng'),'170.000°W');assert.equal(frame.format(-181,'lng'),'179.000°E');
 assert.equal(frame.format(Infinity,'lat'),'');assert.equal(frame.format(91,'lat'),'');
});
test('edge samples stay inside mobile and desktop canvases and clear the route hub',()=>{
 for(const [w,h] of [[320,640],[390,844],[1440,900],[844,390]]){
  const points=frame.positions(w,h);assert.ok(points.length<=36);
  assert.ok(points.every(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h));
  assert.ok(points.some(p=>p.edge==='bottom'));
  assert.ok(points.filter(p=>p.edge==='bottom').every(p=>Math.abs(p.x-w/2)>=80));
 }
});
test('route trim is aligned and paired reveals respect reduced motion',()=>{
 const css=fs.readFileSync('engine/route-wheel.css','utf8'),js=fs.readFileSync('engine/route-wheel.js','utf8');
 assert.doesNotMatch(css,/rotate\(-?8deg\)/);assert.match(js,/\[2,1,0,0,1,2\]/);
 assert.match(css,/animation:none!important/);
});
