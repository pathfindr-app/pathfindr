/* CSS-pixel optical footprint: broad bloom recedes before the core does. */
(() => {
    function atZoom(zoom){const t=Math.max(0,Math.min(1,((Number(zoom)||12)-11)/5)),ease=t*t*(3-2*t);return {halo:.24+.76*ease,core:.65+.35*ease,bloom:.18+.82*ease};}
    window.PathfindrFidelity={atZoom,current:()=>atZoom(typeof GameState!=='undefined'?GameState.map?.getZoom():15)};
})();
