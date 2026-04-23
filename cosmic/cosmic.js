(() => {
  'use strict';

  const DATA_URL = '/cosmic/data/cosmic-poc-data.json';
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const STAR = {
    RA: 0,
    DEC: 1,
    MAG: 2,
    CI: 3,
    NAME: 4,
    CON: 5,
    DIST_PC: 6,
    SPECT: 7,
  };

  const ZODIAC = [
    ['Ari', 'Aries'],
    ['Tau', 'Taurus'],
    ['Gem', 'Gemini'],
    ['Cnc', 'Cancer'],
    ['Leo', 'Leo'],
    ['Vir', 'Virgo'],
    ['Lib', 'Libra'],
    ['Sco', 'Scorpius'],
    ['Sgr', 'Sagittarius'],
    ['Cap', 'Capricornus'],
    ['Aqr', 'Aquarius'],
    ['Psc', 'Pisces'],
  ];

  const ZODIAC_SET = new Set(ZODIAC.map((item) => item[0]));
  const ZODIAC_NAME = Object.fromEntries(ZODIAC);

  const CONSTELLATION_NAMES = {
    And: 'Andromeda', Ant: 'Antlia', Aps: 'Apus', Aqr: 'Aquarius', Aql: 'Aquila',
    Ara: 'Ara', Ari: 'Aries', Aur: 'Auriga', Boo: 'Bootes', Cae: 'Caelum',
    Cam: 'Camelopardalis', Cnc: 'Cancer', CVn: 'Canes Venatici', CMa: 'Canis Major',
    CMi: 'Canis Minor', Cap: 'Capricornus', Car: 'Carina', Cas: 'Cassiopeia',
    Cen: 'Centaurus', Cep: 'Cepheus', Cet: 'Cetus', Cha: 'Chamaeleon', Cir: 'Circinus',
    Col: 'Columba', Com: 'Coma Berenices', CrA: 'Corona Australis', CrB: 'Corona Borealis',
    Crv: 'Corvus', Crt: 'Crater', Cru: 'Crux', Cyg: 'Cygnus', Del: 'Delphinus',
    Dor: 'Dorado', Dra: 'Draco', Equ: 'Equuleus', Eri: 'Eridanus', For: 'Fornax',
    Gem: 'Gemini', Gru: 'Grus', Her: 'Hercules', Hor: 'Horologium', Hya: 'Hydra',
    Hyi: 'Hydrus', Ind: 'Indus', Lac: 'Lacerta', Leo: 'Leo', LMi: 'Leo Minor',
    Lep: 'Lepus', Lib: 'Libra', Lup: 'Lupus', Lyn: 'Lynx', Lyr: 'Lyra', Men: 'Mensa',
    Mic: 'Microscopium', Mon: 'Monoceros', Mus: 'Musca', Nor: 'Norma', Oct: 'Octans',
    Oph: 'Ophiuchus', Ori: 'Orion', Pav: 'Pavo', Peg: 'Pegasus', Per: 'Perseus',
    Phe: 'Phoenix', Pic: 'Pictor', Psc: 'Pisces', PsA: 'Piscis Austrinus', Pup: 'Puppis',
    Pyx: 'Pyxis', Ret: 'Reticulum', Sge: 'Sagitta', Sgr: 'Sagittarius', Sco: 'Scorpius',
    Scl: 'Sculptor', Sct: 'Scutum', Ser: 'Serpens', Sex: 'Sextans', Tau: 'Taurus',
    Tel: 'Telescopium', Tri: 'Triangulum', TrA: 'Triangulum Australe', Tuc: 'Tucana',
    UMa: 'Ursa Major', UMi: 'Ursa Minor', Vel: 'Vela', Vir: 'Virgo', Vol: 'Volans',
    Vul: 'Vulpecula',
  };

  const SPECTRAL_INFO = {
    O: { label: 'Type O (Blue)', temp: '30,000-50,000 K', twinkle: 2.6, amp: 0.18 },
    B: { label: 'Type B (Blue-White)', temp: '10,000-30,000 K', twinkle: 2.3, amp: 0.16 },
    A: { label: 'Type A (White)', temp: '7,500-10,000 K', twinkle: 2.0, amp: 0.15 },
    F: { label: 'Type F (Yellow-White)', temp: '6,000-7,500 K', twinkle: 1.7, amp: 0.13 },
    G: { label: 'Type G (Yellow, Sun-like)', temp: '5,200-6,000 K', twinkle: 1.5, amp: 0.12 },
    K: { label: 'Type K (Orange)', temp: '3,700-5,200 K', twinkle: 1.2, amp: 0.1 },
    M: { label: 'Type M (Red)', temp: '2,400-3,700 K', twinkle: 0.95, amp: 0.09 },
    U: { label: 'Unknown Type', temp: 'Unknown', twinkle: 1.3, amp: 0.11 },
  };

  const GL_COLORS = {
    constellations: [0.5, 0.66, 0.95, 0.14],
    graph: [0.5, 1.0, 0.89, 0.1],
    optimal: [1.0, 0.84, 0.53, 0.5],
    user: [0.52, 1.0, 0.9, 0.96],
  };

  const state = {
    app: null,
    glCanvas: null,
    canvas: null,
    ctx: null,
    webglRenderer: null,
    width: 0,
    height: 0,
    dpr: 1,
    loaded: false,

    stars: [],
    edges: [],
    segments: [],
    brightCandidates: [],
    namedCandidates: [],
    starsByCon: new Map(),
    milkyMap: null,

    starEq: null,      // Float32Array [x,y,z]*n
    starHzn: null,     // Float32Array [e,n,u]*n
    starX: null,       // Float32Array projected screen x
    starY: null,       // Float32Array projected screen y
    starZ: null,       // Float32Array camera forward depth
    starVisible: null, // Uint8Array in front of camera
    aboveHorizon: null,// Uint8Array above horizon
    starPhase: null,   // Float32Array per-star animation phase
    starSpeed: null,   // Float32Array per-star animation speed
    starAmp: null,     // Float32Array per-star twinkle amplitude

    segEq: null,       // Float32Array [x1,y1,z1,x2,y2,z2]*m

    adjacency: [],
    edgeWeight: new Map(),

    observer: {
      lat: 47.6062,
      lon: -122.3321,
      live: true,
      timeScale: 1,
      simUtcMs: Date.now(),
      label: 'Seattle fallback',
      lstDeg: 0,
    },

    skyMatrix: {
      e11: 0, e12: 0, e13: 0,
      n11: 0, n12: 0, n13: 0,
      u11: 0, u12: 0, u13: 0,
    },

    camera: {
      az: 184,      // heading from north clockwise
      alt: 37,      // look altitude
      fov: 72,
      minFov: 34,
      maxFov: 108,
      right: [1, 0, 0],
      up: [0, 0, 1],
      forward: [0, 1, 0],
    },

    interaction: {
      dragging: false,
      moved: false,
      lastX: 0,
      lastY: 0,
      hoverStar: -1,
      selectedStar: -1,
    },

    render: {
      showGraph: false,
      showLabels: true,
      useWebGL: false,
      glQuality: 'high',
      rafId: 0,
      prevFrameMs: 0,
    },

    mission: {
      start: -1,
      end: -1,
      optimalPath: [],
      optimalDistance: 0,
      userPath: [],
      userDistance: 0,
      sector: '--',
      status: 'Preparing sky...',
    },

    toastTimer: null,
  };

  const el = {};

  function $(id) {
    return document.getElementById(id);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function normDeg(v) {
    let out = v % 360;
    if (out < 0) out += 360;
    return out;
  }

  function cardinalFromAz(az) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(normDeg(az) / 45) % 8];
  }

  function hmsFromDegrees(deg) {
    const totalSeconds = ((normDeg(deg) / 15) * 3600);
    const h = Math.floor(totalSeconds / 3600) % 24;
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function setLoading(msg) {
    if (el.loadingSub) el.loadingSub.textContent = msg;
  }

  function decodeBase64U8(base64) {
    if (!base64) return null;
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      out[i] = raw.charCodeAt(i);
    }
    return out;
  }

  function hideLoading() {
    el.loading.classList.add('hidden');
  }

  function showToast(msg, duration = 2200) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');

    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }
    state.toastTimer = window.setTimeout(() => {
      el.toast.classList.add('hidden');
      state.toastTimer = null;
    }, duration);
  }

  function vecNormalize(out, x, y, z) {
    const len = Math.hypot(x, y, z) || 1;
    out[0] = x / len;
    out[1] = y / len;
    out[2] = z / len;
    return out;
  }

  function vecCross(out, ax, ay, az, bx, by, bz) {
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }

  function vecDot(ax, ay, az, bx, by, bz) {
    return ax * bx + ay * by + az * bz;
  }

  function angularDistanceDeg(ra1, dec1, ra2, dec2) {
    const r1 = ra1 * DEG;
    const r2 = ra2 * DEG;
    const d1 = dec1 * DEG;
    const d2 = dec2 * DEG;
    const cosSep =
      Math.sin(d1) * Math.sin(d2) +
      Math.cos(d1) * Math.cos(d2) * Math.cos(r1 - r2);
    return Math.acos(clamp(cosSep, -1, 1)) * RAD;
  }

  function colorFromCI(ci) {
    if (ci == null || Number.isNaN(ci)) return 'rgba(217,233,255,0.95)';
    const t = clamp((ci + 0.4) / 2.6, 0, 1);
    const r = Math.round(221 + 34 * t);
    const g = Math.round(244 - 82 * t);
    const b = Math.round(255 - 154 * t);
    return `rgba(${r},${g},${b},0.95)`;
  }

  function colorRgbFromCI(ci) {
    if (ci == null || Number.isNaN(ci)) return [217 / 255, 233 / 255, 1];
    const t = clamp((ci + 0.4) / 2.6, 0, 1);
    const r = (221 + 34 * t) / 255;
    const g = (244 - 82 * t) / 255;
    const b = (255 - 154 * t) / 255;
    return [r, g, b];
  }

  function starRadius(mag, depth) {
    const base = (7.1 - mag) * 0.82;
    const depthFactor = clamp(0.74 + depth * 0.56, 0.5, 1.42);
    return clamp(base * depthFactor, 0.62, 7.2);
  }

  function seededUnit(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function spectralClass(star) {
    const spect = (star[STAR.SPECT] || '').trim().toUpperCase();
    const first = spect ? spect[0] : '';
    if (SPECTRAL_INFO[first]) return first;

    const ci = star[STAR.CI];
    if (ci == null || Number.isNaN(ci)) return 'U';
    if (ci < -0.2) return 'O';
    if (ci < 0.0) return 'B';
    if (ci < 0.3) return 'A';
    if (ci < 0.58) return 'F';
    if (ci < 0.81) return 'G';
    if (ci < 1.4) return 'K';
    return 'M';
  }

  function distanceLy(star) {
    const d = star[STAR.DIST_PC];
    if (d == null || Number.isNaN(d) || d <= 0) return null;
    return d * 3.26156;
  }

  function constellationName(code) {
    if (!code) return '--';
    return CONSTELLATION_NAMES[code] || code;
  }

  function zodiacName(code) {
    return ZODIAC_NAME[code] || null;
  }

  function formatDistance(star) {
    const ly = distanceLy(star);
    if (ly == null) return 'Unknown';
    if (ly < 10) return `${ly.toFixed(2)} ly`;
    if (ly < 1000) return `${ly.toFixed(1)} ly`;
    return `${Math.round(ly).toLocaleString()} ly`;
  }

  function gmstDeg(utcMs) {
    const jd = utcMs / 86400000 + 2440587.5;
    const t = (jd - 2451545.0) / 36525;
    const gmst =
      280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * t * t -
      (t * t * t) / 38710000;
    return normDeg(gmst);
  }

  function computeSkyMatrix() {
    const lat = clamp(state.observer.lat, -89, 89) * DEG;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    const lstDeg = normDeg(gmstDeg(state.observer.simUtcMs) + state.observer.lon);
    state.observer.lstDeg = lstDeg;

    const lst = lstDeg * DEG;
    const sinL = Math.sin(lst);
    const cosL = Math.cos(lst);

    // Equatorial xyz -> local ENU (east,north,up)
    // east = [-sinL, cosL, 0] dot eq
    // north = [-sinLat*cosL, -sinLat*sinL, cosLat] dot eq
    // up = [cosLat*cosL, cosLat*sinL, sinLat] dot eq
    state.skyMatrix.e11 = -sinL;
    state.skyMatrix.e12 = cosL;
    state.skyMatrix.e13 = 0;

    state.skyMatrix.n11 = -sinLat * cosL;
    state.skyMatrix.n12 = -sinLat * sinL;
    state.skyMatrix.n13 = cosLat;

    state.skyMatrix.u11 = cosLat * cosL;
    state.skyMatrix.u12 = cosLat * sinL;
    state.skyMatrix.u13 = sinLat;
  }

  function updateHorizonVectors() {
    const eq = state.starEq;
    const h = state.starHzn;
    const above = state.aboveHorizon;
    const m = state.skyMatrix;

    for (let i = 0; i < state.stars.length; i++) {
      const p = i * 3;
      const x = eq[p + 0];
      const y = eq[p + 1];
      const z = eq[p + 2];

      const e = m.e11 * x + m.e12 * y + m.e13 * z;
      const n = m.n11 * x + m.n12 * y + m.n13 * z;
      const u = m.u11 * x + m.u12 * y + m.u13 * z;

      h[p + 0] = e;
      h[p + 1] = n;
      h[p + 2] = u;
      above[i] = u > 0.005 ? 1 : 0;
    }
  }

  function updateCameraBasis() {
    const az = state.camera.az * DEG;
    const alt = state.camera.alt * DEG;

    const fx = Math.cos(alt) * Math.sin(az);
    const fy = Math.cos(alt) * Math.cos(az);
    const fz = Math.sin(alt);

    const right = state.camera.right;
    const up = state.camera.up;
    const fwd = state.camera.forward;

    vecNormalize(fwd, fx, fy, fz);

    vecCross(right, fwd[0], fwd[1], fwd[2], 0, 0, 1);
    if (Math.hypot(right[0], right[1], right[2]) < 1e-5) {
      right[0] = 1;
      right[1] = 0;
      right[2] = 0;
    } else {
      vecNormalize(right, right[0], right[1], right[2]);
    }

    vecCross(up, right[0], right[1], right[2], fwd[0], fwd[1], fwd[2]);
    vecNormalize(up, up[0], up[1], up[2]);
  }

  function projectENU(e, n, u) {
    const r = state.camera.right;
    const up = state.camera.up;
    const f = state.camera.forward;

    const cx = vecDot(e, n, u, r[0], r[1], r[2]);
    const cy = vecDot(e, n, u, up[0], up[1], up[2]);
    const cz = vecDot(e, n, u, f[0], f[1], f[2]);

    if (cz <= 0.015) return null;

    const focal = (state.width * 0.5) / Math.tan((state.camera.fov * DEG) * 0.5);
    const x = state.width * 0.5 + (cx / cz) * focal;
    const y = state.height * 0.5 - (cy / cz) * focal;

    return { x, y, z: cz };
  }

  function computeObserverFrame(deltaMs) {
    if (state.render.prevFrameMs === 0) {
      state.render.prevFrameMs = performance.now();
    }

    if (state.observer.live) {
      state.observer.simUtcMs += deltaMs * state.observer.timeScale;
    }

    computeSkyMatrix();
    updateHorizonVectors();
    updateCameraBasis();
    updateObserverUI();
  }

  function refreshSkyImmediate() {
    computeSkyMatrix();
    updateHorizonVectors();
    updateCameraBasis();
  }

  function updateObserverUI() {
    const date = new Date(state.observer.simUtcMs);
    el.observerTime.textContent = date.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
    el.observerLst.textContent = hmsFromDegrees(state.observer.lstDeg);
    el.observerLocation.textContent = `${state.observer.lat.toFixed(3)}, ${state.observer.lon.toFixed(3)} (${state.observer.label})`;

    el.compassHeading.textContent = `${Math.round(normDeg(state.camera.az)).toString().padStart(3, '0')}° ${cardinalFromAz(state.camera.az)}`;
    el.compassAlt.textContent = `Altitude ${state.camera.alt >= 0 ? '+' : ''}${state.camera.alt.toFixed(1)}°`;
    el.compassFov.textContent = `FOV ${state.camera.fov.toFixed(0)}°`;
    el.compassRing.style.transform = `rotate(${-state.camera.az.toFixed(2)}deg)`;

    el.btnTimeSpeed.textContent = `Speed ${state.observer.timeScale}x`;
    el.btnLiveTime.setAttribute('aria-pressed', state.observer.live ? 'true' : 'false');
    el.btnLiveTime.textContent = state.observer.live ? 'Live Time' : 'Paused';
  }

  function edgeKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function buildGraph() {
    const n = state.stars.length;
    state.adjacency = Array.from({ length: n }, () => []);
    state.edgeWeight.clear();

    for (const edge of state.edges) {
      const a = edge[0];
      const b = edge[1];
      const w = edge[2];
      state.adjacency[a].push([b, w]);
      state.adjacency[b].push([a, w]);
      state.edgeWeight.set(edgeKey(a, b), w);
    }
  }

  function buildConstellationIndex() {
    state.starsByCon = new Map();
    for (let i = 0; i < state.stars.length; i++) {
      const con = state.stars[i][STAR.CON] || '';
      if (!con) continue;
      if (!state.starsByCon.has(con)) {
        state.starsByCon.set(con, []);
      }
      state.starsByCon.get(con).push(i);
    }
  }

  function initializeStarAnimationProfiles() {
    const n = state.stars.length;
    state.starPhase = new Float32Array(n);
    state.starSpeed = new Float32Array(n);
    state.starAmp = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const star = state.stars[i];
      const sClass = spectralClass(star);
      const info = SPECTRAL_INFO[sClass] || SPECTRAL_INFO.U;

      const d = star[STAR.DIST_PC];
      const distNorm = d && d > 0 ? clamp(Math.log10(d + 1) / 4, 0, 1) : 0.45;
      const magNorm = clamp((star[STAR.MAG] + 1.6) / 8.2, 0, 1);
      const seed = seededUnit(i + (star[STAR.MAG] * 17.37));

      state.starPhase[i] = seed * Math.PI * 2;
      state.starSpeed[i] = info.twinkle * (0.82 + distNorm * 0.68) * (0.92 + seededUnit(i * 1.97) * 0.3);

      const amp = info.amp * (0.62 + distNorm * 0.78) * (0.64 + magNorm * 0.7);
      state.starAmp[i] = clamp(amp, 0.035, 0.33);
    }
  }

  function routeDistance(path) {
    let sum = 0;
    for (let i = 1; i < path.length; i++) {
      const w = state.edgeWeight.get(edgeKey(path[i - 1], path[i]));
      if (w != null) sum += w;
    }
    return sum;
  }

  function minHeapPush(heap, item) {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = ((i - 1) >> 1);
      if (heap[p][0] <= item[0]) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = item;
  }

  function minHeapPop(heap) {
    if (heap.length === 0) return null;
    const root = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      let i = 0;
      while (true) {
        const l = i * 2 + 1;
        const r = l + 1;
        if (l >= heap.length) break;
        let c = l;
        if (r < heap.length && heap[r][0] < heap[l][0]) c = r;
        if (last[0] <= heap[c][0]) break;
        heap[i] = heap[c];
        i = c;
      }
      heap[i] = last;
    }
    return root;
  }

  function aStar(start, end, opts = {}) {
    if (start === end) return { path: [start], distance: 0 };

    const allowed = opts.allowedMask || null;
    if (allowed && (!allowed[start] || !allowed[end])) {
      return { path: [], distance: Infinity };
    }

    const visitBudget = opts.visitBudget || 180000;
    const n = state.stars.length;

    const gScore = new Float64Array(n);
    const fScore = new Float64Array(n);
    const came = new Int32Array(n);
    const closed = new Uint8Array(n);

    gScore.fill(Infinity);
    fScore.fill(Infinity);
    came.fill(-1);

    const endRA = state.stars[end][STAR.RA];
    const endDec = state.stars[end][STAR.DEC];

    gScore[start] = 0;
    fScore[start] = angularDistanceDeg(
      state.stars[start][STAR.RA],
      state.stars[start][STAR.DEC],
      endRA,
      endDec
    );

    const heap = [];
    minHeapPush(heap, [fScore[start], start]);

    let visits = 0;
    while (heap.length > 0) {
      const curPair = minHeapPop(heap);
      const current = curPair[1];

      if (closed[current]) continue;
      closed[current] = 1;

      visits += 1;
      if (visits > visitBudget) {
        return { path: [], distance: Infinity };
      }

      if (current === end) {
        const path = [end];
        let node = end;
        while (came[node] !== -1) {
          node = came[node];
          path.push(node);
        }
        path.reverse();
        return { path, distance: routeDistance(path) };
      }

      const neighbors = state.adjacency[current];
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i][0];
        const weight = neighbors[i][1];

        if (closed[neighbor]) continue;
        if (allowed && !allowed[neighbor]) continue;

        const tentative = gScore[current] + weight;
        if (tentative >= gScore[neighbor]) continue;

        came[neighbor] = current;
        gScore[neighbor] = tentative;

        const h = angularDistanceDeg(
          state.stars[neighbor][STAR.RA],
          state.stars[neighbor][STAR.DEC],
          endRA,
          endDec
        );

        fScore[neighbor] = tentative + h;
        minHeapPush(heap, [fScore[neighbor], neighbor]);
      }
    }

    return { path: [], distance: Infinity };
  }

  function starLabel(idx) {
    const s = state.stars[idx];
    if (!s) return '--';
    if (s[STAR.NAME]) return s[STAR.NAME];
    if (s[STAR.CON]) return `Star ${s[STAR.CON]}`;
    return `Star #${idx}`;
  }

  function starFactBlurb(star) {
    const sClass = spectralClass(star);
    const info = SPECTRAL_INFO[sClass] || SPECTRAL_INFO.U;
    const mag = star[STAR.MAG];
    const ly = distanceLy(star);
    const zodiac = zodiacName(star[STAR.CON]);

    const visibility = mag <= 2
      ? 'very bright to the naked eye'
      : mag <= 4
        ? 'visible from dark skies'
        : 'faint without ideal dark-sky conditions';

    const distanceLine = ly == null
      ? 'Its precise distance is not available in this dataset.'
      : `It is roughly ${formatDistance(star)} from Earth.`;

    const zodiacLine = zodiac
      ? `${zodiac} is one of the 12 zodiac constellations.`
      : `${constellationName(star[STAR.CON])} is outside the zodiac belt.`;

    return `${info.label} star (${info.temp}), ${visibility}. ${distanceLine} ${zodiacLine}`;
  }

  function updateFactsPanel(idx) {
    const star = state.stars[idx];
    if (!star) return;

    const sClass = spectralClass(star);
    const info = SPECTRAL_INFO[sClass] || SPECTRAL_INFO.U;
    const conCode = star[STAR.CON] || '--';
    const zodiac = zodiacName(conCode);
    const conFull = constellationName(conCode);

    el.factName.textContent = starLabel(idx);
    el.factCon.textContent = zodiac ? `${conFull} (${zodiac})` : conFull;
    el.factSpectral.textContent = `${star[STAR.SPECT] || sClass} · ${info.label}`;
    el.factMag.textContent = `${star[STAR.MAG].toFixed(2)} mag`;
    el.factDistance.textContent = formatDistance(star);
    el.factBlurb.textContent = starFactBlurb(star);
  }

  function missionGraphInfo() {
    const total = state.edges.length;
    const localCount = state.edges.filter((e) => e[3] === 1).length;
    const constCount = total - localCount;
    return `${state.stars.length.toLocaleString()} stars · ${localCount.toLocaleString()} local · ${constCount.toLocaleString()} constellation`;
  }

  function setMissionStatus(txt) {
    state.mission.status = txt;
    el.missionStatus.textContent = txt;
  }

  function updateStats() {
    el.statSector.textContent = state.mission.sector;
    el.statOptimal.textContent = Number.isFinite(state.mission.optimalDistance)
      ? `${state.mission.optimalDistance.toFixed(2)}°`
      : '--';

    el.statUser.textContent = state.mission.userPath.length > 1
      ? `${state.mission.userDistance.toFixed(2)}°`
      : '--';

    if (state.mission.userPath.length > 1 && state.mission.optimalDistance > 0) {
      const eff = clamp((state.mission.optimalDistance / state.mission.userDistance) * 100, 0, 100);
      el.statEfficiency.textContent = `${eff.toFixed(1)}%`;
    } else {
      el.statEfficiency.textContent = '--';
    }
  }

  function centerOnMission() {
    if (state.mission.start < 0 || state.mission.end < 0) return;

    const a = state.mission.start * 3;
    const b = state.mission.end * 3;

    const e = state.starHzn[a + 0] + state.starHzn[b + 0];
    const n = state.starHzn[a + 1] + state.starHzn[b + 1];
    const u = state.starHzn[a + 2] + state.starHzn[b + 2];

    const len = Math.hypot(e, n, u) || 1;
    const ee = e / len;
    const nn = n / len;
    const uu = u / len;

    const az = normDeg(Math.atan2(ee, nn) * RAD);
    const alt = clamp(Math.asin(clamp(uu, -1, 1)) * RAD, 4, 82);

    state.camera.az = az;
    state.camera.alt = alt;

    const dot = clamp(
      vecDot(
        state.starHzn[a + 0], state.starHzn[a + 1], state.starHzn[a + 2],
        state.starHzn[b + 0], state.starHzn[b + 1], state.starHzn[b + 2]
      ),
      -1,
      1
    );
    const sep = Math.acos(dot) * RAD;
    state.camera.fov = clamp(sep * 2.1, 50, 95);
  }

  function chooseVisibleMission() {
    const candidates = [];
    for (let i = 0; i < state.stars.length; i++) {
      if (!state.aboveHorizon[i]) continue;
      const mag = state.stars[i][STAR.MAG];
      if (mag <= 4.9) candidates.push(i);
    }

    if (candidates.length < 2) {
      return null;
    }

    for (let attempt = 0; attempt < 240; attempt++) {
      const start = candidates[Math.floor(Math.random() * candidates.length)];
      let end = candidates[Math.floor(Math.random() * candidates.length)];
      if (start === end) continue;

      const sep = angularDistanceDeg(
        state.stars[start][STAR.RA],
        state.stars[start][STAR.DEC],
        state.stars[end][STAR.RA],
        state.stars[end][STAR.DEC]
      );
      if (sep < 8 || sep > 80) continue;

      const result = aStar(start, end, {
        allowedMask: state.aboveHorizon,
        visitBudget: 240000,
      });

      if (!result.path.length) continue;
      if (result.path.length < 4 || result.path.length > 45) continue;
      if (result.distance < 7 || result.distance > 110) continue;

      return {
        start,
        end,
        path: result.path,
        distance: result.distance,
      };
    }

    return null;
  }

  function startNewMission() {
    const picked = chooseVisibleMission();
    if (!picked) {
      showToast('No viable mission in current sky. Try changing observer or time.', 2800);
      return;
    }

    state.mission.start = picked.start;
    state.mission.end = picked.end;
    state.mission.optimalPath = picked.path;
    state.mission.optimalDistance = picked.distance;
    state.mission.userPath = [picked.start];
    state.mission.userDistance = 0;
    state.interaction.selectedStar = picked.start;

    const fromCode = state.stars[picked.start][STAR.CON] || '--';
    const toCode = state.stars[picked.end][STAR.CON] || '--';
    const fromCon = constellationName(fromCode);
    const toCon = constellationName(toCode);
    const hemisphere = state.observer.lat >= 0 ? 'Northern Hemisphere' : 'Southern Hemisphere';
    state.mission.sector = `${hemisphere} · ${fromCon} → ${toCon}`;

    el.missionStart.textContent = starLabel(picked.start);
    el.missionEnd.textContent = starLabel(picked.end);
    el.missionGraph.textContent = missionGraphInfo();
    setMissionStatus('Route active. Click stars to chart your path.');

    centerOnMission();
    updateStats();
    updateFactsPanel(picked.start);
    showToast('New mission generated.');
  }

  function resetUserPath() {
    if (state.mission.start < 0) return;
    state.mission.userPath = [state.mission.start];
    state.mission.userDistance = 0;
    setMissionStatus('Path reset. Continue from start star.');
    updateStats();
  }

  function evaluateMissionComplete() {
    if (state.mission.end < 0 || state.mission.userPath.length < 2) return;
    const last = state.mission.userPath[state.mission.userPath.length - 1];
    if (last !== state.mission.end) return;

    const optimal = state.mission.optimalDistance;
    const user = state.mission.userDistance;
    const efficiency = clamp((optimal / user) * 100, 0, 100);
    const score = Math.round(1000 * efficiency / 100);

    setMissionStatus(`Complete. Efficiency ${efficiency.toFixed(1)}% · Score ${score}`);
    updateStats();
    showToast(`Route complete: ${efficiency.toFixed(1)}% efficiency`, 2600);
  }

  function nearestStarToCursor(x, y) {
    let best = -1;
    let bestD2 = Infinity;
    const r2Max = 17 * 17;

    for (let i = 0; i < state.stars.length; i++) {
      if (!state.starVisible[i]) continue;
      const dx = x - state.starX[i];
      const dy = y - state.starY[i];
      const d2 = dx * dx + dy * dy;
      if (d2 < r2Max && d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    }

    return best;
  }

  function appendPathTo(targetStar) {
    if (state.mission.start < 0 || state.mission.end < 0) return;

    const current = state.mission.userPath[state.mission.userPath.length - 1];
    if (targetStar === current) return;

    const micro = aStar(current, targetStar, {
      allowedMask: state.aboveHorizon,
      visitBudget: 120000,
    });

    if (!micro.path.length) {
      showToast('No visible-sky path to that star from current route.');
      return;
    }

    for (let i = 1; i < micro.path.length; i++) {
      state.mission.userPath.push(micro.path[i]);
    }

    state.mission.userDistance = routeDistance(state.mission.userPath);
    setMissionStatus(`Routing... ${state.mission.userPath.length} stars in path`);
    updateStats();
    evaluateMissionComplete();
  }

  function drawBackdrop() {
    const ctx = state.ctx;
    const g = ctx.createRadialGradient(
      state.width * 0.22,
      state.height * 0.12,
      40,
      state.width * 0.5,
      state.height * 0.55,
      state.width * 0.9
    );
    g.addColorStop(0, '#183765');
    g.addColorStop(0.3, '#0f2147');
    g.addColorStop(0.62, '#081529');
    g.addColorStop(1, '#050912');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.width, state.height);

    const ground = ctx.createLinearGradient(0, state.height * 0.5, 0, state.height);
    ground.addColorStop(0, 'rgba(15, 18, 26, 0.0)');
    ground.addColorStop(1, 'rgba(6, 8, 12, 0.82)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawHorizonLine() {
    const ctx = state.ctx;

    ctx.strokeStyle = state.render.useWebGL
      ? 'rgba(160, 201, 255, 0.16)'
      : 'rgba(134, 185, 255, 0.32)';
    ctx.lineWidth = state.render.useWebGL ? 1.15 : 1.35;
    ctx.beginPath();

    let drawing = false;
    for (let az = 0; az <= 360; az += 2) {
      const r = az * DEG;
      const e = Math.sin(r);
      const n = Math.cos(r);
      const p = projectENU(e, n, 0);

      if (!p) {
        drawing = false;
        continue;
      }

      if (!drawing) {
        ctx.moveTo(p.x, p.y);
        drawing = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }

    ctx.stroke();

    if (state.render.useWebGL) {
      ctx.strokeStyle = 'rgba(153, 208, 255, 0.08)';
      ctx.lineWidth = 3.6;
      ctx.stroke();
    }
  }

  function drawSkyGrid() {
    const ctx = state.ctx;
    ctx.strokeStyle = state.render.useWebGL
      ? 'rgba(114, 157, 223, 0.06)'
      : 'rgba(104, 146, 210, 0.14)';
    ctx.lineWidth = state.render.useWebGL ? 0.68 : 0.8;

    // altitude rings
    for (const altDeg of [15, 35, 55, 75]) {
      const alt = altDeg * DEG;
      const cosA = Math.cos(alt);
      const sinA = Math.sin(alt);
      ctx.beginPath();
      let drawing = false;
      for (let az = 0; az <= 360; az += 3) {
        const a = az * DEG;
        const e = cosA * Math.sin(a);
        const n = cosA * Math.cos(a);
        const p = projectENU(e, n, sinA);

        if (!p) {
          drawing = false;
          continue;
        }
        if (!drawing) {
          ctx.moveTo(p.x, p.y);
          drawing = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }

    // azimuth spokes
    for (let azDeg = 0; azDeg < 360; azDeg += 45) {
      const az = azDeg * DEG;
      ctx.beginPath();
      let drawing = false;
      for (let altDeg = 0; altDeg <= 85; altDeg += 2) {
        const alt = altDeg * DEG;
        const cosA = Math.cos(alt);
        const sinA = Math.sin(alt);
        const e = cosA * Math.sin(az);
        const n = cosA * Math.cos(az);
        const p = projectENU(e, n, sinA);

        if (!p) {
          drawing = false;
          continue;
        }

        if (!drawing) {
          ctx.moveTo(p.x, p.y);
          drawing = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }
  }

  function drawConstellations() {
    const ctx = state.ctx;
    const segEq = state.segEq;
    const m = state.skyMatrix;

    ctx.strokeStyle = 'rgba(135, 172, 230, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < state.segments.length; i++) {
      const p = i * 6;

      const x1 = segEq[p + 0];
      const y1 = segEq[p + 1];
      const z1 = segEq[p + 2];
      const x2 = segEq[p + 3];
      const y2 = segEq[p + 4];
      const z2 = segEq[p + 5];

      const e1 = m.e11 * x1 + m.e12 * y1 + m.e13 * z1;
      const n1 = m.n11 * x1 + m.n12 * y1 + m.n13 * z1;
      const u1 = m.u11 * x1 + m.u12 * y1 + m.u13 * z1;

      const e2 = m.e11 * x2 + m.e12 * y2 + m.e13 * z2;
      const n2 = m.n11 * x2 + m.n12 * y2 + m.n13 * z2;
      const u2 = m.u11 * x2 + m.u12 * y2 + m.u13 * z2;

      if (u1 < -0.1 && u2 < -0.1) continue;

      const a = projectENU(e1, n1, u1);
      const b = projectENU(e2, n2, u2);
      if (!a || !b) continue;

      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }

    ctx.stroke();
  }

  function drawGraphOverlay() {
    if (!state.render.showGraph) return;

    const ctx = state.ctx;
    ctx.strokeStyle = 'rgba(127, 255, 227, 0.12)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();

    for (const edge of state.edges) {
      const a = edge[0];
      const b = edge[1];
      if (!state.starVisible[a] || !state.starVisible[b]) continue;

      ctx.moveTo(state.starX[a], state.starY[a]);
      ctx.lineTo(state.starX[b], state.starY[b]);
    }

    ctx.stroke();
  }

  function drawPath(path, color, width) {
    if (!path || path.length < 2) return;

    const ctx = state.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();

    let drawing = false;
    for (let i = 0; i < path.length; i++) {
      const idx = path[i];
      if (!state.starVisible[idx]) {
        drawing = false;
        continue;
      }

      const x = state.starX[idx];
      const y = state.starY[idx];
      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  function drawStars() {
    const ctx = state.ctx;
    const t = performance.now() * 0.001;

    for (let i = 0; i < state.stars.length; i++) {
      if (!state.starVisible[i]) continue;

      const star = state.stars[i];
      const depth = state.starZ[i];
      const tw = 1 + (state.starAmp[i] || 0) * Math.sin(t * (state.starSpeed[i] || 1) + (state.starPhase[i] || 0));
      const radius = starRadius(star[STAR.MAG], depth) * tw;
      const x = state.starX[i];
      const y = state.starY[i];
      const alphaTwinkle = clamp(0.82 + (tw - 1) * 0.85, 0.55, 1);

      if (radius > 1.45) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(201,224,255,${clamp(0.09 + radius * 0.024, 0.08, 0.3)})`;
        ctx.arc(x, y, radius * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      const c = colorFromCI(star[STAR.CI]).replace('0.95)', `${alphaTwinkle.toFixed(3)})`);
      ctx.fillStyle = c;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (state.interaction.selectedStar === i) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 245, 185, 0.95)';
        ctx.lineWidth = 1.8;
        ctx.arc(x, y, radius + 6.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawLabels() {
    if (!state.render.showLabels) return;

    const ctx = state.ctx;
    drawZodiacLabels(ctx);

    for (let i = 0; i < state.namedCandidates.length; i++) {
      const idx = state.namedCandidates[i];
      if (!state.starVisible[idx]) continue;
      const s = state.stars[idx];
      if (s[STAR.MAG] > 2.3 && state.camera.fov > 70) continue;

      const fontSize = s[STAR.MAG] <= 1.1 ? 22 : s[STAR.MAG] <= 2.2 ? 19 : 17;
      ctx.font = `700 ${fontSize}px Rajdhani`;
      ctx.fillStyle = 'rgba(239,247,255,0.94)';
      ctx.strokeStyle = 'rgba(8, 16, 33, 0.75)';
      ctx.lineWidth = 3.6;
      ctx.strokeText(s[STAR.NAME], state.starX[idx] + 6, state.starY[idx] - 6);
      ctx.fillText(s[STAR.NAME], state.starX[idx] + 6, state.starY[idx] - 6);
    }
  }

  function drawZodiacLabels(ctx) {
    const minStars = 2;
    for (const [code, zodiacNameLabel] of ZODIAC) {
      const list = state.starsByCon.get(code);
      if (!list || list.length === 0) continue;

      let totalW = 0;
      let x = 0;
      let y = 0;
      let count = 0;

      for (let i = 0; i < list.length; i++) {
        const idx = list[i];
        if (!state.starVisible[idx]) continue;
        const mag = state.stars[idx][STAR.MAG];
        const w = clamp(2.2 - mag * 0.18, 0.16, 2.5);
        x += state.starX[idx] * w;
        y += state.starY[idx] * w;
        totalW += w;
        count += 1;
      }

      if (count < minStars || totalW <= 0) continue;

      const cx = x / totalW;
      const cy = y / totalW;
      const label = zodiacNameLabel.toUpperCase();

      const fontSize = state.camera.fov <= 62 ? 24 : 19;
      ctx.font = `700 ${fontSize}px Orbitron`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = 'rgba(4, 8, 17, 0.85)';
      ctx.fillStyle = 'rgba(255, 220, 149, 0.95)';
      ctx.strokeText(label, cx, cy);
      ctx.fillText(label, cx, cy);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }

  function drawMissionMarkers() {
    if (state.mission.start < 0 || state.mission.end < 0) return;
    const ctx = state.ctx;

    if (state.starVisible[state.mission.start]) {
      const sx = state.starX[state.mission.start];
      const sy = state.starY[state.mission.start];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(131,255,230,0.95)';
      ctx.lineWidth = 2.1;
      ctx.arc(sx, sy, 8.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.starVisible[state.mission.end]) {
      const ex = state.starX[state.mission.end];
      const ey = state.starY[state.mission.end];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,146,172,0.98)';
      ctx.lineWidth = 2.1;
      ctx.arc(ex, ey, 8.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawSelectedMarker() {
    const idx = state.interaction.selectedStar;
    if (idx < 0 || !state.starVisible[idx]) return;
    const ctx = state.ctx;
    const x = state.starX[idx];
    const y = state.starY[idx];
    const pulse = 0.75 + 0.25 * Math.sin(performance.now() * 0.006);

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 245, 185, ${0.8 + pulse * 0.15})`;
    ctx.lineWidth = 1.9;
    ctx.arc(x, y, 8.1 + pulse * 2.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHover() {
    const idx = state.interaction.hoverStar;
    if (idx < 0 || !state.starVisible[idx]) return;

    const star = state.stars[idx];
    const x = state.starX[idx];
    const y = state.starY[idx];

    const label = `${starLabel(idx)} · mag ${star[STAR.MAG].toFixed(2)} · ${constellationName(star[STAR.CON])}`;
    const ctx = state.ctx;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.25;
    ctx.arc(x, y, 9.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '600 14px Rajdhani';
    const pad = 8;
    const w = ctx.measureText(label).width + pad * 2;
    const h = 24;

    let bx = x + 12;
    let by = y - h - 10;
    if (bx + w > state.width - 8) bx = state.width - w - 8;
    if (by < 8) by = y + 12;

    ctx.fillStyle = 'rgba(6, 12, 24, 0.9)';
    ctx.fillRect(bx, by, w, h);
    ctx.strokeStyle = 'rgba(160,207,255,0.55)';
    ctx.strokeRect(bx, by, w, h);

    ctx.fillStyle = '#f1f7ff';
    ctx.fillText(label, bx + pad, by + 16);
  }

  function projectStarsForFrame() {
    const h = state.starHzn;

    for (let i = 0; i < state.stars.length; i++) {
      const p = i * 3;
      const proj = projectENU(h[p + 0], h[p + 1], h[p + 2]);
      if (!proj) {
        state.starVisible[i] = 0;
        continue;
      }

      const margin = 55;
      if (
        proj.x < -margin || proj.x > state.width + margin ||
        proj.y < -margin || proj.y > state.height + margin
      ) {
        state.starVisible[i] = 0;
        continue;
      }

      state.starVisible[i] = 1;
      state.starX[i] = proj.x;
      state.starY[i] = proj.y;
      state.starZ[i] = proj.z;
    }
  }

  function toClipX(x) {
    return (x / state.width) * 2 - 1;
  }

  function toClipY(y) {
    return 1 - (y / state.height) * 2;
  }

  function pushLineSegment(out, ax, ay, bx, by, color) {
    out.push(
      toClipX(ax), toClipY(ay), color[0], color[1], color[2], color[3],
      toClipX(bx), toClipY(by), color[0], color[1], color[2], color[3]
    );
  }

  function batchFromArrayData(arr) {
    if (arr.length === 0) return null;
    return {
      data: new Float32Array(arr),
      count: arr.length / 6,
    };
  }

  function buildConstellationBatch() {
    const out = [];
    const segEq = state.segEq;
    const m = state.skyMatrix;

    for (let i = 0; i < state.segments.length; i++) {
      const p = i * 6;
      const x1 = segEq[p + 0];
      const y1 = segEq[p + 1];
      const z1 = segEq[p + 2];
      const x2 = segEq[p + 3];
      const y2 = segEq[p + 4];
      const z2 = segEq[p + 5];

      const e1 = m.e11 * x1 + m.e12 * y1 + m.e13 * z1;
      const n1 = m.n11 * x1 + m.n12 * y1 + m.n13 * z1;
      const u1 = m.u11 * x1 + m.u12 * y1 + m.u13 * z1;
      const e2 = m.e11 * x2 + m.e12 * y2 + m.e13 * z2;
      const n2 = m.n11 * x2 + m.n12 * y2 + m.n13 * z2;
      const u2 = m.u11 * x2 + m.u12 * y2 + m.u13 * z2;

      if (u1 < -0.1 && u2 < -0.1) continue;

      const a = projectENU(e1, n1, u1);
      const b = projectENU(e2, n2, u2);
      if (!a || !b) continue;

      pushLineSegment(out, a.x, a.y, b.x, b.y, GL_COLORS.constellations);
    }

    return batchFromArrayData(out);
  }

  function buildGraphBatch() {
    if (!state.render.showGraph) return null;
    const out = [];

    for (let i = 0; i < state.edges.length; i++) {
      const edge = state.edges[i];
      const a = edge[0];
      const b = edge[1];
      if (!state.starVisible[a] || !state.starVisible[b]) continue;
      pushLineSegment(out, state.starX[a], state.starY[a], state.starX[b], state.starY[b], GL_COLORS.graph);
    }

    return batchFromArrayData(out);
  }

  function buildPathBatch(path, color) {
    if (!path || path.length < 2) return null;
    const out = [];

    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      if (!state.starVisible[a] || !state.starVisible[b]) continue;
      pushLineSegment(out, state.starX[a], state.starY[a], state.starX[b], state.starY[b], color);
    }

    return batchFromArrayData(out);
  }

  function buildStarBatch() {
    const out = [];

    for (let i = 0; i < state.stars.length; i++) {
      if (!state.starVisible[i]) continue;
      const star = state.stars[i];
      const depth = state.starZ[i];
      const mag = star[STAR.MAG];
      const baseRadius = starRadius(mag, depth);
      const luminous = clamp((3.1 - mag) / 4.2, 0, 1);
      const glam = 1.18 + luminous * 0.74;
      const size = baseRadius * glam + luminous * 1.65;
      const rgb = colorRgbFromCI(star[STAR.CI]);

      out.push(
        toClipX(state.starX[i]),
        toClipY(state.starY[i]),
        size,
        rgb[0],
        rgb[1],
        rgb[2],
        state.starPhase[i] || 0,
        state.starSpeed[i] || 1,
        state.starAmp[i] || 0.1
      );
    }

    if (out.length === 0) return null;
    return {
      data: new Float32Array(out),
      count: out.length / 9,
    };
  }

  function renderWebGLFrame(frameMs) {
    if (!state.webglRenderer || !state.render.useWebGL) return false;
    const m = state.skyMatrix;

    const scene = {
      timeSec: frameMs * 0.001,
      cameraAlt: state.camera.alt,
      fov: state.camera.fov,
      camRight: state.camera.right,
      camUp: state.camera.up,
      camFwd: state.camera.forward,
      enuToEq: [
        m.e11, m.e12, m.e13,
        m.n11, m.n12, m.n13,
        m.u11, m.u12, m.u13,
      ],
      stars: buildStarBatch(),
      constellations: buildConstellationBatch(),
      graph: buildGraphBatch(),
      optimalPath: buildPathBatch(state.mission.optimalPath, GL_COLORS.optimal),
      userPath: buildPathBatch(state.mission.userPath, GL_COLORS.user),
    };

    state.webglRenderer.render(scene);
    return true;
  }

  function render(frameMs) {
    state.render.rafId = requestAnimationFrame(render);

    if (!state.loaded) return;

    if (!state.render.prevFrameMs) {
      state.render.prevFrameMs = frameMs;
    }
    const deltaMs = clamp(frameMs - state.render.prevFrameMs, 0, 250);
    state.render.prevFrameMs = frameMs;

    computeObserverFrame(deltaMs);
    projectStarsForFrame();

    const ctx = state.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const didWebGL = renderWebGLFrame(frameMs);
    if (!didWebGL) {
      drawBackdrop();
      drawSkyGrid();
      drawConstellations();
      drawGraphOverlay();
      drawPath(state.mission.optimalPath, 'rgba(255, 210, 128, 0.36)', 2.4);
      drawPath(state.mission.userPath, 'rgba(132, 255, 227, 0.96)', 3.05);
      drawHorizonLine();
      drawStars();
    } else {
      if (state.render.showGraph) {
        drawSkyGrid();
      }
      drawHorizonLine();
    }

    drawMissionMarkers();
    if (didWebGL) {
      drawSelectedMarker();
    }
    drawLabels();
    drawHover();
  }

  function resize() {
    const rect = state.canvas.getBoundingClientRect();
    state.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    state.width = Math.max(1, Math.round(rect.width));
    state.height = Math.max(1, Math.round(rect.height));

    state.canvas.width = Math.round(state.width * state.dpr);
    state.canvas.height = Math.round(state.height * state.dpr);
    state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (state.webglRenderer) {
      state.webglRenderer.resize(state.width, state.height, state.dpr);
    } else if (state.glCanvas) {
      state.glCanvas.width = Math.round(state.width * state.dpr);
      state.glCanvas.height = Math.round(state.height * state.dpr);
    }
  }

  function toggleButton(btn, active) {
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function qualityLabel(level) {
    if (level === 'low') return 'FX Low';
    if (level === 'medium') return 'FX Med';
    return 'FX High';
  }

  function updateQualityUI() {
    if (!el.btnQuality) return;
    if (!state.render.useWebGL) {
      el.btnQuality.textContent = 'FX 2D';
      el.btnQuality.setAttribute('aria-disabled', 'true');
      return;
    }
    el.btnQuality.textContent = qualityLabel(state.render.glQuality);
    el.btnQuality.removeAttribute('aria-disabled');
  }

  function cycleQuality() {
    if (!state.webglRenderer || !state.render.useWebGL) {
      showToast('WebGL shaders unavailable. Running 2D renderer.');
      return;
    }
    const levels = ['high', 'medium', 'low'];
    const idx = levels.indexOf(state.render.glQuality);
    state.render.glQuality = levels[(idx + 1) % levels.length];
    state.webglRenderer.setQuality(state.render.glQuality);
    updateQualityUI();
    showToast(`Renderer quality: ${state.render.glQuality.toUpperCase()}`, 1300);
  }

  function cycleTimeSpeed() {
    const speeds = [1, 20, 120, 480];
    const idx = speeds.indexOf(state.observer.timeScale);
    state.observer.timeScale = speeds[(idx + 1) % speeds.length];
    updateObserverUI();
    showToast(`Time speed set to ${state.observer.timeScale}x`, 1400);
  }

  function initializeWebGL() {
    const RendererCtor = window.CosmicWebGLRenderer;
    if (!state.glCanvas || typeof RendererCtor !== 'function') {
      state.render.useWebGL = false;
      state.app.classList.add('webgl-fallback');
      updateQualityUI();
      return;
    }

    try {
      state.webglRenderer = new RendererCtor(state.glCanvas, {
        quality: state.render.glQuality,
      });
      state.webglRenderer.resize(state.width, state.height, state.dpr);
      if (state.milkyMap) {
        state.webglRenderer.setMilkyWayDensityMap(state.milkyMap);
      }
      state.render.useWebGL = true;
      state.app.classList.remove('webgl-fallback');
      state.app.classList.add('webgl-ready');
      updateQualityUI();
    } catch (err) {
      console.warn('[Cosmic] WebGL renderer init failed:', err);
      state.webglRenderer = null;
      state.render.useWebGL = false;
      state.app.classList.remove('webgl-ready');
      state.app.classList.add('webgl-fallback');
      updateQualityUI();
      showToast('Shader renderer unavailable. Using 2D fallback.');
    }
  }

  function applyObserverInputs() {
    const lat = parseFloat(el.observerLat.value);
    const lon = parseFloat(el.observerLon.value);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      showToast('Invalid observer coordinates.');
      return;
    }

    state.observer.lat = clamp(lat, -89, 89);
    state.observer.lon = clamp(lon, -180, 180);
    state.observer.label = 'manual';

    refreshSkyImmediate();
    showToast('Observer location updated.', 1500);
    updateObserverUI();
    startNewMission();
  }

  function useGeolocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.observer.lat = clamp(pos.coords.latitude, -89, 89);
        state.observer.lon = clamp(pos.coords.longitude, -180, 180);
        state.observer.label = 'gps';
        el.observerLat.value = state.observer.lat.toFixed(4);
        el.observerLon.value = state.observer.lon.toFixed(4);

        refreshSkyImmediate();
        showToast('Using your current Earth location.', 1800);
        updateObserverUI();
        startNewMission();
      },
      (err) => {
        console.warn('[Cosmic] Geolocation failed:', err);
        showToast('Could not access your location.');
      },
      {
        timeout: 12000,
        enableHighAccuracy: false,
      }
    );
  }

  function bindUI() {
    el.btnNewRoute.addEventListener('click', startNewMission);
    el.btnReset.addEventListener('click', resetUserPath);
    el.btnCenter.addEventListener('click', centerOnMission);

    el.btnGraph.addEventListener('click', () => {
      state.render.showGraph = !state.render.showGraph;
      toggleButton(el.btnGraph, state.render.showGraph);
      showToast(state.render.showGraph ? 'Graph overlay on' : 'Graph overlay off', 1300);
    });

    el.btnLabels.addEventListener('click', () => {
      state.render.showLabels = !state.render.showLabels;
      toggleButton(el.btnLabels, state.render.showLabels);
      showToast(state.render.showLabels ? 'Labels on' : 'Labels off', 1300);
    });
    el.btnQuality.addEventListener('click', cycleQuality);

    el.btnApplyObserver.addEventListener('click', applyObserverInputs);
    el.btnGeolocate.addEventListener('click', useGeolocation);

    el.btnLiveTime.addEventListener('click', () => {
      state.observer.live = !state.observer.live;
      showToast(state.observer.live ? 'Live sky resumed.' : 'Sky paused.');
      updateObserverUI();
    });

    el.btnTimeSpeed.addEventListener('click', cycleTimeSpeed);

    window.addEventListener('keydown', (ev) => {
      const k = ev.key.toLowerCase();
      if (k === 'n') startNewMission();
      if (k === 'r') resetUserPath();
      if (k === 'c') centerOnMission();
      if (k === 'g') {
        state.render.showGraph = !state.render.showGraph;
        toggleButton(el.btnGraph, state.render.showGraph);
      }
      if (k === 'l') {
        state.render.showLabels = !state.render.showLabels;
        toggleButton(el.btnLabels, state.render.showLabels);
      }
      if (k === 'v') {
        cycleQuality();
      }
    });
  }

  function onPointerDown(ev) {
    state.interaction.dragging = true;
    state.interaction.moved = false;
    state.interaction.lastX = ev.clientX;
    state.interaction.lastY = ev.clientY;
    state.canvas.classList.add('dragging');
  }

  function onPointerMove(ev) {
    const rect = state.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    state.interaction.hoverStar = nearestStarToCursor(x, y);

    if (!state.interaction.dragging) return;

    const dx = ev.clientX - state.interaction.lastX;
    const dy = ev.clientY - state.interaction.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 1.2) {
      state.interaction.moved = true;
    }

    state.camera.az = normDeg(state.camera.az - dx * 0.23);
    state.camera.alt = clamp(state.camera.alt + dy * 0.16, -5, 88);

    state.interaction.lastX = ev.clientX;
    state.interaction.lastY = ev.clientY;
  }

  function onPointerUp(ev) {
    const wasDragging = state.interaction.dragging;
    const wasMoved = state.interaction.moved;
    state.interaction.dragging = false;
    state.canvas.classList.remove('dragging');

    if (!wasDragging || wasMoved) return;

    const rect = state.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const target = nearestStarToCursor(x, y);
    if (target >= 0) {
      state.interaction.selectedStar = target;
      updateFactsPanel(target);
      appendPathTo(target);
    }
  }

  function onWheel(ev) {
    ev.preventDefault();
    const delta = ev.deltaY;
    state.camera.fov = clamp(
      state.camera.fov + (delta > 0 ? 2.8 : -2.8),
      state.camera.minFov,
      state.camera.maxFov
    );
  }

  function bindCanvasInput() {
    state.canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    state.canvas.addEventListener('wheel', onWheel, { passive: false });
  }

  function initSkyBuffers() {
    const n = state.stars.length;
    state.starEq = new Float32Array(n * 3);
    state.starHzn = new Float32Array(n * 3);
    state.starX = new Float32Array(n);
    state.starY = new Float32Array(n);
    state.starZ = new Float32Array(n);
    state.starVisible = new Uint8Array(n);
    state.aboveHorizon = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      const ra = state.stars[i][STAR.RA] * DEG;
      const dec = state.stars[i][STAR.DEC] * DEG;

      const x = Math.cos(dec) * Math.cos(ra);
      const y = Math.cos(dec) * Math.sin(ra);
      const z = Math.sin(dec);

      const p = i * 3;
      state.starEq[p + 0] = x;
      state.starEq[p + 1] = y;
      state.starEq[p + 2] = z;
    }

    const m = state.segments.length;
    state.segEq = new Float32Array(m * 6);
    for (let i = 0; i < m; i++) {
      const s = state.segments[i];
      const ra1 = s[0] * DEG;
      const dec1 = s[1] * DEG;
      const ra2 = s[2] * DEG;
      const dec2 = s[3] * DEG;

      const p = i * 6;
      state.segEq[p + 0] = Math.cos(dec1) * Math.cos(ra1);
      state.segEq[p + 1] = Math.cos(dec1) * Math.sin(ra1);
      state.segEq[p + 2] = Math.sin(dec1);
      state.segEq[p + 3] = Math.cos(dec2) * Math.cos(ra2);
      state.segEq[p + 4] = Math.cos(dec2) * Math.sin(ra2);
      state.segEq[p + 5] = Math.sin(dec2);
    }
  }

  async function loadData() {
    setLoading('Fetching star catalog bundle...');
    const res = await fetch(DATA_URL);
    if (!res.ok) {
      throw new Error(`Dataset fetch failed (${res.status})`);
    }

    setLoading('Parsing stars and stellar graph...');
    const data = await res.json();

    state.stars = data.stars || [];
    state.edges = data.edges || [];
    state.segments = data.constellation_segments || [];
    state.brightCandidates = data.bright_candidates || [];
    state.namedCandidates = data.named_candidates || [];

    const milky = data.milky_way_density || null;
    if (
      milky &&
      milky.encoding === 'base64-u8' &&
      Number.isFinite(milky.width) &&
      Number.isFinite(milky.height) &&
      typeof milky.data === 'string'
    ) {
      const pixels = decodeBase64U8(milky.data);
      if (pixels && pixels.length === (milky.width * milky.height)) {
        state.milkyMap = {
          width: milky.width,
          height: milky.height,
          pixels,
        };
      }
    }

    initSkyBuffers();
    buildGraph();
    buildConstellationIndex();
    initializeStarAnimationProfiles();

    state.loaded = true;

    const counts = data.meta?.counts;
    if (counts) {
      showToast(`Loaded ${counts.stars.toLocaleString()} stars and ${counts.edges.toLocaleString()} links.`, 3000);
    }

    if (state.webglRenderer && state.milkyMap) {
      state.webglRenderer.setMilkyWayDensityMap(state.milkyMap);
    }
  }

  function bindElements() {
    state.app = $('cosmic-app');
    state.glCanvas = $('cosmic-gl-canvas');
    state.canvas = $('cosmic-canvas');
    state.ctx = state.canvas.getContext('2d', { alpha: true });

    el.loading = $('loading');
    el.loadingSub = $('loading-sub');
    el.toast = $('toast');

    el.statSector = $('stat-sector');
    el.statOptimal = $('stat-optimal');
    el.statUser = $('stat-user');
    el.statEfficiency = $('stat-efficiency');

    el.missionStart = $('mission-start');
    el.missionEnd = $('mission-end');
    el.missionGraph = $('mission-graph');
    el.missionStatus = $('mission-status');

    el.factName = $('fact-name');
    el.factCon = $('fact-con');
    el.factSpectral = $('fact-spectral');
    el.factMag = $('fact-mag');
    el.factDistance = $('fact-distance');
    el.factBlurb = $('fact-blurb');

    el.observerLocation = $('observer-location');
    el.observerTime = $('observer-time');
    el.observerLst = $('observer-lst');
    el.observerLat = $('observer-lat');
    el.observerLon = $('observer-lon');

    el.btnNewRoute = $('btn-new-route');
    el.btnReset = $('btn-reset');
    el.btnCenter = $('btn-center');
    el.btnGraph = $('btn-graph');
    el.btnLabels = $('btn-labels');
    el.btnQuality = $('btn-quality');

    el.btnApplyObserver = $('btn-apply-observer');
    el.btnGeolocate = $('btn-geolocate');
    el.btnLiveTime = $('btn-live-time');
    el.btnTimeSpeed = $('btn-time-speed');

    el.compassHeading = $('compass-heading');
    el.compassAlt = $('compass-alt');
    el.compassFov = $('compass-fov');
    el.compassRing = $('compass-ring');
  }

  async function init() {
    bindElements();
    resize();
    initializeWebGL();

    window.addEventListener('resize', resize);

    bindUI();
    bindCanvasInput();

    state.render.rafId = requestAnimationFrame(render);

    try {
      await loadData();
      refreshSkyImmediate();
      updateObserverUI();
      startNewMission();
      updateStats();
      hideLoading();
    } catch (err) {
      console.error('[Cosmic] init failed:', err);
      setLoading(`Failed to initialize cosmic view: ${err.message}`);
      showToast('Could not initialize cosmic mode.', 2600);
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
