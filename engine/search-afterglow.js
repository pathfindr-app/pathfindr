/* Wall-clock cooling shared by WebGL and Canvas. No independent animation loop. */
(() => {
    function gain(elapsedMs,reduced=false){
        if(reduced)return .28;
        const seconds=Math.max(0,elapsedMs)/1000;
        return .22+.78*Math.exp(-seconds/4.8);
    }
    function packet(ageMs,index){
        const age=Math.max(0,ageMs)/1000;
        return {position:(age*.24+index*.381966)%1,alpha:Math.exp(-age/5.5)*(.55+.15*Math.sin(age*2-index)),size:5+3*Math.exp(-age/3)};
    }
    window.PathfindrSearchAfterglow={gain,packet};
})();
