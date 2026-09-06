/* Camera-only assistance: never chooses a road or changes route geometry. */
(() => {
    function zones(rect,padding={}){
        const width=rect.right-rect.left-(padding.left||0)-(padding.right||0);
        const height=rect.bottom-rect.top-(padding.top||0)-(padding.bottom||0);
        return {x:Math.min(220,Math.max(80,width*.27),width/3),y:Math.min(220,Math.max(100,height*.25),height/3)};
    }
    function velocity(point,rect,padding={},band){
        const left=rect.left+(padding.left||0),right=rect.right-(padding.right||0);
        const top=rect.top+(padding.top||0),bottom=rect.bottom-(padding.bottom||0);
        const bands=zones(rect,padding);
        const axis=(p,a,b,zone)=>{zone=Math.min(zone,(b-a)/3);if(zone<=0)return 0;
            const x=p<a+zone?-Math.min(1,(a+zone-p)/zone):p>b-zone?Math.min(1,(p-b+zone)/zone):0;
            const t=Math.abs(x);return Math.sign(x)*t*t*(3-2*t)*180;
        };
        if(point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom)return {x:0,y:0};
        let x=axis(point.x,left,right,band??bands.x),y=axis(point.y,top,bottom,band??bands.y);const length=Math.hypot(x,y);
        if(length>180){x*=180/length;y*=180/length;}return{x,y};
    }
    window.PathfindrEdgePan={velocity,zones};
})();
