(() => {
  'use strict';

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(info);
    }
    return shader;
  }

  function createProgram(gl, vertSrc, fragSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(p) || 'unknown link error';
      gl.deleteProgram(p);
      throw new Error(info);
    }

    return p;
  }

  function createTexture(gl, width, height, opts = {}) {
    const internalFormat = opts.internalFormat || gl.RGBA8;
    const format = opts.format || gl.RGBA;
    const type = opts.type || gl.UNSIGNED_BYTE;
    const data = opts.data || null;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  function createFramebufferWithTex(gl, width, height) {
    const tex = createTexture(gl, width, height);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(tex);
      throw new Error('Framebuffer incomplete');
    }
    return { fbo, tex };
  }

  const FULLSCREEN_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

  const SKY_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_cameraAlt;
uniform float u_fov;
uniform float u_quality;
uniform vec3 u_camRight;
uniform vec3 u_camUp;
uniform vec3 u_camFwd;
uniform mat3 u_enuToEq;
uniform sampler2D u_mwTex;
uniform float u_hasMilkyMap;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash2(vec2 p) {
  float n = hash(p);
  return vec2(n, hash(p + n + 17.31));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.05 + 13.37;
    a *= 0.5;
  }
  return v;
}

float starCell(vec2 p, float threshold, float size) {
  vec2 id = floor(p);
  vec2 gv = fract(p) - 0.5;
  float n = hash(id);
  if (n < threshold) return 0.0;

  vec2 ofs = (hash2(id + 17.1) - 0.5) * 0.72;
  float d = length(gv - ofs);
  float s = smoothstep(size, 0.0, d);
  return s * smoothstep(threshold, 1.0, n);
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec3 viewDirEnu(vec2 ndc) {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float tanHalf = tan(radians(u_fov) * 0.5);
  vec3 rayCam = normalize(vec3(ndc.x * aspect * tanHalf, ndc.y * tanHalf, 1.0));
  vec3 rayEnu = normalize(
    u_camRight * rayCam.x +
    u_camUp * rayCam.y +
    u_camFwd * rayCam.z
  );
  return rayEnu;
}

vec2 eqUvFromDir(vec3 eqDir) {
  float ra = atan(eqDir.y, eqDir.x);
  float dec = asin(clamp(eqDir.z, -1.0, 1.0));
  float u = fract((ra / (2.0 * 3.141592653589793)) + 1.0);
  float v = clamp((dec / 3.141592653589793) + 0.5, 0.0, 1.0);
  return vec2(u, v);
}

void main() {
  vec2 ndc = vec2(v_uv.x * 2.0 - 1.0, v_uv.y * 2.0 - 1.0);
  vec3 dirEnu = viewDirEnu(ndc);
  vec3 dirEq = normalize(u_enuToEq * dirEnu);
  vec2 eqUv = eqUvFromDir(dirEq);

  vec2 dome = vec2(eqUv.x * 2.0 - 1.0, eqUv.y * 2.0 - 1.0);
  dome.x *= u_resolution.x / max(u_resolution.y, 1.0);
  float q = clamp(u_quality, 0.0, 1.0);
  float up = clamp(dirEnu.z * 0.5 + 0.5, 0.0, 1.0);
  float zenith = pow(clamp(up, 0.0, 1.0), 0.75);
  vec3 cZenith = vec3(0.016, 0.034, 0.082);
  vec3 cMid = vec3(0.042, 0.086, 0.172);
  vec3 cHorizon = vec3(0.108, 0.188, 0.308);
  vec3 base = mix(cMid, cZenith, zenith);

  float altNorm = clamp((u_cameraAlt + 5.0) / 95.0, 0.0, 1.0);
  float horizonGlow = exp(-pow(max(0.0, 0.15 - dirEnu.z) * 3.8, 1.8));
  base += cHorizon * horizonGlow * (0.36 + (1.0 - altNorm) * 0.32);

  vec3 color = base;

  float mwSample = 0.0;
  if (u_hasMilkyMap > 0.5) {
    mwSample = texture(u_mwTex, eqUv).r;
  } else {
    // Fallback galactic latitude model if map is missing.
    vec3 galNorthEq = normalize(vec3(-0.86766615, -0.19807637, 0.45598378));
    float galLat = asin(dot(dirEq, galNorthEq));
    mwSample = exp(-pow(galLat * 2.5, 2.0));
  }

  float mwSoft = smoothstep(0.09, 0.95, mwSample);
  float mwCore = pow(mwSoft, 1.45);
  float mwGlow = pow(mwSoft, 0.78);

  vec3 mwA = vec3(0.18, 0.25, 0.44);
  vec3 mwB = vec3(0.50, 0.35, 0.60);
  float hue = fbm(rot2(0.35) * dome * 1.6 + vec2(2.7, -1.9));
  vec3 mwColor = mix(mwA, mwB, hue);

  color += mwColor * mwGlow * mix(0.22, 0.52, q);
  color += vec3(0.95, 0.88, 0.82) * mwCore * mix(0.08, 0.22, q);

  float dust = fbm(eqUv * vec2(210.0, 95.0) + vec2(4.7, -2.2));
  float dustMask = smoothstep(0.34, 0.86, dust) * mwCore;
  color -= vec3(0.11, 0.07, 0.03) * dustMask * 0.34;

  float auroraMask = exp(-pow((v_uv.y - 0.61) * 8.0, 2.0)) * (1.0 - altNorm);
  float aurora = smoothstep(0.45, 0.86, fbm(vec2(dome.x * 3.4 + u_time * 0.022, dome.y * 2.4)));
  color += vec3(0.06, 0.33, 0.24) * aurora * auroraMask * mix(0.03, 0.2, q);

  float stars = 0.0;
  vec2 starUv = eqUv * vec2(4096.0, 2048.0);
  stars += starCell(starUv * 0.52 + vec2(12.0, -5.0), 0.965, 0.085);
  stars += starCell(starUv * 0.87 - vec2(7.0, 9.0), 0.985, 0.07);
  stars += starCell(starUv * 1.24 + vec2(33.0, 18.0), 0.993, 0.055);
  stars *= mix(0.06, 0.25, q);
  color += vec3(stars);

  float grain = (hash(gl_FragCoord.xy + vec2(u_time * 17.0, -u_time * 13.0)) - 0.5) * 0.01;
  color += grain;

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

  const STAR_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
layout(location=1) in float a_size;
layout(location=2) in vec3 a_color;
layout(location=3) in vec3 a_anim;

uniform float u_time;
uniform float u_dpr;

out vec3 v_color;
out float v_twinkle;
out float v_size;

void main() {
  float tw = 1.0 + a_anim.z * sin(u_time * a_anim.y + a_anim.x);
  v_twinkle = tw;
  v_color = a_color;

  float size = max(1.6, a_size * u_dpr * (0.95 + tw * 0.82));
  v_size = size;
  gl_Position = vec4(a_pos, 0.0, 1.0);
  gl_PointSize = size;
}
`;

  const STAR_FRAG = `#version 300 es
precision highp float;
in vec3 v_color;
in float v_twinkle;
in float v_size;
out vec4 outColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;

  float core = smoothstep(0.42, 0.0, r);
  float halo = smoothstep(1.0, 0.12, r) * 0.68;
  float corona = smoothstep(1.0, 0.28, r) * 0.34;

  float cross = pow(max(0.0, 1.0 - min(abs(p.x), abs(p.y)) * 7.5), 3.4);
  float diag = pow(max(0.0, 1.0 - min(abs(p.x + p.y), abs(p.x - p.y)) * 4.6), 3.0);
  float burst = (cross + diag * 0.6) * smoothstep(4.2, 15.0, v_size);

  float alpha = clamp(core * 0.95 + halo * 0.52 + burst * 0.24, 0.0, 1.0);

  vec3 col = v_color * (0.85 + core * 1.45 + halo * 0.62 + corona * 0.35);
  col += v_color * burst * 1.15;
  col *= (0.92 + (v_twinkle - 1.0) * 0.78);
  outColor = vec4(col, alpha);
}
`;

  const LINE_VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
layout(location=1) in vec4 a_color;
out vec4 v_color;
void main() {
  v_color = a_color;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

  const LINE_FRAG = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}
`;

  const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2 u_dir;
uniform float u_threshold;

void main() {
  vec3 c0 = texture(u_tex, v_uv).rgb;
  float lum0 = dot(c0, vec3(0.2126, 0.7152, 0.0722));
  vec3 base = (u_threshold > 0.0)
    ? c0 * smoothstep(u_threshold, u_threshold + 0.26, lum0)
    : c0;

  vec3 sum = base * 0.32;
  sum += texture(u_tex, v_uv + u_dir * 1.3846).rgb * 0.22;
  sum += texture(u_tex, v_uv - u_dir * 1.3846).rgb * 0.22;
  sum += texture(u_tex, v_uv + u_dir * 3.2308).rgb * 0.12;
  sum += texture(u_tex, v_uv - u_dir * 3.2308).rgb * 0.12;

  outColor = vec4(sum, 1.0);
}
`;

  const COMPOSITE_FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bloomStrength;
uniform float u_aberration;
uniform float u_vignette;
uniform float u_grain;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = v_uv;
  vec2 px = 1.0 / max(u_resolution, vec2(1.0));

  float ca = u_aberration;
  float r = texture(u_scene, uv + vec2(ca, 0.0) * px).r;
  float g = texture(u_scene, uv).g;
  float b = texture(u_scene, uv - vec2(ca, 0.0) * px).b;
  vec3 scene = vec3(r, g, b);

  vec3 bloom = texture(u_bloom, uv).rgb;
  vec3 color = scene + bloom * u_bloomStrength;

  color = 1.0 - exp(-color * 1.22);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, 1.18);
  color = pow(color, vec3(0.93));

  vec2 c = uv * 2.0 - 1.0;
  c.x *= u_resolution.x / max(u_resolution.y, 1.0);
  float vig = 1.0 - smoothstep(0.45, 1.25, dot(c, c));
  color *= mix(1.0, vig, u_vignette);

  float grain = (hash(gl_FragCoord.xy + vec2(u_time * 19.0, -u_time * 7.0)) - 0.5) * u_grain;
  color += grain;

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

  class CosmicWebGLRenderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
      });
      if (!this.gl) {
        throw new Error('WebGL2 unavailable');
      }

      this.width = 1;
      this.height = 1;
      this.dpr = 1;
      this.quality = opts.quality || 'high';
      this.milkyTexture = null;
      this.milkyTextureFallback = null;

      this._initPrograms();
      this._initBuffers();
      this._initSkyTextures();
      this._initTargets();
    }

    _initPrograms() {
      const gl = this.gl;
      this.programs = {
        sky: createProgram(gl, FULLSCREEN_VERT, SKY_FRAG),
        stars: createProgram(gl, STAR_VERT, STAR_FRAG),
        lines: createProgram(gl, LINE_VERT, LINE_FRAG),
        blur: createProgram(gl, FULLSCREEN_VERT, BLUR_FRAG),
        composite: createProgram(gl, FULLSCREEN_VERT, COMPOSITE_FRAG),
      };
    }

    _initBuffers() {
      const gl = this.gl;

      this.buffers = {
        quad: gl.createBuffer(),
        stars: gl.createBuffer(),
        lines: gl.createBuffer(),
      };

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
          3, -1,
          -1, 3,
        ]),
        gl.STATIC_DRAW
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _initSkyTextures() {
      const gl = this.gl;
      this.milkyTextureFallback = createTexture(gl, 1, 1, {
        internalFormat: gl.R8,
        format: gl.RED,
        type: gl.UNSIGNED_BYTE,
        data: new Uint8Array([0]),
      });
      gl.bindTexture(gl.TEXTURE_2D, this.milkyTextureFallback);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    setMilkyWayDensityMap(map) {
      if (!map || !map.pixels || !map.width || !map.height) return;

      const gl = this.gl;
      if (this.milkyTexture) {
        gl.deleteTexture(this.milkyTexture);
        this.milkyTexture = null;
      }

      this.milkyTexture = createTexture(gl, map.width, map.height, {
        internalFormat: gl.R8,
        format: gl.RED,
        type: gl.UNSIGNED_BYTE,
        data: map.pixels,
      });
      gl.bindTexture(gl.TEXTURE_2D, this.milkyTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    _deleteTargets() {
      const gl = this.gl;
      if (!this.targets) return;
      for (const key of ['scene', 'ping', 'pong']) {
        const t = this.targets[key];
        if (t) {
          gl.deleteFramebuffer(t.fbo);
          gl.deleteTexture(t.tex);
        }
      }
      this.targets = null;
    }

    _initTargets() {
      this._deleteTargets();
      const gl = this.gl;
      const w = Math.max(1, Math.floor(this.width * this.dpr));
      const h = Math.max(1, Math.floor(this.height * this.dpr));
      this.targets = {
        scene: createFramebufferWithTex(gl, w, h),
        ping: createFramebufferWithTex(gl, w, h),
        pong: createFramebufferWithTex(gl, w, h),
      };
    }

    resize(width, height, dpr = 1) {
      this.width = Math.max(1, width | 0);
      this.height = Math.max(1, height | 0);
      this.dpr = Math.max(1, Math.min(2, dpr));

      const gl = this.gl;
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this._initTargets();
    }

    setQuality(level) {
      this.quality = level;
    }

    _qualityParams() {
      if (this.quality === 'low') {
        return {
          bloom: false,
          bloomStrength: 0.0,
          aberration: 0.28,
          vignette: 0.2,
          grain: 0.01,
          q: 0.4,
        };
      }
      if (this.quality === 'medium') {
        return {
          bloom: true,
          bloomStrength: 0.62,
          aberration: 0.36,
          vignette: 0.27,
          grain: 0.012,
          q: 0.74,
        };
      }
      return {
        bloom: true,
        bloomStrength: 0.98,
        aberration: 0.46,
        vignette: 0.3,
        grain: 0.012,
        q: 1.0,
      };
    }

    _drawFullscreen(program) {
      const gl = this.gl;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(0);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _drawSky(scene, q) {
      const gl = this.gl;
      const p = this.programs.sky;
      gl.useProgram(p);
      gl.uniform2f(gl.getUniformLocation(p, 'u_resolution'), this.canvas.width, this.canvas.height);
      gl.uniform1f(gl.getUniformLocation(p, 'u_time'), scene.timeSec);
      gl.uniform1f(gl.getUniformLocation(p, 'u_cameraAlt'), scene.cameraAlt);
      gl.uniform1f(gl.getUniformLocation(p, 'u_fov'), scene.fov);
      gl.uniform1f(gl.getUniformLocation(p, 'u_quality'), q);
      gl.uniform3f(gl.getUniformLocation(p, 'u_camRight'), scene.camRight[0], scene.camRight[1], scene.camRight[2]);
      gl.uniform3f(gl.getUniformLocation(p, 'u_camUp'), scene.camUp[0], scene.camUp[1], scene.camUp[2]);
      gl.uniform3f(gl.getUniformLocation(p, 'u_camFwd'), scene.camFwd[0], scene.camFwd[1], scene.camFwd[2]);
      gl.uniformMatrix3fv(gl.getUniformLocation(p, 'u_enuToEq'), false, new Float32Array(scene.enuToEq));

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.milkyTexture || this.milkyTextureFallback);
      gl.uniform1i(gl.getUniformLocation(p, 'u_mwTex'), 2);
      gl.uniform1f(gl.getUniformLocation(p, 'u_hasMilkyMap'), this.milkyTexture ? 1 : 0);

      this._drawFullscreen(p);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    _drawStars(starBatch, timeSec) {
      if (!starBatch || !starBatch.count) return;

      const gl = this.gl;
      const p = this.programs.stars;
      gl.useProgram(p);

      gl.uniform1f(gl.getUniformLocation(p, 'u_time'), timeSec);
      gl.uniform1f(gl.getUniformLocation(p, 'u_dpr'), this.dpr);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.stars);
      gl.bufferData(gl.ARRAY_BUFFER, starBatch.data, gl.DYNAMIC_DRAW);

      const stride = 9 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 2 * 4);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 3, gl.FLOAT, false, stride, 6 * 4);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, starBatch.count);
      gl.disable(gl.BLEND);

      gl.disableVertexAttribArray(0);
      gl.disableVertexAttribArray(1);
      gl.disableVertexAttribArray(2);
      gl.disableVertexAttribArray(3);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _drawLines(lineBatch) {
      if (!lineBatch || !lineBatch.count) return;

      const gl = this.gl;
      const p = this.programs.lines;
      gl.useProgram(p);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.lines);
      gl.bufferData(gl.ARRAY_BUFFER, lineBatch.data, gl.DYNAMIC_DRAW);

      const stride = 6 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 2 * 4);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.LINES, 0, lineBatch.count);
      gl.disable(gl.BLEND);

      gl.disableVertexAttribArray(0);
      gl.disableVertexAttribArray(1);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    _blur(srcTex, dstFbo, dirX, dirY, threshold) {
      const gl = this.gl;
      const p = this.programs.blur;

      gl.bindFramebuffer(gl.FRAMEBUFFER, dstFbo);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      gl.useProgram(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.uniform1i(gl.getUniformLocation(p, 'u_tex'), 0);
      gl.uniform2f(gl.getUniformLocation(p, 'u_dir'), dirX, dirY);
      gl.uniform1f(gl.getUniformLocation(p, 'u_threshold'), threshold);

      this._drawFullscreen(p);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    _composite(sceneTex, bloomTex, params, timeSec) {
      const gl = this.gl;
      const p = this.programs.composite;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      gl.useProgram(p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(gl.getUniformLocation(p, 'u_scene'), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomTex || sceneTex);
      gl.uniform1i(gl.getUniformLocation(p, 'u_bloom'), 1);

      gl.uniform2f(gl.getUniformLocation(p, 'u_resolution'), this.canvas.width, this.canvas.height);
      gl.uniform1f(gl.getUniformLocation(p, 'u_time'), timeSec);
      gl.uniform1f(gl.getUniformLocation(p, 'u_bloomStrength'), params.bloom ? params.bloomStrength : 0.0);
      gl.uniform1f(gl.getUniformLocation(p, 'u_aberration'), params.aberration);
      gl.uniform1f(gl.getUniformLocation(p, 'u_vignette'), params.vignette);
      gl.uniform1f(gl.getUniformLocation(p, 'u_grain'), params.grain);

      this._drawFullscreen(p);

      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    render(scene) {
      const gl = this.gl;
      const params = this._qualityParams();

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      // Scene pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.targets.scene.fbo);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      this._drawSky(scene, params.q);

      this._drawLines(scene.constellations);
      if (scene.graph) this._drawLines(scene.graph);
      this._drawLines(scene.optimalPath);
      this._drawLines(scene.userPath);
      this._drawStars(scene.stars, scene.timeSec);

      if (params.bloom) {
        const px = 1 / Math.max(1, this.canvas.width);
        const py = 1 / Math.max(1, this.canvas.height);

        this._blur(this.targets.scene.tex, this.targets.ping.fbo, px, 0, 0.53);
        this._blur(this.targets.ping.tex, this.targets.pong.fbo, 0, py, 0.0);
        this._blur(this.targets.pong.tex, this.targets.ping.fbo, px * 2.0, 0, 0.0);
        this._blur(this.targets.ping.tex, this.targets.pong.fbo, 0, py * 2.0, 0.0);

        this._composite(this.targets.scene.tex, this.targets.pong.tex, params, scene.timeSec);
      } else {
        this._composite(this.targets.scene.tex, null, params, scene.timeSec);
      }
    }

    destroy() {
      const gl = this.gl;
      if (!gl) return;

      this._deleteTargets();
      if (this.milkyTexture) {
        gl.deleteTexture(this.milkyTexture);
      }
      if (this.milkyTextureFallback) {
        gl.deleteTexture(this.milkyTextureFallback);
      }
      if (this.buffers) {
        gl.deleteBuffer(this.buffers.quad);
        gl.deleteBuffer(this.buffers.stars);
        gl.deleteBuffer(this.buffers.lines);
      }
      if (this.programs) {
        gl.deleteProgram(this.programs.sky);
        gl.deleteProgram(this.programs.stars);
        gl.deleteProgram(this.programs.lines);
        gl.deleteProgram(this.programs.blur);
        gl.deleteProgram(this.programs.composite);
      }
    }
  }

  window.CosmicWebGLRenderer = CosmicWebGLRenderer;
})();
