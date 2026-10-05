// ================================================================ v7 scenes (Hello, World · written, sung and drawn by Claude)
FONTS.M = 'FM, FS'; FONTS.H = 'FH';
const K = {
  cream: '#F0EEE6', paper: '#FAF9F5', ink: '#1F1E1D', slate: '#141413', dark: '#1F1E1D',
  clay: '#D97757', clayD: '#B35C3E', grey: '#87867F', greyL: '#B0AEA5', rule: '#D9D6CB',
  cold: '#7D8896', coldD: '#2C3138', coldL: '#C3CCD6', red: '#B5483A', kraft: '#CDB894', news: '#E4E1D6', white: '#FFFFFF',
};
let WORDS = [], VOX = [], OSC = null;
const OSC_N = 128;
const VS_UV = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
const CAM0 = () => new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
const LOUDSEC = [[BARt(16), BARt(26)], [BARt(42), BARt(52)], [BARt(62), BARt(76)]];
const inLoud = t => LOUDSEC.some(([a, b]) => t >= a && t < b);
function voxAt(t) { const i = clamp(Math.floor(t * FPS), 0, ENV.vox.length - 1); return ENV.vox[i] || 0; }
function loudAt(t) { const i = clamp(Math.floor(t * FPS), 0, ENV.loud.length - 1); return ENV.loud[i] || 0; }
function pulseFrom(list, t, decay = 7) {
  let lo = 0, hi = list.length - 1; if (hi < 0 || t < list[0]) return 0;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (list[m] <= t) lo = m; else hi = m - 1; }
  return Math.exp(-(t - list[lo]) * decay);
}
function slamIn(k, dur = 0.22) { const u = clamp(k / dur); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
const cs = (i, j) => WORDS[i].chars[j].s;
const ce = (i, j) => WORDS[i].chars[j].e;
const sFirst = i => WORDS[i].chars[0].s;
const eLast = i => WORDS[i].chars[WORDS[i].chars.length - 1].e;
const sLast = i => WORDS[i].chars[WORDS[i].chars.length - 1].s;
let CUR = null;
function nextStart(i) { return WORDS[i + 1] ? WORDS[i + 1].chars[0].s : eLast(i) + 2; }
function shuffled(n, seed) { const a = [...Array(n).keys()], r = rng(seed); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function setChar(m, a, sc = 1, dx = 0, dy = 0, rot = 0) {
  if (!m.userData.sx) { m.userData.sx = m.scale.x; m.userData.sy = m.scale.y; }
  m.material.opacity = a; m.scale.set(m.userData.sx * sc, m.userData.sy * sc, 1); m.position.x = m.userData.baseX + dx; m.position.y = dy; m.rotation.z = rot; m.visible = a > 0.003;
}
function plane(parent, w, h, col, { k = 1, a = 1, z = 0, add = false } = {}) {
  const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: C(col, k), transparent: true, opacity: a, toneMapped: false, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }));
  m.scale.set(w, h, 1); m.position.z = z; parent.add(m); return m;
}
function circle(parent, r, col, { k = 1, a = 1, seg = 40 } = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, seg), new THREE.MeshBasicMaterial({ color: C(col, k), transparent: true, opacity: a, toneMapped: false, depthWrite: false })); parent.add(m); return m;
}
function ring(parent, r0, r1, col, { k = 1, a = 1 } = {}) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 64), new THREE.MeshBasicMaterial({ color: C(col, k), transparent: true, opacity: a, toneMapped: false, depthWrite: false })); parent.add(m); return m;
}
function glowSprite(col, k = 1) {
  return new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: dotTex(), color: C(col, k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
}
function rrTex(w, h, r, o) {
  const s = 2, pad = o.shadow ? Math.ceil(o.shadow * 2) : 3, cv = document.createElement('canvas');
  cv.width = (w + pad * 2) * s; cv.height = (h + pad * 2) * s; const x = cv.getContext('2d'); x.scale(s, s);
  if (o.shadow) { x.shadowColor = `rgba(0,0,0,${o.shadowA ?? 0.1})`; x.shadowBlur = o.shadow; x.shadowOffsetY = o.shadow * 0.25; }
  x.fillStyle = o.fill || '#fff'; roundRect(x, pad, pad, w, h, r); x.fill(); x.shadowColor = 'transparent';
  if (o.stroke) { const lw = o.lw || 2; x.strokeStyle = o.stroke; x.lineWidth = lw; roundRect(x, pad + lw / 2, pad + lw / 2, w - lw, h - lw, Math.max(0, r - lw / 2)); x.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { t, ww: w + pad * 2, hh: h + pad * 2 };
}
function rrMesh(parent, w, h, r, o = {}) {
  const { t, ww, hh } = rrTex(w, h, r, o);
  const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, color: C('#ffffff', o.k || 1) }));
  m.scale.set(ww, hh, 1); parent.add(m); return m;
}
function makePaper(parent, col, amt = 1) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W + 60, H + 60), new THREE.ShaderMaterial({ uniforms: { col: { value: C(col) }, amt: { value: amt } }, vertexShader: VS_UV,
    fragmentShader: `uniform vec3 col; uniform float amt; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){ vec2 p = vUv*vec2(1980.0,1140.0); float v = n(p*0.011)*0.5 + n(p*0.045)*0.3 + n(vec2(p.x*0.35, p.y*0.018))*0.2;
        gl_FragColor = vec4(col*(0.978 + 0.045*v*amt), 1.0); }`, depthWrite: false }));
  m.position.z = -60; m.renderOrder = -100; parent.add(m); return m;
}
function makeScrim(parent, w, h, alpha, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({ uniforms: { a: { value: alpha } }, vertexShader: VS_UV,
    fragmentShader: 'uniform float a; varying vec2 vUv; void main(){ vec2 p = (vUv-0.5)*2.0; gl_FragColor = vec4(0.0,0.0,0.0, a*exp(-dot(p,p)*2.2)); }', transparent: true, depthWrite: false }));
  m.position.set(0, y, -20); parent.add(m); return m;
}
function scrapTex(w, h, bg, seed, lines = false) {
  const s = 2, cv = document.createElement('canvas'); cv.width = w * s; cv.height = h * s; const x = cv.getContext('2d'); x.scale(s, s);
  const r = rng(seed), N = 9, pts = [];
  for (let i = 0; i <= N; i++) pts.push([i / N * w, 3 + r() * 9]);
  for (let i = 0; i <= N; i++) pts.push([w - 3 - r() * 9, i / N * h]);
  for (let i = N; i >= 0; i--) pts.push([i / N * w, h - 3 - r() * 9]);
  for (let i = N; i >= 0; i--) pts.push([3 + r() * 9, i / N * h]);
  x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fillStyle = bg; x.fill();
  if (lines) { x.save(); x.clip(); x.strokeStyle = 'rgba(40,40,40,0.16)'; x.lineWidth = 1.4; for (let yy = 16; yy < h; yy += 15) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); } x.restore(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

class Stroke {
  constructor(parent, pts, width, color, k = 1, { additive = false } = {}) {
    this.segs = []; this.total = 0; this.g = new THREE.Group(); parent.add(this.g);
    this.mat = new THREE.MeshBasicMaterial({ color: C(color, k), transparent: true, toneMapped: false, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    const capG = new THREE.CircleGeometry(width / 2, 18);
    this.cap0 = new THREE.Mesh(capG, this.mat); this.cap0.position.set(pts[0][0], pts[0][1], 0); this.g.add(this.cap0);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const L = Math.hypot(x1 - x0, y1 - y0);
      const piv = new THREE.Group(); piv.position.set(x0, y0, 0); piv.rotation.z = Math.atan2(y1 - y0, x1 - x0);
      const m = new THREE.Mesh(planeGeo, this.mat); m.scale.set(0.001, width, 1); piv.add(m); this.g.add(piv);
      const cap = new THREE.Mesh(capG, this.mat); piv.add(cap);
      this.segs.push({ m, cap, L, off: this.total }); this.total += L;
    }
  }
  set(p, a = 1) {
    const d = p * this.total; this.mat.opacity = a; this.g.visible = a > 0.003 && p > 0.0005;
    for (const s of this.segs) { const l = clamp(d - s.off, 0, s.L); s.m.scale.x = Math.max(0.001, l); s.m.position.x = l / 2; s.cap.position.x = l; s.cap.visible = l > 0; s.m.visible = l > 0.01; }
  }
}
class Spark {
  constructor(parent, R, col = K.clay, k = 1, n = 12, seed = 3) {
    this.g = new THREE.Group(); parent.add(this.g); const r = rng(seed);
    const LEN = [1, 0.74, 0.92, 0.68, 0.97, 0.8, 0.94, 0.71, 0.9, 0.77, 0.99, 0.7];
    this.rays = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (r() - 0.5) * 0.18, len = R * LEN[i % LEN.length]; this.rays.push(new Stroke(this.g, [[0, 0], [Math.cos(a) * len, Math.sin(a) * len]], R * 0.2, col, k)); }
  }
  set(p, t = 0, { breathe = 0, a = 1 } = {}) {
    this.rays.forEach((st, i) => { const pi = clamp(p * 1.5 - i * 0.04); st.set(pi * (1 - breathe * 0.24 * (0.5 + 0.5 * Math.sin(t * 6.0 + i * 1.9))), a); });
    this.g.visible = a > 0.003 && p > 0;
  }
  color(c) { this.rays.forEach(st => st.mat.color.copy(c)); }
}
function makePoly(parent, n, col, k = 1, thick = 3, additive = false) {
  const pos = new Float32Array(n * 2 * 3), idx = [], P = new Float32Array(n * 2);
  for (let j = 0; j < n - 1; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: C(col, k), transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  m.frustumCulled = false; parent.add(m);
  return { m, set(fn, op = 1) {
    m.visible = op > 0.003; m.material.opacity = op; if (!m.visible) return;
    for (let j = 0; j < n; j++) { const [x, y] = fn(j / (n - 1), j); P[j * 2] = x; P[j * 2 + 1] = y; }
    for (let j = 0; j < n; j++) {
      const a = Math.max(0, j - 1), b = Math.min(n - 1, j + 1); let dx = P[b * 2] - P[a * 2], dy = P[b * 2 + 1] - P[a * 2 + 1]; const L = Math.hypot(dx, dy) || 1; const nx = -dy / L * thick, ny = dx / L * thick;
      pos[j * 6] = P[j * 2] + nx; pos[j * 6 + 1] = P[j * 2 + 1] + ny; pos[j * 6 + 3] = P[j * 2] - nx; pos[j * 6 + 4] = P[j * 2 + 1] - ny;
    }
    g.attributes.position.needsUpdate = true;
  } };
}
function oscVal(t, j) { const fi = clamp(Math.floor(t * FPS), 0, OSC.length / OSC_N - 1) * OSC_N; return OSC[fi + clamp(j, 0, OSC_N - 1)] / 127; }
class Slots {
  constructor(parent, n, { px = 20, color = K.cream, font = 'M' } = {}) {
    this.g = new THREE.Group(); parent.add(this.g); this.px = px; this.font = font;
    this.adv = glyph('0', font, px * 2).adv / 2; this.ms = []; this.cur = [];
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: C(color) })); m.position.x = (i + 0.5) * this.adv; m.visible = false; this.g.add(m); this.ms.push(m); }
  }
  set(str) {
    const s = [...str];
    this.ms.forEach((m, i) => { const ch = s[i] ?? ' '; if (this.cur[i] === ch) return; this.cur[i] = ch; if (ch === ' ') { m.visible = false; return; }
      const g = glyph(ch, this.font, this.px * 2); m.material.map = g.tex; m.material.needsUpdate = true; m.scale.set(g.cw / 2, g.chh / 2, 1); m.visible = true; });
  }
  opacity(a) { this.ms.forEach(m => m.material.opacity = a); this.g.visible = a > 0.003; }
  tint(c) { this.ms.forEach(m => m.material.color.copy(c)); }
}

// ---- per-line kinetic lyric
class Lyric {
  constructor(parent, i, o = {}) {
    this.o = o = Object.assign({ font: 'B', px: 100, color: K.cream, k: 1, x: 0, y: 0, ls: 0, layout: 'row', split: null, lineGap: 1.22, align: 'center',
      enter: 'slam', exit: 'cut', exitDur: 0.2, hi: [], hcol: K.clay, hk: 1 }, o);
    this.i = i; const L = WORDS[i]; this.g = new THREE.Group(); parent.add(this.g); this.g.position.set(o.x, o.y, o.z ?? 4);
    const txt = L.chars.map(c => c.c).join('');
    const his = new Set(); for (const h of [].concat(o.hi)) { const p = txt.indexOf(h); if (p >= 0) for (let q = p; q < p + h.length; q++) his.add(q); }
    this.chars = L.chars.map((c, j) => {
      const hi = his.has(j), px = o.pxFn ? o.pxFn(j) : o.px, font = o.fontFn ? o.fontFn(j) : o.font;
      const col = o.colorFn ? o.colorFn(j) : hi ? o.hcol : o.color;
      const word = /^[\x20-\x7e]+$/.test(c.c), lead = j > 0 && word ? ' ' : '';
      const tl = new TextLine(this.g, lead + c.c, { font, px, color: col, k: hi ? o.hk : o.k, res: px > 150 ? 1.2 : px > 90 ? 1.5 : 2 });
      const r = rng(i * 977 + j * 131 + 7);
      const q = { tl, m: tl.chars[0], c, j, hi, px, w: tl.width, r: [r(), r(), r(), r()], bx: 0, by: 0, brot: 0, extra: [] };
      if (o.scrap) {
        const pal = o.scrap[j % o.scrap.length], sw = px * 1.32 + r() * px * 0.25, sh = px * 1.36 + r() * px * 0.2;
        const tex = scrapTex(Math.round(sw), Math.round(sh), pal.bg, i * 31 + j * 7, !!pal.lines);
        const sd = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: tex, color: C('#000000'), transparent: true, depthWrite: false, toneMapped: false }));
        sd.scale.set(sw, sh, 1); sd.position.set(7, -8, -2); sd.userData.a = 0.18; tl.group.add(sd);
        const sc = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
        sc.scale.set(sw, sh, 1); sc.position.z = -1; sc.userData.a = 1; tl.group.add(sc); q.extra.push(sd, sc);
      }
      return q;
    });
    this.layout();
    this.start = L.chars[0].s;
    this.end = o.endAt ?? ((o.holdTo != null ? nextStart(o.holdTo) : nextStart(i)) - 0.03);
    if (o.endAt == null && CUR && CUR.b > this.end && CUR.b - this.end < 0.1) this.end = CUR.b + 0.02; // hold to the cut
  }
  layout() {
    const o = this.o, Q = this.chars;
    if (o.layout === 'pos') { Q.forEach(q => { const [x, y, r] = o.pos(q.j, q); q.bx = x; q.by = y; q.brot = r || 0; }); return; }
    const br = o.split ? [0, ...[].concat(o.split), Q.length] : [0, Q.length];
    const nr = br.length - 1;
    for (let ri = 0; ri < nr; ri++) {
      const seg = Q.slice(br[ri], br[ri + 1]); const w = seg.reduce((s, q) => s + q.w, 0) + o.ls * (seg.length - 1);
      let x = o.align === 'left' ? 0 : o.align === 'right' ? -w : -w / 2;
      const y = -(ri - (nr - 1) / 2) * o.px * o.lineGap;
      seg.forEach(q => { q.bx = x + q.w / 2; q.by = y; x += q.w + o.ls; });
    }
  }
  charRight(q) { return this.g.position.x + q.bx + q.w / 2; }
  update(t, A = 1) {
    const o = this.o, on = A > 0.003 && t >= this.start - 0.2 && t <= this.end + o.exitDur + 0.02;
    this.g.visible = on; if (!on) return;
    const u = t - this.end;
    for (const q of this.chars) {
      const k = t - q.c.s; let a = 0, sc = 1, dx = 0, dy = 0, rot = q.brot;
      switch (o.enter) {
        case 'slam': if (k >= 0) { a = clamp(k / 0.03); sc = 1.55 - 0.55 * slamIn(k, 0.16); dy = (1 - easeOut(k / 0.2)) * q.px * 0.18; rot += (q.r[0] - 0.5) * 0.3 * (1 - easeOut(k / 0.26)); } break;
        case 'rise': a = ease((k + 0.05) / 0.3); dy = -(1 - easeOut((k + 0.05) / 0.45)) * q.px * 0.35; break;
        case 'type': a = k >= 0 ? 1 : 0; break;
        case 'stream': a = ease((k + 0.02) / 0.1); break;
        case 'fade': a = ease((k + 0.05) / 0.25); break;
        case 'pop': if (k >= 0) { a = clamp(k / 0.04); sc = Math.max(0.001, slamIn(k, 0.24)); } break;
        case 'drop': if (k >= 0) { a = clamp(k / 0.04); dy = (1 - slamIn(k, 0.3)) * q.px * 1.1; } break;
        case 'ink': a = ease((k + 0.02) / 0.2); sc = 1.05 - 0.05 * easeOut(k / 0.4); break;
        case 'scrap': if (k >= 0) { a = clamp(k / 0.03); sc = 1.38 - 0.38 * slamIn(k, 0.2); rot = q.brot + (q.r[1] - 0.5) * 0.9 * (1 - easeOut(k / 0.25)); } break;
        default: a = 1;
      }
      if (u > 0) {
        const e = clamp(u / Math.max(0.001, o.exitDur));
        if (o.exit === 'cut') a = 0;
        else if (o.exit === 'fade') a *= 1 - ease(e);
        else if (o.exit === 'up') { a *= 1 - ease(e); dy += easeOut(e) * q.px * 0.9; }
        else if (o.exit === 'zoom') { a *= 1 - ease(e); sc *= 1 + ease(e) * 1.2; }
        else if (o.exit === 'shatter') { const s = easeOut(e); dx += (q.r[0] - 0.5) * s * 900; dy += (q.r[1] - 0.3) * s * 600; rot += (q.r[2] - 0.5) * s * 6; a *= 1 - ease(e); }
      }
      q.a = a; q.sc = sc; q.dx = dx; q.dy = dy; q.rot = rot; q.k = k;
      if (o.onChar) o.onChar(q, k, t, u);
      const aa = q.a * A;
      for (const m of q.tl.chars) m.material.opacity = aa; q.tl.group.position.set(q.bx + q.dx, q.by + q.dy, 0); q.tl.group.scale.setScalar(Math.max(0.001, q.sc)); q.tl.group.rotation.z = q.rot;
      for (const e of q.extra) e.material.opacity = aa * e.userData.a;
      q.tl.group.visible = aa > 0.003;
    }
  }
}

// ---- persistent editorial frame
class Chrome {
  constructor() {
    this.g = new THREE.Group(); this.mats = [];
    const add = tl => { tl.chars.forEach(m => this.mats.push(m.material)); return tl; };
    add(new TextLine(this.g, 'HELLO, WORLD  ·  你好，世界', { font: 'M', px: 17, color: K.cream, align: 'left' }).at(-898, 496));
    add(new TextLine(this.g, 'WORDS · IMAGE — CLAUDE   ·   MUSIC · VOICE — SUNO', { font: 'M', px: 17, color: K.cream, align: 'right' }).at(898, 496));
    this.tc = new Slots(this.g, 8, { px: 17 }); this.tc.g.position.set(-898, -500, 0); this.tc.ms.forEach(m => this.mats.push(m.material));
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const x = sx * 936, y = sy * 522;
      for (const st of [new Stroke(this.g, [[x, y], [x - sx * 22, y]], 2, K.cream), new Stroke(this.g, [[x, y], [x, y - sy * 22]], 2, K.cream)]) { st.set(1); this.mats.push(st.mat); }
    }
    this.labels = new Map();
  }
  label(s) {
    if (!this.labels.has(s)) { const tl = new TextLine(this.g, s, { font: 'S', px: 19, color: K.cream, align: 'right' }).at(898, -500); tl.chars.forEach(m => this.mats.push(m.material)); this.labels.set(s, tl); }
    return this.labels.get(s);
  }
  attach(sc, t) {
    sc.hud.add(this.g); this.g.visible = true;
    const c = C(sc.light ? K.ink : K.cream), a = sc.light ? 0.5 : 0.45;
    for (const m of this.mats) { m.color.copy(c); m.opacity = a; }
    const lab = this.label(sc.chromeLabel); for (const [s, tl] of this.labels) tl.group.visible = tl === lab;
    const mm = Math.floor(t / 60), ss = t - mm * 60;
    this.tc.set(`${String(mm).padStart(2, '0')}:${ss.toFixed(2).padStart(5, '0')}`); this.tc.g.visible = true;
  }
}
let chrome = null;
