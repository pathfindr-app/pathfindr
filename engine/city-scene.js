/* MapLibre owns geographic geometry/camera. UI and route overlays stay compatible. */
(() => {
    const empty = () => ({ type: 'FeatureCollection', features: [] });
    let map, generation = 0, ready = false, lastPulse = 0, lastIntensity = 0.45;
    const cache = new Map();
    let baseRasters = [], lastEnvironmentFrame = 0;
    const state = { enabled: true, buildings: 0, labels:0, loading: false, quality: 'high', error: null };
    function source(id, data) {
        if (map.getSource(id)) map.getSource(id).setData(data);
        else map.addSource(id, { type: 'geojson', data, buffer: 32, maxzoom: 16,
            attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>' });
    }
    function layer(spec) { if (!map.getLayer(spec.id)) map.addLayer(spec); }
    function setup() {
        baseRasters = map.getStyle().layers.filter(layer => layer.type === 'raster').map(layer => ({
            id: layer.id, visibility: layer.layout?.visibility || 'visible'
        }));
        source('city-buildings', empty());
        source('city-roads', empty());
        layer({ id: 'city-ground', type: 'background', paint: { 'background-color': '#111522' } });
        layer({ id: 'city-blocks', type: 'fill-extrusion', source: 'city-buildings', paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#263349', 35, '#3d425d', 90, '#65576e'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.94,
            'fill-extrusion-vertical-gradient': true
        } });
        layer({ id: 'city-streets', type: 'line', source: 'city-roads', paint: {
            'line-color': '#50677a', 'line-opacity': 0.58,
            'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 17, 2.4]
        } });
        map.setLight({ anchor: 'viewport', color: '#ffd0b2', intensity: 0.45, position: [1.5, 210, 35] });
        PathfindrWorldRenderer.init(map);
        ready = true;
        applyVisibility();
    }
    function applyVisibility() {
        if (!ready) return;
        for (const id of ['city-ground', 'city-blocks', 'city-streets']) map.setLayoutProperty(id, 'visibility', state.enabled ? 'visible' : 'none');
        // Do not keep fetching/rasterizing a tile layer hidden beneath opaque ground.
        for (const layer of baseRasters) map.setLayoutProperty(layer.id, 'visibility', state.enabled ? 'none' : layer.visibility);
        document.getElementById('map-container').classList.toggle('city-scene', state.enabled);
    }
    function convert(data) {
        return { type: 'FeatureCollection', features: (data.elements || []).filter(e =>
            e.type === 'way' && e.tags?.building && e.geometry?.length >= 4 &&
            e.geometry[0].lat === e.geometry.at(-1).lat && e.geometry[0].lon === e.geometry.at(-1).lon
        ).slice(0, 4000).map(e => ({
            type: 'Feature', id: e.id,
            properties: { height: Math.min(100, Math.max(4, parseFloat(e.tags.height) || parseFloat(e.tags['building:levels']) * 3.2 || 9)) },
            geometry: { type: 'Polygon', coordinates: [e.geometry.map(p => [p.lon, p.lat])] }
        })) };
    }
    const pending=new Map();
    function keyFor(location){return `${location.lat.toFixed(3)},${location.lng.toFixed(3)}`;}
    function prepare(location){
        const pack=window.PathfindrCityPacks?.[location.packId];if(pack)return Promise.resolve(pack);
        const key=keyFor(location);
        if(cache.has(key))return Promise.resolve(cache.get(key));
        if(pending.has(key))return pending.get(key);
        const request=(async()=>{
            const area=`(around:1600,${location.lat},${location.lng})`;
            const q = `[out:json][timeout:18];(way["building"]${area};nwr["natural"~"^(water|bay|strait|wood)$"]${area};nwr["landuse"~"^(forest|grass|meadow|reservoir)$"]${area};nwr["leisure"~"^(park|garden|golf_course)$"]${area};way["waterway"~"^(river|stream|canal|riverbank)$"]${area};nwr["amenity"~"^(fast_food|restaurant)$"]["cuisine"~"burger"]${area};nwr["historic"="monument"]${area};nwr["tourism"="attraction"]["name"~"Eiffel|Tower|Monument",i]${area};node["natural"="tree"]${area};node["place"~"^(suburb|neighbourhood|quarter|city_district)$"]${area};way["highway"]["name"]${area};);out geom;`;
            let raw,lastError;
            for(const server of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
                const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),22000);
                try{
                    const response=await fetch(server,{method:'POST',body:new URLSearchParams({data:q}),signal:controller.signal});
                    if(!response.ok)throw Error(`City details unavailable (${response.status})`);
                    const result=await response.json();if(result.remark||!Array.isArray(result.elements))throw Error('Incomplete city details');
                    raw=result;break;
                }catch(error){lastError=error;}finally{clearTimeout(timeout);}
            }
            if(!raw)throw lastError;
            const data={buildings:convert(raw),world:PathfindrWorldData.convert(raw),labels:PathfindrPlaceData.labels(raw)};
            cache.set(key,data);if(cache.size>5)cache.delete(cache.keys().next().value);
            return data;
        })().finally(()=>{pending.delete(key);});
        pending.set(key,request);return request;
    }
    window.PathfindrCity = {
        state, convert, prepare,
        prime(location,data){
            if(data?.buildings&&data?.world&&Array.isArray(data.labels)){
                cache.set(keyFor(location),data);
                if(cache.size>5)cache.delete(cache.keys().next().value);
            }
        },
        init(instance) { map = instance; if (map.isStyleLoaded()) setup(); else map.once('load', setup); },
        setEnabled(value) { state.enabled = value; applyVisibility(); },
        async load(location, edges, roads) {
            if (!map) return;
            const token = ++generation;
            PathfindrWorldRenderer.clear();
            PathfindrCollections.setCity(location,edges);
            state.loading = false;
            state.error = null;
            if (!ready) await new Promise(resolve => map.once('load', resolve));
            if (token !== generation) return;
            source('city-roads', { type: 'FeatureCollection', features: edges.map(e => ({ type: 'Feature', properties: {},
                geometry: { type: 'LineString', coordinates: [[e.fromPos.lng, e.fromPos.lat], [e.toPos.lng, e.toPos.lat]] } })) });
            source('city-buildings', empty());
            state.buildings = 0;
            const pack = window.PathfindrCityPacks?.[location.packId];
            const roadLabels=roads?PathfindrPlaceData.labels(roads):[];
            PathfindrMapLabels.set(map,pack?.labels||roadLabels);
            state.labels=(pack?.labels||roadLabels).length;
            if(pack){source('city-buildings',pack.buildings);state.buildings=pack.buildings.features.length;
                PathfindrWorldRenderer.build(pack.world,location,edges);PathfindrCollections.addPOIs(pack.world.pois);return;}
            state.loading=true;
            try {
                const data=await prepare(location);
                if(token!==generation)return;
                source('city-buildings',data.buildings);state.buildings=data.buildings.features.length;
                PathfindrMapLabels.set(map,data.labels);
                state.labels=data.labels.length;
                PathfindrWorldRenderer.build(data.world,location,edges);
                PathfindrCollections.addPOIs(data.world.pois);
            }catch(error){if(token===generation)state.error=error.message;}
            finally{if(token===generation)state.loading=false;}
        },
        update(now, audio, phase) {
            // Static camera: budget environment animation separately from the
            // full-rate route/input loop. Camera gestures retain MapLibre's cadence.
            if(ready && state.enabled && !document.hidden && phase!=='menu' && phase!=='loading' &&
                !PathfindrMotion.reduced() && now-lastEnvironmentFrame>=32) {
                lastEnvironmentFrame=now;map.triggerRepaint();
            }
            if (!ready || !state.enabled || document.hidden || now - lastPulse < 80) return;
            lastPulse = now;
            // Slow, bounded lighting modulation. Roads and camera never jump to a beat.
            const strength = phase === 'playing' ? 0.32 : 0.40;
            const intensity = 0.40 + audio.energy * strength;
            if (Math.abs(intensity - lastIntensity) < 0.004) return;
            lastIntensity = intensity;
            map.setLight({ intensity });
        },
        setQuality(quality) {
            state.quality = quality;
            if (ready) map.setPaintProperty('city-blocks', 'fill-extrusion-height', quality === 'low'
                ? ['min', 12, ['get', 'height']] : ['get', 'height']);
        }
    };
})();
