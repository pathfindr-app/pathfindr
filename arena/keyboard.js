/* Street steering: direction is intent, not a sum of tiny OSM edge tangents. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PathfindrKeyboard=api;})(typeof window==='object'?window:this,()=>{
 function choose(graph,node,previous,direction,heading=null,scale=1,options={}){
  const at=graph.nodes.get(node),candidates=[];
  for(const edge of graph.adj.get(node)||[]){
   let end=graph.nodes.get(edge.id),last=node,current=edge.id,meters=edge.meters;
   // Look through degree-two curvature, but never guess through a junction.
   for(let i=0;i<16&&meters<Math.min(120,28/scale);i++){
    const exits=(graph.adj.get(current)||[]).filter(e=>e.id!==last);if(exits.length!==1)break;
    const next=exits[0];last=current;current=next.id;end=graph.nodes.get(current);meters+=next.meters;
   }
   const dx=end.x-at.x,dy=end.y-at.y,length=Math.hypot(dx,dy)||1;
   const alignment=(dx*direction.x+dy*direction.y)/length,continuity=heading?(dx*heading.x+dy*heading.y)/length:0;
   const follows=options.followRoad&&heading&&continuity>.35&&alignment>-.25;
   if(alignment<.4&&!follows)continue;
   // Deliberate reversal remains possible; passive curvature cannot turn around.
   const reverse=edge.id===previous;if(reverse&&heading&&(options.followRoad||direction.x*heading.x+direction.y*heading.y>-.45))continue;
   const sameRoad=options.road&&edge.road===options.road?1:0;
   const target=options.target,progress=target?(Math.hypot(at.x-target.x,at.y-target.y)-Math.hypot(end.x-target.x,end.y-target.y))/length:0;
   const score=options.followRoad&&heading?alignment*.25+continuity*.75+sameRoad*.3:alignment+Math.max(0,continuity)*.08;
   candidates.push({edge,alignment,score:score+progress*.045,vector:{x:dx/length,y:dy/length}});
  }
  candidates.sort((a,b)=>b.score-a.score);
  if(!candidates.length)return null;
  // Close forks use continuity, road identity and a weak local target tie-break,
  // not a full-route solver. Explicit steering still dominates the score.
  return candidates[0];
 }
 return {choose};
});
