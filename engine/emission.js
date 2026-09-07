/* Selective multiscale emission compositor. Reuses the route renderer's GL context.
 * Half-float where supported, RGBA8 fallback; no extra canvas or GL context. */
(() => {
    let gl, width=0,height=0,targets=[],programs,quad,type,bloomGain=1;
    const state={enabled:true,hdr:false,ready:false,error:null};
    const vert='attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    function program(fragment){
        const p=gl.createProgram();
        for(const [kind,src] of [[gl.VERTEX_SHADER,vert],[gl.FRAGMENT_SHADER,fragment]]){
            const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);
            if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
            gl.attachShader(p,s);gl.deleteShader(s);
        }
        gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
        return p;
    }
    function release(){for(const t of targets){gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.fbo);}targets=[];}
    function target(w,h){
        const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,type,null);
        const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
        const t={texture,fbo,w,h};targets.push(t);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Unsupported emission framebuffer');
        return t;
    }
    function allocate(w,h){
        release();width=w;height=h;
        try {target(w,h);for(const factor of [2,4,8]){target(Math.max(1,Math.floor(w/factor)),Math.max(1,Math.floor(h/factor)));target(Math.max(1,Math.floor(w/factor)),Math.max(1,Math.floor(h/factor)));}}
        catch(error){if(type===gl.UNSIGNED_BYTE)throw error;release();type=gl.UNSIGNED_BYTE;state.hdr=false;allocate(w,h);}
    }
    function bind(p,t){
        gl.bindFramebuffer(gl.FRAMEBUFFER,t?.fbo||null);gl.viewport(0,0,t?.w||width,t?.h||height);gl.useProgram(p);
        gl.bindBuffer(gl.ARRAY_BUFFER,quad);const a=gl.getAttribLocation(p,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    }
    function texture(p,name,t,unit){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t.texture);gl.uniform1i(gl.getUniformLocation(p,name),unit);}
    window.PathfindrEmission={state,
        begin(context,w,h,gain=1){
            bloomGain=Math.max(0,Math.min(1,gain));
            if(!state.enabled)return false;
            try{
                if(gl!==context){gl=context;width=0;targets=[];programs=null;state.ready=false;}
                if(!programs){
                    const half=gl.getExtension('OES_texture_half_float');const linear=gl.getExtension('OES_texture_half_float_linear');const renderable=gl.getExtension('EXT_color_buffer_half_float');
                    state.hdr=!!(half&&linear&&renderable);type=state.hdr?half.HALF_FLOAT_OES:gl.UNSIGNED_BYTE;
                    programs={blur:program(`precision highp float; varying vec2 uv; uniform sampler2D source; uniform vec2 direction;
                        void main(){vec4 c=texture2D(source,uv)*0.227027;c+=(texture2D(source,uv+direction*1.384615)+texture2D(source,uv-direction*1.384615))*0.316216;c+=(texture2D(source,uv+direction*3.230769)+texture2D(source,uv-direction*3.230769))*0.070270;gl_FragColor=c;}`),
                        composite:program(`precision highp float;varying vec2 uv;uniform float bloomGain;uniform sampler2D core;uniform sampler2D nearGlow;uniform sampler2D midGlow;uniform sampler2D farGlow;
                        void main(){vec3 c=texture2D(core,uv).rgb;vec3 glow=texture2D(nearGlow,uv).rgb*.40+texture2D(midGlow,uv).rgb*.32+texture2D(farGlow,uv).rgb*.24;
                        vec3 mapped=vec3(1.0)-exp(-(c+glow*bloomGain)*.8);gl_FragColor=vec4(mapped,clamp(max(mapped.r,max(mapped.g,mapped.b)),0.0,1.0));}`)};
                    quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
                    gl.canvas.addEventListener('webglcontextrestored',()=>{programs=null;targets=[];width=0;state.ready=false;});
                }
                if(w!==width||h!==height)allocate(w,h);
                gl.bindFramebuffer(gl.FRAMEBUFFER,targets[0].fbo);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
                state.ready=true;return true;
            }catch(error){state.error=error.message;state.enabled=false;gl?.bindFramebuffer(gl.FRAMEBUFFER,null);return false;}
        },
        end(){
            if(!state.ready)return;
            gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
            for(let i=1;i<targets.length;i+=2){const a=targets[i],b=targets[i+1];
                bind(programs.blur,a);texture(programs.blur,'source',targets[0],0);gl.uniform2f(gl.getUniformLocation(programs.blur,'direction'),1/a.w,0);gl.drawArrays(gl.TRIANGLES,0,6);
                bind(programs.blur,b);texture(programs.blur,'source',a,0);gl.uniform2f(gl.getUniformLocation(programs.blur,'direction'),0,1/a.h);gl.drawArrays(gl.TRIANGLES,0,6);
            }
            bind(programs.composite,null);texture(programs.composite,'core',targets[0],0);texture(programs.composite,'nearGlow',targets[2],1);texture(programs.composite,'midGlow',targets[4],2);texture(programs.composite,'farGlow',targets[6],3);
            gl.uniform1f(gl.getUniformLocation(programs.composite,'bloomGain'),bloomGain);
            gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.drawArrays(gl.TRIANGLES,0,6);
            gl.activeTexture(gl.TEXTURE0);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
        }
    };
})();
