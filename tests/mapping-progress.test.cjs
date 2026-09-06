const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync('engine/mapping-progress.js','utf8'),sandbox);
const summarize=sandbox.window.PathfindrMappingProgress.summarize;
const make=(id,paths,assisted=false)=>({id,payload:{kind:'result',maps:[{location:{name:'Miami'}}],rounds:paths.map(userPath=>({map:0,userPath,assisted}))}});
test('mapping starts empty with a ten-mile milestone',()=>{const s=summarize([]);assert.equal(s.miles,0);assert.equal(s.target,10);assert.equal(s.percent,0);});
test('geographic distance counts reversed/repeated segments once across runs',()=>{
 const a=[0,0],b=[.01,0],records=[make('a',[[a,b],[b,a]]),make('b',[[a,b]])];
 const s=summarize(records);assert.ok(Math.abs(s.miles-.690934)<.001);assert.equal(s.segments,1);assert.equal(s.rounds,3);assert.equal(s.cities,1);
 assert.equal(summarize([...records,records[0]]).miles,s.miles);
});
test('assisted, challenge-only, and invalid routes do not inflate progress',()=>{
 assert.equal(summarize([make('a',[[[0,0],[1,0]]],true),make('b',[[[NaN,0],[1,0]]]),{id:'c',payload:{kind:'challenge'}}]).miles,0);
});
test('milestone advances without losing accumulated mileage',()=>{const s=summarize([make('a',[[[0,0],[.2,0]]])]);assert.ok(s.miles>10);assert.equal(s.target,25);assert.ok(s.percent>0&&s.percent<100);});
