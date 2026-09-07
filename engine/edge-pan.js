/* Camera-only assistance: never chooses a road or changes route geometry. */
(() => {
    function zones(rect,padding={},mobile=false){
        const width=rect.right-rect.left-(padding.left||0)-(padding.right||0);
        const height=rect.bottom-rect.top-(padding.top||0)-(padding.bottom||0);
        return mobile?{x:width*.445,y:height*.435}:{x:Math.min(260,Math.max(96,width*.36),width*.4),y:Math.min(280,Math.max(120,height*.34),height*.4)};
    }
    function velocity(point,rect,padding={},band,options={}){
        const left=rect.left+(padding.left||0),right=rect.right-(padding.right||0);
        const top=rect.top+(padding.top||0),bottom=rect.bottom-(padding.bottom||0);
        const mobile=!!options.mobile,bands=zones(rect,padding,mobile),cap=mobile?420:180;
        const axis=(p,a,b,zone)=>{zone=Math.min(zone,(b-a)*(mobile?.46:.4));if(zone<=0)return 0;
            const x=p<a+zone?-Math.min(1,(a+zone-p)/zone):p>b-zone?Math.min(1,(p-b+zone)/zone):0;
            const t=Math.abs(x);return Math.sign(x)*(mobile?.25*t+.75*t*t*(3-2*t):t*t*(3-2*t))*cap;
        };
        if(point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom)return {x:0,y:0};
        let x=axis(point.x,left,right,band??bands.x),y=axis(point.y,top,bottom,band??bands.y);const length=Math.hypot(x,y);
        if(length>cap){x*=cap/length;y*=cap/length;}return{x,y};
    }
    function focus(pointer,head,motion={x:0,y:0}){
        const gap=Math.hypot(pointer.x-head.x,pointer.y-head.y);
        // A missed street/dead end must not drag the map after an unconnected finger.
        if(gap>140)return {x:head.x,y:head.y};
        const speed=Math.hypot(motion.x,motion.y),lead=speed?Math.min(28,speed*.065)/speed:0;
        return {x:head.x+(pointer.x-head.x)*.65+motion.x*lead,y:head.y+(pointer.y-head.y)*.65+motion.y*lead};
    }
    window.PathfindrEdgePan={velocity,zones,focus};
})();
