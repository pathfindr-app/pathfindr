/* Bounded, cached DOM label layout: no remote fonts/glyph service. */
(() => {
    let map,layer,labels=[],dirty=true;
    function draw(){if(!dirty||!map||!layer)return;dirty=false;
        const zoom=map.getZoom(),w=map.getContainer().clientWidth,h=map.getContainer().clientHeight,placed=[];
        for(const label of labels){const e=label.element,min=label.type==='street'?16:label.type==='park'?14.5:13;
            if(zoom<min||placed.length>=22){if(!e.hidden)e.hidden=true;continue;}
            const p=map.project(label.pos);
            const width=Math.min(190,label.name.length*6+14),box={x:p.x-width/2,y:p.y-10,w:width,h:22};
            const shown=zoom>=min&&p.x>width/2+10&&p.x<w-width/2-10&&p.y>110&&p.y<h-180&&placed.length<22&&!placed.some(b=>box.x<b.x+b.w+12&&box.x+box.w+12>b.x&&box.y<b.y+b.h+8&&box.y+box.h+8>b.y);
            e.hidden=!shown;if(shown){placed.push(box);e.style.transform=`translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%)`;}
        }
    }
    function schedule(){dirty=true;}
    window.PathfindrMapLabels={set(instance,data=[]){
        if(!layer){map=instance;layer=document.createElement('div');layer.className='map-place-labels';layer.setAttribute('aria-label','Map place names');map.getContainer().append(layer);map.on('move',schedule);map.on('resize',schedule);map.on('render',draw);}
        layer.replaceChildren();const order={district:0,water:1,park:2,street:3};
        labels=data.slice().sort((a,b)=>order[a.type]-order[b.type]).slice(0,220).map(item=>{
            const element=document.createElement('span');element.className=`map-place-label label-${item.type}`;
            const text=document.createElement('span');text.className='map-label-text';text.textContent=item.name;text.tabIndex=0;text.title=`${item.name} · ${item.type}`;
            text.addEventListener('pointerdown',e=>e.stopPropagation());text.addEventListener('click',e=>e.stopPropagation());
            element.append(text);layer.append(element);return {...item,element};
        });schedule();map.triggerRepaint();
    }};
})();
