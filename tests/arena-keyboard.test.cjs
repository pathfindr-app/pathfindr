const test=require('node:test'),assert=require('node:assert/strict'),K=require('../arena/keyboard.js');
function graph(points,edges){const nodes=new Map(points.map((p,i)=>[i,{id:i,x:p[0],y:p[1]}])),adj=new Map(points.map((_,i)=>[i,[]]));for(const [a,b] of edges){const meters=Math.hypot(nodes.get(a).x-nodes.get(b).x,nodes.get(a).y-nodes.get(b).y);adj.get(a).push({id:b,meters});adj.get(b).push({id:a,meters});}return {nodes,adj};}
test('lookahead follows the road bend rather than a misleading first tiny tangent',()=>{
 const g=graph([[0,0],[1,2],[10,3],[35,3],[0,-20]],[[0,1],[1,2],[2,3],[0,4]]);assert.equal(K.choose(g,0,undefined,{x:1,y:0}).edge.id,1);
});
test('close forks use local target tie-break without overriding a clear directional press',()=>{
 const g=graph([[0,0],[20,-15],[20,15]],[[0,1],[0,2]]);assert.equal(K.choose(g,0,undefined,{x:1,y:0},null,1,{target:{x:200,y:100}}).edge.id,2);assert.equal(K.choose(g,0,undefined,{x:0,y:-1},null,1,{target:{x:200,y:100}}).edge.id,1);
});
test('held intent follows a gentle same-road bend rather than requiring a new key at every tangent',()=>{
 const g=graph([[0,0],[7,20],[20,0]],[[0,1],[0,2]]);g.adj.get(0)[0].road='Main';g.adj.get(0)[1].road='Side';
 assert.equal(K.choose(g,0,undefined,{x:1,y:0},{x:.7,y:.7},1,{followRoad:true,road:'Main'}).edge.id,1);
});
test('explicit reverse permits backtracking while forward intent never reverses at a dead end',()=>{
 const g=graph([[0,0],[20,0]],[[0,1]]);assert.equal(K.choose(g,1,0,{x:1,y:0},{x:1,y:0}),null);assert.equal(K.choose(g,1,0,{x:-1,y:0},{x:1,y:0}).edge.id,0);
});
