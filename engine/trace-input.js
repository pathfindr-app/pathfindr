/* Pointer ownership is fixed at gesture start: a stroke never turns into a pan. */
(() => {
    window.PathfindrTrace = {
        mode: 'tap', active: false, undoStack: [],
        init(adapter) {
            this.adapter = adapter;
            try { this.mode = localStorage.getItem('pathfindr_input_mode') === 'trace' ? 'trace' : 'tap'; } catch {}
            const surface = adapter.surface;
            let pointer = null, pending = null, frame = null, last = null, checkpoint = null;
            const commit = point => {
                if (!point || !this.active || !adapter.canDraw()) return;
                if (last && Math.hypot(point.x - last.x, point.y - last.y) < 7) return;
                if (adapter.commit(point)) last = point;
            };
            const finish = (cancel = false) => {
                if (frame !== null) cancelAnimationFrame(frame);
                frame = null;
                if (!this.active) return;
                if (!cancel) commit(pending);
                pending = null;
                this.active = false;
                if (checkpoint !== null && adapter.changed(checkpoint)) this.undoStack.push(checkpoint);
                if (pointer !== null && surface.hasPointerCapture(pointer)) surface.releasePointerCapture(pointer);
                pointer = null;
                adapter.end(!cancel);
            };
            surface.addEventListener('pointerdown', event => {
                if (this.active && event.pointerId !== pointer) { finish(true); return; }
                if (this.mode !== 'trace' || event.button !== 0 || !adapter.canDraw()) return;
                const point = { x: event.clientX, y: event.clientY };
                if (!adapter.nearTip(point, event.pointerType === 'touch' ? 42 : 26)) return;
                event.preventDefault(); event.stopImmediatePropagation();
                this.active = true;
                pointer = event.pointerId;
                last = point;
                pending = null;
                checkpoint = adapter.snapshot();
                adapter.begin();
                surface.setPointerCapture(pointer);
            }, { capture: true, passive: false });
            surface.addEventListener('pointermove', event => {
                if (!this.active || event.pointerId !== pointer) return;
                event.preventDefault(); event.stopImmediatePropagation();
                pending = { x: event.clientX, y: event.clientY };
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
            document.getElementById('trace-hint').textContent = this.mode === 'trace' ? 'Trace forward. Follow your line backward to erase.' : 'Tap streets to build your route.';
        },
        backtrack(point, path, project) {
            if(path.length<2)return false;
            const tip=project(path.at(-1));if(!tip)return false;
            // Examine only a contiguous, nearby tail, not arbitrary path crossings.
            let traveled=0;
            for(let i=path.length-2;i>=0 && traveled<90;i--){
                const a=project(path[i]),b=project(path[i+1]);if(!a||!b)break;
                const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;traveled+=Math.sqrt(len2);
                if(len2<4)continue;
                const t=((point.x-a.x)*dx+(point.y-a.y)*dy)/len2;
                const corridor=Math.hypot(point.x-a.x-dx*Math.max(0,Math.min(1,t)),point.y-a.y-dy*Math.max(0,Math.min(1,t)));
                if(t>=-0.1 && t<0.85 && corridor<9 && Math.hypot(point.x-tip.x,point.y-tip.y)>10){path.splice(i+1);return true;}
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
