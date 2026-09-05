(() => {
    const jobs=new Set();
    window.PathfindrMotion = {
        managed:false,
        tick(delta) {for(const job of [...jobs])job(delta);},
        reduced: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
        animate(duration, update, valid = () => true) {
            return new Promise(resolve => {
                let elapsed = 0, previous = performance.now();
                if(this.managed){
                    const job=delta=>{
                        if(!valid()){jobs.delete(job);resolve(false);return;}
                        if(!document.hidden)elapsed+=Math.min(64,delta);
                        const progress=this.reduced()?1:Math.min(1,elapsed/Math.max(1,duration));
                        update(progress);if(progress===1){jobs.delete(job);resolve(true);}
                    };jobs.add(job);return;
                }
                const frame = now => {
                    if (!valid()) { resolve(false); return; }
                    if (!document.hidden) elapsed += Math.min(64, now - previous);
                    previous = now;
                    const progress = this.reduced() ? 1 : Math.min(1, elapsed / Math.max(1, duration));
                    update(progress);
                    if (progress === 1) resolve(true); else requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            });
        },
        distances(path, nodes, distance) {
            const cumulative = [0];
            for (let i = 1; i < path.length; i++) {
                const a = nodes.get(path[i - 1]), b = nodes.get(path[i]);
                cumulative.push(cumulative.at(-1) + (a && b ? distance(a.lat, a.lng, b.lat, b.lng) : 0));
            }
            return cumulative;
        },
        indexAt(cumulative, progress) {
            const target = cumulative.at(-1) * progress;
            let low = 0, high = cumulative.length - 1;
            while (low < high) { const mid = Math.ceil((low + high) / 2); if (cumulative[mid] <= target) low = mid; else high = mid - 1; }
            if (low >= cumulative.length - 1) return low;
            return low + (target - cumulative[low]) / Math.max(1e-9, cumulative[low + 1] - cumulative[low]);
        }
    };
})();
