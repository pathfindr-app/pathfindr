const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function api(){const context={window:{},URL,document:{currentScript:{src:'http://localhost/engine/landmarks.js'}}};
    vm.createContext(context);vm.runInContext(fs.readFileSync('engine/world-data.js','utf8'),context);
    context.PathfindrWorldData=context.window.PathfindrWorldData;
    vm.runInContext(fs.readFileSync('engine/landmarks.js','utf8'),context);return context.window.PathfindrLandmarks;}
test('DC registry has ten self-contained GLBs with valid geometry and no external textures',()=>{
    const entries=api().entries;assert.equal(entries.length,10);assert.equal(new Set(entries.map(p=>p.id)).size,10);
    let bytes=0;
    for(const p of entries){assert.ok(p.pos[0]<-77&&p.pos[0]>-77.1&&p.pos[1]>38.88&&p.pos[1]<38.94);
        const file=fs.readFileSync(`assets/landmarks/washington-dc/models/${p.assetId}.glb`);bytes+=file.length;
        assert.equal(file.toString('utf8',0,4),'glTF');assert.equal(file.readUInt32LE(4),2);assert.equal(file.readUInt32LE(8),file.length);
        const json=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
        assert.equal(json.meshes.length,1);assert.ok(json.images.every(i=>i.bufferView!==undefined&&!i.uri));
        assert.ok(json.buffers.every(b=>!b.uri));assert.ok(p.meters>0);
    }
    assert.ok(bytes<4_000_000);
});
test('curated POIs replace nearby generic landmarks, preserve other cities and are idempotent',()=>{
    const a=api(),dc={lat:38.8895,lng:-77.0353},data={pois:[{id:'osm',type:'landmark',name:'Washington Monument',pos:[-77.035237,38.889463]},
        {id:'burger',type:'burger',name:'Burger',pos:[-77.035237,38.889463]}]};
    assert.equal(a.enrich(data,{lat:25,lng:-80}),data);assert.equal(a.forCity({lat:25,lng:-80}).length,0);
    const enriched=a.enrich(data,dc);assert.equal(enriched.pois.length,11);assert.equal(a.enrich(enriched,dc).pois.length,11);
    assert.equal(data.pois.length,2);assert.ok(enriched.pois.some(p=>p.id==='burger'));
});
test('custom models suppress only buildings containing their anchor, preserving adjacent blocks',()=>{
    const a=api(),dc={lat:38.8895,lng:-77.0353};
    const polygon=(x,y)=>({geometry:{type:'Polygon',coordinates:[[[x-.0001,y-.0001],[x+.0001,y-.0001],[x+.0001,y+.0001],[x-.0001,y+.0001],[x-.0001,y-.0001]]]}});
    const data={type:'FeatureCollection',features:[polygon(-77.035237,38.889463),polygon(-77.038,38.889)]};
    assert.equal(a.buildings(data,dc).features.length,1);assert.equal(data.features.length,2);
});
test('landmark badges sit below the footprint without changing collectible coordinates',()=>{
    const a=api(),entry=a.entries[2],item={key:`landmark:${entry.id}`,pos:[...entry.pos]};
    const project=pos=>({x:200+(pos[0]-entry.pos[0])*100000,y:400-(pos[1]-entry.pos[1])*100000});
    const badge=a.pickupPoint({project},item);assert.equal(badge.x,200);assert.ok(badge.y>426);
    assert.deepEqual(item.pos,[...entry.pos]);assert.equal(a.pickupPoint({project},{key:'spark:1',pos:item.pos}),null);
});
