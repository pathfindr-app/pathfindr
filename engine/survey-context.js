/* Real elevation relief, plus geographic graticules. No graph/routing mutations. */
(() => {
    const NS='http://www.w3.org/2000/svg';
    function spacing(span){const raw=Math.max(.00001,span/6),power=10**Math.floor(Math.log10(raw)),n=raw/power;return (n<=1?1:n<=2?2:n<=5?5:10)*power;}
    function init(map){
        const svg=document.createElementNS(NS,'svg');svg.id='survey-context';svg.setAttribute('aria-hidden','true');map.getContainer().append(svg);
        const grid=document.createElementNS(NS,'path'),pulse=document.createElementNS(NS,'path');grid.classList.add('survey-grid');pulse.classList.add('survey-flow');svg.append(grid,pulse);
        let previous='';
        function update(){
            if(document.hidden)return;
            const bounds=map.getBounds(),w=map.getContainer().clientWidth,h=map.getContainer().clientHeight;
            const west=bounds.getWest(),east=bounds.getEast(),south=Math.max(-85,bounds.getSouth()),north=Math.min(85,bounds.getNorth());
            if(![west,east,south,north].every(Number.isFinite)||east-west>180)return;
            const dx=spacing(east-west),dy=spacing(north-south);let d='';
            function line(a,b){for(let k=0;k<=16;k++){const t=k/16,p=map.project([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);if(Number.isFinite(p.x)&&Number.isFinite(p.y))d+=`${k?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;}}
            for(let x=Math.ceil(west/dx)*dx,i=0;x<=east&&i<12;x+=dx,i++)line([x,south],[x,north]);
            for(let y=Math.ceil(south/dy)*dy,i=0;y<=north&&i<12;y+=dy,i++)line([west,y],[east,y]);
            svg.setAttribute('viewBox',`0 0 ${w} ${h}`);if(d!==previous){grid.setAttribute('d',d);pulse.setAttribute('d',d);previous=d;}
        }
        map.on('move',update);map.on('resize',update);update();
        map.once('remove',()=>{map.off('move',update);map.off('resize',update);svg.remove();});
    }
    function relief(map){
        if(window.PathfindrConfig?.app?.offlineOnly||navigator.onLine===false)return;
        // DEM capped at z10: distant terrain context, not street-level surveying.
        map.addSource('survey-elevation',{type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],tileSize:256,maxzoom:10,encoding:'terrarium',attribution:'<a href="https://www.mapzen.com/rights/">Elevation: Mapzen / source providers</a>'});
        map.addLayer({id:'survey-relief',type:'hillshade',source:'survey-elevation',paint:{'hillshade-exaggeration':.28,'hillshade-shadow-color':'rgba(10,20,33,0.35)','hillshade-highlight-color':'rgba(104,193,197,0.22)','hillshade-accent-color':'rgba(53,94,115,0.18)','hillshade-illumination-anchor':'map'}},'city-blocks');
    }
    window.PathfindrSurvey={spacing,init,relief};
})();
