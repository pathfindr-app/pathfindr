/* Geographic, procedural materials in MapLibre's existing WebGL context.
 * Three r160 is pinned; see RENDERING_RESEARCH.md for sources and tradeoffs. */
(() => {
    let map, renderer, scene, camera, origin, scale, group, latest, clock=0, last=0;
    const materials=[], landmarks=[];
    const state={ready:false,surfaces:0,trees:0,landmarks:0,flowingWater:0,error:null,quality:'high',frameMs:16.7};
    let lastStats=0;
    const vertex=`varying vec2 world; void main(){ world=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
    const common=`precision highp float;
        varying vec2 world; uniform float uTime; uniform float uAudio; uniform vec3 uView;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
        float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p+7.3;a*=0.5;}return v;}
    `;
    const water=`${common}
        varying vec2 flow; uniform float uHasFlow; uniform float uQuality;
        void main(){
            vec2 current=flow*uHasFlow;
            vec2 p=world-current*uTime*1.8;
            float deep=fbm(world*0.006);
            // Coherent swell directions; small ripples ride the broad waves.
            // Broad, continuous domain warp: flowing sheets rather than glitter.
            vec2 drift=vec2(sin(world.y*0.013+uTime*.11),cos(world.x*.011-uTime*.09));
            p+=vec2(deep*12.0,sin(world.y*0.009)*4.0)+drift*6.0;
            vec2 slope=vec2(0.0);float swell=0.0;
            float footprint=max(length(fwidth(world)),0.05);
            for(int i=0;i<6;i++){
                float fi=float(i),angle=0.35+sin(fi*2.399963)*0.65;
                if(i>=4 && uQuality<0.5)break;
                vec2 d=vec2(cos(angle),sin(angle));
                float frequency=0.022*pow(1.85,fi);
                float phase=dot(p,d)*frequency-uTime*(0.38+fi*0.19);
                float aa=1.0-smoothstep(0.7,3.0,frequency*footprint);
                slope+=d*cos(phase)*0.20*pow(0.48,fi)*aa;
                swell+=sin(phase)*aa/(2.0+fi);
            }
            vec3 n=normalize(vec3(-slope,1.0));
            vec3 v=normalize(uView),l=normalize(vec3(-0.20,-0.30,0.92)),h=normalize(l+v);
            float nv=max(dot(n,v),0.01),nh=max(dot(n,h),0.0);
            float fresnel=0.025+0.975*pow(1.0-nv,5.0);
            // Broaden glints as pixels cover more water: avoid glittering aliasing.
            float rough=0.24+0.13*smoothstep(1.0,12.0,footprint), a2=rough*rough*rough*rough;
            float denom=nh*nh*(a2-1.0)+1.0;
            float ggx=a2/(3.14159*denom*denom);
            vec3 reflected=reflect(-v,n);
            vec3 sky=mix(vec3(0.012,0.027,0.065),vec3(0.17,0.30,0.38),smoothstep(-0.3,0.9,reflected.z));
            // Analytic night environment, not a reflection of scene buildings.
            // Ripple normals break these broad light sources into watery ribbons.
            float cyanLight=exp(-pow((reflected.x+reflected.y*.25+0.18)/0.19,2.0));
            float coralLight=exp(-pow((reflected.y-reflected.x*.3-0.35)/0.23,2.0));
            sky+=vec3(0.055,0.64,0.73)*cyanLight;
            sky+=vec3(0.36,0.075,0.18)*coralLight*0.48;
            vec3 body=mix(vec3(0.004,0.018,0.043),vec3(0.008,0.085,0.105),deep);
            float filaments=sin(dot(p,vec2(0.072,0.028))+swell*1.4-uTime*0.2);
            float crossWave=sin(dot(p,vec2(-0.035,0.065))-swell*.8+uTime*.15);
            float crease=abs(filaments+crossWave*.55);
            float aaWidth=max(fwidth(crease)*1.5,.025);
            float caustic=(1.0-smoothstep(.04,.13+aaWidth,crease))*(1.0-smoothstep(3.0,15.0,footprint));
            // Intentional artistic reflectance floor for a top-down game camera.
            vec3 col=mix(body,sky,0.22+fresnel*0.60);
            col+=vec3(0.045,0.30,0.34)*caustic*(0.10+deep*0.15+uAudio*0.10);
            col+=vec3(0.40,0.74,0.82)*min(ggx*0.004,0.17)*(0.75+uAudio*0.25);
            col+=vec3(0.007,0.025,0.033)*swell;
            col=col/(1.0+col); col=pow(col,vec3(1.0/2.2));
            gl_FragColor=vec4(col,1.0);
        }`;
    const park=`${common}
        uniform float uForest;
        void main(){
            float footprint=max(length(fwidth(world)),0.1);
            float soil=fbm(world*0.035),patchiness=fbm(world*0.009);
            float wind=sin(dot(world,vec2(.023,.014))-uTime*.42+patchiness*3.0)*.5+.5;
            float detail=1.0-smoothstep(0.8,4.0,footprint);
            // Continuous contour grain avoids per-cell flicker during camera motion.
            float grainPhase=world.x*2.2+world.y*.7+soil*5.0+wind*.6;
            float blade=pow(max(0.0,sin(grainPhase)),8.0)*detail;
            vec3 dark=mix(vec3(0.013,0.059,0.038),vec3(0.012,0.037,0.032),uForest);
            vec3 light=mix(vec3(0.065,0.18,0.087),vec3(0.027,0.11,0.077),uForest);
            vec3 col=mix(dark,light,soil*0.55+patchiness*0.35);
            col+=vec3(0.025,0.045,0.022)*blade*(0.25+wind*.35)*(1.0-uForest*.7);
            float sweep=smoothstep(.65,.95,wind);
            col+=vec3(.009,.026,.017)*sweep*(.55+patchiness*.45);
            gl_FragColor=vec4(pow(max(col,vec3(0.0)),vec3(1.0/2.2)),1.0);
        }`;
    // Opaque, elevated roof caps; one batch rather than a material per building.
    // Broad sheen only: intentionally no grid, window noise or fine texture.
    const roof=`${common}
        varying vec3 roofTint; varying float roofSeed;
        void main(){
            float sheen=pow(0.5+0.5*sin(dot(world,vec2(0.014,0.009))-uTime*0.14+roofSeed*6.28),8.0);
            vec3 col=roofTint*(0.97+sheen*0.045);
            col+=vec3(0.009,0.015,0.018)*sheen;
            gl_FragColor=vec4(col,1.0);
        }`;
    const facade=`${common}
        varying vec3 roofTint; varying float roofSeed;
        void main(){
            float vertical=1.0-exp(-world.y/32.0);
            float sheen=pow(0.5+0.5*sin(world.x*0.018+roofSeed*6.28-uTime*0.08),4.0);
            vec3 col=roofTint*(0.48+vertical*0.17+sheen*0.025);
            gl_FragColor=vec4(col,1.0);
        }`;
    function buildRoofs(buildings){
        const positions=[],colors=[],seeds=[];
        const walls=[],wallUV=[],wallColors=[],wallSeeds=[];
        const palette=[[.141,.286,.329],[.267,.196,.310],[.302,.204,.259],[.161,.247,.345]];
        state.roofs=0;
        for(const feature of (buildings?.features||[]).slice(0,4000)){
            const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[];
            const id=Math.abs(Number(feature.id)||0),color=palette[id%4];
            const height=Math.max(0,Number(feature.properties.height)||9);
            for(const rings of polygons){
                const geometry=triangles(rings,height+.16),attribute=geometry.attributes.position;
                for(let i=0;i<attribute.count;i++){
                    positions.push(attribute.getX(i),attribute.getY(i),attribute.getZ(i));
                    colors.push(...color);seeds.push((id%997)/997);
                }
                geometry.dispose();
                rings.forEach((ring,ringIndex)=>{
                    const points=ring.map(local);
                    const signed=points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+a[0]*b[1]-b[0]*a[1];},0);
                    const direction=(signed>=0?1:-1)*(ringIndex? -1:1);
                    for(let i=1;i<points.length;i++){
                        const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
                        if(length<.05)continue;
                        const ox=dy/length*.10*direction,oy=-dx/length*.10*direction;
                        for(const [x,y,z,u] of [[a[0],a[1],0,0],[b[0],b[1],0,length],[b[0],b[1],height,length],
                            [a[0],a[1],0,0],[b[0],b[1],height,length],[a[0],a[1],height,0]]){
                            walls.push(x+ox,y+oy,z);wallUV.push(u,z);wallColors.push(...color);wallSeeds.push((id%997)/997);
                        }
                    }
                });
            }
            state.roofs++;
        }
        if(!positions.length)return;
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        geometry.setAttribute('aRoofTint',new THREE.Float32BufferAttribute(colors,3));
        geometry.setAttribute('aRoofSeed',new THREE.Float32BufferAttribute(seeds,1));
        const material=mat(roof,{uRoofHeightCap:{value:10000}});
        material.vertexShader=`attribute vec3 aRoofTint; attribute float aRoofSeed;
            varying vec3 roofTint; varying float roofSeed; varying vec2 world; uniform float uRoofHeightCap;
            void main(){world=position.xy;roofTint=aRoofTint;roofSeed=aRoofSeed;
                gl_Position=projectionMatrix*modelViewMatrix*vec4(position.xy,min(position.z,uRoofHeightCap+0.16),1.0);}`;
        group.add(new THREE.Mesh(geometry,material));
        if(walls.length){
            const sides=new THREE.BufferGeometry();
            sides.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));
            sides.setAttribute('aFacade',new THREE.Float32BufferAttribute(wallUV,2));
            sides.setAttribute('aRoofTint',new THREE.Float32BufferAttribute(wallColors,3));
            sides.setAttribute('aRoofSeed',new THREE.Float32BufferAttribute(wallSeeds,1));
            const sideMaterial=mat(facade,{uRoofHeightCap:{value:10000}});
            sideMaterial.vertexShader='attribute vec2 aFacade; '+material.vertexShader.replace('world=position.xy;','world=vec2(aFacade.x,min(aFacade.y,uRoofHeightCap));');
            const mesh=new THREE.Mesh(sides,sideMaterial);mesh.userData.facade=true;group.add(mesh);
        }
    }
    function local(pos){const p=maplibregl.MercatorCoordinate.fromLngLat(pos);return [(p.x-origin.x)/scale,(origin.y-p.y)/scale];}
    function dispose(){
        if(!group)return;
        group.traverse(o=>{if(o.userData.sharedLandmark)return;o.geometry?.dispose();if(o.material)for(const m of [].concat(o.material))m.dispose();});
        scene.remove(group);materials.length=0;landmarks.length=0;
    }
    function mat(fragment, extra={}) {
        const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,side:THREE.DoubleSide,
            uniforms:{uTime:{value:clock},uAudio:{value:0},uQuality:{value:state.quality==='high'?1:0},uView:{value:new THREE.Vector3(0,-0.5,1)},...extra},extensions:{derivatives:true}});
        materials.push(material);return material;
    }
    function triangles(rings,z=0.3){
        const flat=[],holes=[];let count=0;
        rings.forEach((ring,i)=>{if(i)holes.push(count);for(const p of ring.slice(0,-1)){flat.push(...local(p));count++;}});
        const indices=earcut(flat,holes,2),positions=[];
        for(const index of indices)positions.push(flat[index*2],flat[index*2+1],z);
        const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        geometry.computeVertexNormals();return geometry;
    }
    function pointIn(p,rings){return PathfindrWorldData.contains(p,rings[0])&&!rings.slice(1).some(r=>PathfindrWorldData.contains(p,r));}
    function flowAt(p,segments){
        let closest=Infinity,result=[0,0];
        for(const [a,b] of segments){const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy;
            if(!len2)continue;const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2));
            const d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;
            if(d<closest){closest=d;result=[dx/Math.sqrt(len2),dy/Math.sqrt(len2)];}}
        return closest<600*600 ? result : [0,0];
    }
    function model(poi) {
        if(poi.assetId){
            const owner=group,g=new THREE.Group(),[x,y]=local(poi.pos);
            g.position.set(x,y,0.5);g.userData.assetId=poi.assetId;owner.add(g);landmarks.push(g);
            state.modelsPending++;
            PathfindrLandmarks.load(poi.assetId).then(template=>{
                if(group!==owner)return; // A city switch must never receive a stale model.
                const asset=template.clone(true),bounds=new THREE.Box3().setFromObject(asset),size=bounds.getSize(new THREE.Vector3());
                asset.position.x-=(bounds.min.x+bounds.max.x)/2;
                asset.position.y-=bounds.min.y;
                asset.position.z-=(bounds.min.z+bounds.max.z)/2;
                const orient=new THREE.Group();orient.add(asset);orient.rotation.x=Math.PI/2;
                const basis=poi.axis==='height'?size.y:Math.max(size.x,size.z);
                orient.scale.setScalar(poi.meters/Math.max(.001,basis));
                g.rotation.z=Math.PI-poi.heading*Math.PI/180;g.add(orient);
                state.modelsLoaded++;map.triggerRepaint();
            }).catch(error=>{if(group===owner){state.modelError=`${poi.name}: ${error.message}`;console.warn('[Landmark]',state.modelError);}})
                .finally(()=>{if(group===owner)state.modelsPending--;});
            return;
        }
        const g=new THREE.Group(), brass=new THREE.MeshStandardMaterial({color:0xc59864,metalness:0.55,roughness:0.42,emissive:0x704520,emissiveIntensity:0.18});
        const stone=new THREE.MeshStandardMaterial({color:0xc9cebe,roughness:0.6,metalness:0.1});
        const mesh=(geometry,material,z)=>{const m=new THREE.Mesh(geometry,material);m.rotation.x=Math.PI/2;m.position.z=z;g.add(m);return m;};
        if(/eiffel|tour eiffel/i.test(poi.name)) {
            // Open lattice silhouette, four tapered legs and two observation decks.
            for(const x of [-1,1])for(const y of [-1,1]){
                const a=new THREE.Vector3(x*18,y*18,0),b=new THREE.Vector3(x*3,y*3,75),dir=b.clone().sub(a);
                const leg=new THREE.Mesh(new THREE.CylinderGeometry(1.1,2.1,dir.length(),5),brass);
                leg.position.copy(a.clone().add(b).multiplyScalar(0.5));leg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());g.add(leg);
            }
            for(const [z,size] of [[25,26],[48,15]]){const deck=new THREE.Mesh(new THREE.BoxGeometry(size,size,2.4),brass);deck.position.z=z;g.add(deck);}
            mesh(new THREE.CylinderGeometry(0.2,3,33,5),brass,88);
        } else if(/washington monument/i.test(poi.name)) {
            mesh(new THREE.CylinderGeometry(5,8,95,4),stone,47.5);
            mesh(new THREE.ConeGeometry(7.1,14,4),stone,102);
        } else {
            mesh(new THREE.CylinderGeometry(9,11,4,6),stone,2);
            mesh(new THREE.CylinderGeometry(3,5,20,6),brass,14);
            mesh(new THREE.OctahedronGeometry(6,0),brass,29);
        }
        const [x,y]=local(poi.pos);g.position.set(x,y,0.5);group.add(g);landmarks.push(g);
    }
    function build(data,location,edges=[],buildings=null) {
        data=window.PathfindrLandmarks?.enrich(data,location)||data;
        latest={data,location,edges,buildings};if(!state.ready)return;
        const buildStarted=performance.now();
        dispose();group=new THREE.Group();scene.add(group);
        state.modelsLoaded=0;state.modelsPending=0;state.modelError=null;
        origin=maplibregl.MercatorCoordinate.fromLngLat([location.lng,location.lat]);scale=origin.meterInMercatorCoordinateUnits();
        buildRoofs(buildings);
        const segments=data.flows.flatMap(f=>f.points.slice(1).map((p,i)=>[local(f.points[i]),local(p)])).slice(0,1500);
        state.surfaces=0;state.flowingWater=0;
        const batches=new Map();
        const treePositions=[];
        for(const surface of data.surfaces){
            const geometry=triangles(surface.rings);if(!geometry.attributes.position.count)continue;
            let material,batchKey=surface.kind;
            if(surface.kind==='water'){
                const centroid=local(surface.rings[0][0]),direction=flowAt(centroid,segments);
                const river=['river','canal'].includes(surface.tags.water)||surface.tags.waterway==='riverbank';
                const hasFlow=river&&surface.tags.tidal!=='yes'&&Math.hypot(...direction)>0;
                const flows=[];for(let i=0;i<geometry.attributes.position.count;i++)flows.push(...direction);
                geometry.setAttribute('aFlow',new THREE.Float32BufferAttribute(flows,2));
                batchKey=hasFlow?'water-flow':'water-still';
                if(!batches.has(batchKey)){
                    material=mat(water,{uHasFlow:{value:hasFlow?1:0}});
                    material.vertexShader='attribute vec2 aFlow; varying vec2 flow; '+vertex.replace('world=position.xy;','world=position.xy; flow=aFlow;');
                }
                if(hasFlow)state.flowingWater++;
            }else{
                if(!batches.has(batchKey))material=mat(park,{uForest:{value:surface.kind==='forest'?1:0}});
                const ring=surface.rings[0],l=ring.map(local),xs=l.map(p=>p[0]),ys=l.map(p=>p[1]);
                const step=surface.kind==='forest'?28:47;
                const minX=Math.max(-2200,Math.min(...xs)),maxX=Math.min(2200,Math.max(...xs));
                const minY=Math.max(-2200,Math.min(...ys)),maxY=Math.min(2200,Math.max(...ys));
                for(let x=minX;x<maxX && treePositions.length<900;x+=step)for(let y=minY;y<maxY && treePositions.length<900;y+=step){
                    const r=Math.sin(x*1.71+y*0.33)*43758.5453,seed=r-Math.floor(r);
                    const p=[x+seed*step*0.7,y+seed*step*0.4];
                    const geo=new maplibregl.MercatorCoordinate(origin.x+p[0]*scale,origin.y-p[1]*scale).toLngLat();
                    if(pointIn([geo.lng,geo.lat],surface.rings))treePositions.push({p,seed,conifer:surface.tags.leaf_type==='needleleaved'});
                }
            }
            if(!batches.has(batchKey))batches.set(batchKey,{material,positions:[],flows:[]});
            const batch=batches.get(batchKey);
            for(const value of geometry.attributes.position.array)batch.positions.push(value);
            if(geometry.attributes.aFlow)for(const value of geometry.attributes.aFlow.array)batch.flows.push(value);
            geometry.dispose();state.surfaces++;
        }
        for(const batch of batches.values()){
            const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(batch.positions,3));
            if(batch.flows.length)geometry.setAttribute('aFlow',new THREE.Float32BufferAttribute(batch.flows,2));
            group.add(new THREE.Mesh(geometry,batch.material));
        }
        for(const tree of data.trees.slice(0,200)){const p=local(tree.pos);treePositions.push({p,seed:(tree.id%997)/997,conifer:tree.tags.leaf_type==='needleleaved'||/pinus|picea|abies/i.test(tree.tags.genus||'')});}
        // Exclude trees close to road segments using a coarse spatial lookup.
        const cells=new Map();
        for(const edge of edges){const a=local([edge.fromPos.lng,edge.fromPos.lat]),b=local([edge.toPos.lng,edge.toPos.lat]);
            const steps=Math.min(100,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/32));
            for(let i=0;i<=steps;i++){const t=steps?i/steps:0,key=`${Math.floor((a[0]+(b[0]-a[0])*t)/32)},${Math.floor((a[1]+(b[1]-a[1])*t)/32)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push([a,b]);}}
        const footprints=data.pois.filter(p=>p.assetId).map(p=>({pos:local(p.pos),radius:p.axis==='height'?20:p.meters*.55}));
        const clear=treePositions.filter(({p})=>{
            if(footprints.some(f=>Math.hypot(p[0]-f.pos[0],p[1]-f.pos[1])<f.radius))return false;
            const cx=Math.floor(p[0]/32),cy=Math.floor(p[1]/32);
            for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(const [a,b] of cells.get(`${x},${y}`)||[]){
                const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
                if(Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<11)return false;}
            return true;
        }).slice(0,900);
        const dummy=new THREE.Object3D();
        for(const conifer of [false,true]){
            const list=clear.filter(p=>p.conifer===conifer);if(!list.length)continue;
            const geometry=conifer?new THREE.ConeGeometry(4,13,6):new THREE.IcosahedronGeometry(5,0);
            if(conifer)geometry.rotateX(Math.PI/2);
            const foliage=new THREE.MeshStandardMaterial({color:conifer?0x346b59:0x63916b,roughness:0.88,flatShading:true});
            const trees=new THREE.InstancedMesh(geometry,foliage,list.length);
            list.forEach(({p,seed},i)=>{dummy.position.set(p[0],p[1],conifer?8:6);dummy.scale.setScalar(0.7+seed*0.75);dummy.rotation.z=seed*6.28;dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);trees.setColorAt(i,new THREE.Color().setHSL(0.32+seed*0.09,0.20+seed*0.18,0.20+seed*0.11));});
            trees.instanceMatrix.needsUpdate=true;group.add(trees);
        }
        data.pois.filter(p=>p.type==='landmark').slice(0,20).forEach(model);
        state.trees=clear.length;state.landmarks=landmarks.length;state.buildMs=Math.round((performance.now()-buildStarted)*10)/10;
        if(state.quality==='balanced')group.traverse(o=>{if(o.isInstancedMesh)o.count=Math.ceil(o.instanceMatrix.count*.45);});
        map.triggerRepaint();
    }
    const layer={id:'living-environment',type:'custom',renderingMode:'3d',
        onAdd(instance,gl){map=instance;camera=new THREE.Camera();scene=new THREE.Scene();
            const ambient=new THREE.AmbientLight(0x9bcbd6,1.5);scene.add(ambient);
            const sun=new THREE.DirectionalLight(0xffdec2,2.4);sun.position.set(-400,-600,1000);scene.add(sun);
            renderer=new THREE.WebGLRenderer({canvas:map.getCanvas(),context:gl});renderer.autoClear=false;
            renderer.debug.onShaderError=(context,program,vs,fs)=>{state.error=[context.getProgramInfoLog(program),context.getShaderInfoLog(vs),context.getShaderInfoLog(fs)].join('\n').slice(0,2000);console.error('[Living materials]',state.error);};
            renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
            state.ready=true;if(latest)build(latest.data,latest.location,latest.edges,latest.buildings);
        },
        render(gl,matrix){if(!origin||!group||window.PathfindrCity?.state.enabled===false)return;
            const now=performance.now(),delta=now-(last||now);if(delta>0&&delta<250)state.frameMs=state.frameMs*.95+delta*.05;
            if(!document.hidden && !PathfindrMotion.reduced())clock+=Math.min(50,delta)/1000;last=now;
            const pitch=map.getPitch()*Math.PI/180,bearing=map.getBearing()*Math.PI/180;
            // Sides contribute nothing top-down; skip their draw entirely.
            for(const child of group.children)if(child.userData.facade)child.visible=map.getPitch()>3;
            for(const m of materials){m.uniforms.uTime.value=clock;m.uniforms.uAudio.value=window.PathfindrAudio?.state.energy||0;m.uniforms.uView.value.set(Math.sin(bearing)*Math.sin(pitch),-Math.cos(bearing)*Math.sin(pitch),Math.cos(pitch));
                if(m.uniforms.uRoofHeightCap)m.uniforms.uRoofHeightCap.value=window.PathfindrCity?.state.quality==='low'?12:10000;}
            const reveal=Math.max(0.18,Math.min(1,(map.getZoom()-12.5)/3.5)),growth=reveal*reveal*(3-2*reveal);
            for(const model of landmarks){
                if(model.userData.assetId)model.scale.set(.8+.2*growth,.8+.2*growth,.4+.6*growth);
                else model.scale.setScalar(growth);
            }
            const transform=new THREE.Matrix4().makeTranslation(origin.x,origin.y,origin.z||0).scale(new THREE.Vector3(scale,-scale,scale));
            camera.projectionMatrix=new THREE.Matrix4().fromArray(matrix).multiply(transform);
            renderer.resetState();renderer.render(scene,camera);renderer.resetState();
            state.drawCalls=renderer.info.render.calls;
            if(now-lastStats>500){lastStats=now;const output=document.getElementById('graphics-readout');if(output)output.textContent=`${state.surfaces} land/water areas · ${state.trees} trees\n${state.landmarks} landmarks · ${state.drawCalls} environment draws\nMap frame interval: ${state.frameMs.toFixed(1)} ms\nEmission: ${PathfindrEmission.state.hdr?'HDR':'standard'}${PathfindrEmission.state.error?' · fallback':''}\n${state.error?'Material error: '+state.error:'Materials ready'}`;}
            // Repaint scheduling belongs to the game controller, not a second loop.
        },
        onRemove(){dispose();renderer?.dispose();state.ready=false;}
    };
    window.PathfindrWorldRenderer={state,build,setQuality(quality){state.quality=quality==='balanced'?'balanced':'high';
        group?.traverse(o=>{if(o.isInstancedMesh)o.count=state.quality==='balanced'?Math.ceil(o.instanceMatrix.count*.45):o.instanceMatrix.count;});
        for(const m of materials)m.uniforms.uQuality.value=state.quality==='high'?1:0;
        PathfindrEmission.state.enabled=state.quality==='high';map?.triggerRepaint();
    },init(instance){if(!instance.getLayer(layer.id))instance.addLayer(layer,'city-blocks');},clear(){latest=null;dispose();group=null;origin=null;state.modelsLoaded=state.modelsPending=0;state.roofs=state.surfaces=state.trees=state.landmarks=state.flowingWater=0;}};
})();
