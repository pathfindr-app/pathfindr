const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const window={};vm.runInNewContext(fs.readFileSync('engine/trace-guide.js','utf8'),{window});const guide=window.PathfindrTraceGuide;
const tail=[{x:0,y:0},{x:20,y:0},{x:40,y:0}],side=[{x:40,y:0},{x:40,y:10}];
test('jitter near intersection cannot steal a straight trace; intentional turn unlocks',()=>{
 for(const y of [1,4,9,15])assert.equal(guide.allows(tail,side,{x:43,y},true),false);
 assert.equal(guide.allows(tail,side,{x:43,y:17},true),true);
 assert.equal(guide.allows(tail,[{x:40,y:0},{x:70,y:0}],{x:65,y:10},true),true);
});
test('gradual curves and newly started strokes remain available',()=>{
 assert.equal(guide.allows(tail,[{x:40,y:0},{x:60,y:8}],{x:60,y:8},true),true);
 assert.equal(guide.allows([{x:40,y:0}],side,{x:40,y:9},true),true);
});
function fixture(){return {start:'a',end:'c',nodes:new Map([['a',{x:0,y:0}],['b',{x:10,y:0}],['c',{x:20,y:0}]]),
 edges:new Map([['a',[{neighbor:'b',weight:.01}]],['b',[{neighbor:'c',weight:.01}]]]),project:p=>p,pointer:{x:15,y:0},distance:()=>.02,touch:true};}
test('nearby destination uses only the connected short path',()=>assert.equal(guide.finishPath(fixture()).join(','),'a,b,c'));
test('screen-near disconnected bridge decks and long detours never auto-complete',()=>{
 const f=fixture();f.edges.set('b',[]);assert.equal(guide.finishPath(f),null);
 f.edges.set('b',[{neighbor:'c',weight:.09}]);assert.equal(guide.finishPath(f),null);
});
test('world distance and finger proximity bound assistance even when zoomed out',()=>{
 const f=fixture();f.distance=()=>.2;assert.equal(guide.finishPath(f),null);
 f.distance=()=>.02;f.pointer={x:200,y:0};assert.equal(guide.finishPath(f),null);
});
