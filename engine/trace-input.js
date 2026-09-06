/* Pointer ownership is fixed at gesture start: a stroke never turns into a pan. */
(() => {
    window.PathfindrTrace = {
        mode: 'tap', active: false, undoStack: [],
        init(adapter) {
            this.adapter = adapter;
            try { this.mode = localStorage.getItem('pathfindr_input_mode') === 'trace' ? 'trace' : 'tap'; } catch {}
            const surface = adapter.surface;
            let pointer = null, pending = null, frame = null, last = null, checkpoint = null;
            let edgeFrame=null,edgePoint=null,edgeTime=0;
            const edgeTick=now=>{
                edgeFrame=null;
                if(!this.active||!adapter.canDraw()){finish(true);return;}
                const dt=Math.min(32,Math.max(0,now-edgeTime))/1000;edgeTime=now;
                if(edgePoint&&adapter.pan?.(edgePoint,dt)){last=null;commit(edgePoint);}
                if(this.active)edgeFrame=requestAnimationFrame(edgeTick);
            };
            const commit = point => {
                if (!point || !this.active || !adapter.canDraw()) return;
                if (last && Math.hypot(point.x - last.x, point.y - last.y) < 7 && !adapter.tryFinish?.(point)) return;
                const accepted=adapter.commit(point);
                adapter.diagnose?.(point,accepted);
                if (accepted) last = point;
                if(accepted&&adapter.isFinished?.())finish(false,true);
            };
            const finish = (cancel = false, committed = false) => {
                if(edgeFrame!==null)cancelAnimationFrame(edgeFrame);
                edgeFrame=null;edgePoint=null;
                if (frame !== null) cancelAnimationFrame(frame);
                frame = null;
                if (!this.active) return;
                if (!cancel&&!committed) {commit(pending);if(!this.active)return;}
                const endPoint=this.focus;
                pending = null;
                this.active = false;
                this.focus=null;
                if (checkpoint !== null && adapter.changed(checkpoint)) this.undoStack.push(checkpoint);
                if (pointer !== null && surface.hasPointerCapture(pointer)) surface.releasePointerCapture(pointer);
                pointer = null;
                adapter.end(!cancel,endPoint);
            };
            surface.addEventListener('pointerdown', event => {
                if (this.active && event.pointerId !== pointer) { finish(true); return; }
                if (this.mode !== 'trace' || event.button !== 0 || !adapter.canDraw()) return;
                const point = { x: event.clientX, y: event.clientY };
                const near=adapter.nearTip(point,event.pointerType==='touch'?42:26);
                const resume=!near&&adapter.canResume?.(point,event.pointerType==='touch'?96:64);
                if(!near&&!resume)return;
                event.preventDefault(); event.stopImmediatePropagation();
                this.active = true;
                this.pointerType=event.pointerType;
                pointer = event.pointerId;
                last = point;
                pending = null;
                checkpoint = adapter.snapshot();
                adapter.begin();
                this.focus=point;
                edgePoint=point;
                if(resume){const accepted=adapter.commit(point);adapter.diagnose?.(point,accepted,true);}
                surface.setPointerCapture(pointer);
                if(adapter.isFinished?.()){finish(false,true);return;}
                edgeTime=performance.now();edgeFrame=requestAnimationFrame(edgeTick);
            }, { capture: true, passive: false });
            surface.addEventListener('pointermove', event => {
                if (!this.active || event.pointerId !== pointer) return;
                event.preventDefault(); event.stopImmediatePropagation();
                pending = { x: event.clientX, y: event.clientY };
                edgePoint=pending;
                this.focus=pending;
                if (frame !== null) return;
                frame = requestAnimationFrame(() => { frame = null; commit(pending); pending = null; });
            }, { capture: true, passive: false });
            surface.addEventListener('pointerup', event => {
                if (!this.active || event.pointerId !== pointer) return;
                event.preventDefault(); event.stopImmediatePropagation();
                pending = { x: event.clientX, y: event.clientY };
                finish();
            }, { capture: true, passive: false });
            surface.addEventListener('pointercancel', () => finish(true), true);
            surface.addEventListener('lostpointercapture', () => finish(true), true);
            window.addEventListener('blur', () => finish(true));
            document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true);});
            this.cancel = () => finish(true);
            this.syncButtons();
        },
        setMode(mode) {
            this.cancel?.();
            this.mode = mode === 'trace' ? 'trace' : 'tap';
            this.undoStack = [];
            try { localStorage.setItem('pathfindr_input_mode', this.mode); } catch {}
            this.syncButtons();
        },
        syncButtons() {
            // Browser-native touch scrolling must not cancel a captured drawing
            // stroke. MapLibre still handles navigation started outside the tip.
            if (this.adapter) this.adapter.surface.style.touchAction = this.mode === 'trace' ? 'none' : '';
            document.querySelectorAll('[data-input-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.inputMode === this.mode)));
            document.getElementById('trace-hint').textContent = this.mode === 'trace' ? 'Resume near your trail. Trace toward an edge to pan. Retrace to erase.' : 'Tap streets to build your route.';
        },
        backtrack(point, path, project, split = null) {
            if(path.length<2)return false;
            const tip=project(path.at(-1));if(!tip)return false;
            // Walk the contiguous tail newest-first, never jump to a remote crossing.
            const touch=this.pointerType==='touch',radius=touch?18:12,reach=touch?320:240;
            let traveled=0;
            for(let i=path.length-2;i>=0 && traveled<reach;i--){
                const a=project(path[i]),b=project(path[i+1]);if(!a||!b)break;
                const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy,len=Math.sqrt(len2);
                const priorTravel=traveled;traveled+=len;
                if(len2<4)continue;
                const t=((point.x-a.x)*dx+(point.y-a.y)*dy)/len2;
                const corridor=Math.hypot(point.x-a.x-dx*Math.max(0,Math.min(1,t)),point.y-a.y-dy*Math.max(0,Math.min(1,t)));
                const backDistance=priorTravel+(1-Math.max(0,Math.min(1,t)))*len;
                if(t>=-0.1 && t<=1 && backDistance>8 && backDistance<=reach && corridor<radius && Math.hypot(point.x-tip.x,point.y-tip.y)>8){
                    const fraction=Math.max(0,Math.min(1,t));
                    const id=split?.(path[i],path[i+1],fraction);
                    path.splice(i+1);
                    if(id!==undefined&&id!==null&&id!==path.at(-1))path.push(id);
                    return true;
                }
            }
            return false;
        },
        undo() {
            const checkpoint = this.undoStack.pop();
            if (checkpoint === undefined) return false;
            this.adapter.restore(checkpoint);
            return true;
        }
    };
})();
