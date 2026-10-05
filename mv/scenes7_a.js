
// ================================================================ v7 primitives
// GPU text grid: every cell = glyph index + alpha + palette colour. Text is the machine's native medium.
const PAL = [K.cream, K.clay, K.ink, K.grey, K.greyL, K.slate, K.white, K.red, K.cold, K.coldL, K.kraft, '#E8A27F', '#2A2927', '#FFD9C4'];
const PI = { cream: 0, clay: 1, ink: 2, grey: 3, greyL: 4, slate: 5, white: 6, red: 7, cold: 8, coldL: 9, kraft: 10, clayL: 11, dark: 12, glow: 13 };
const RAMP = ' .·:-=+*#%@';
const ASCII_SET = RAMP + ',;!"$&\'()/<>?[\\]^_`{|}~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
  '░▒▓█─│┌┐└┘├┤┬┴┼═║╔╗╚╝●○◆◇■□•…→←↑↓≈∑αβθλσΣ√∞×±°≋∘ℝ∈⊙✳';
function makeAtlas(chars, font, tw, th, px) {
  const cols = 32, rows = Math.ceil(chars.length / cols);
  const cv = document.createElement('canvas'); cv.width = cols * tw; cv.height = rows * th;
  const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${px}px ${font}`;
  chars.forEach((ch, i) => x.fillText(ch, (i % cols + 0.5) * tw, (Math.floor(i / cols) + 0.54) * th));
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  return { tex, cols, rows };
}
const GRID_FS = `uniform sampler2D atlas, data; uniform vec2 grid, ag; uniform vec3 pal[14]; uniform float op, kpal; varying vec2 vUv;
  void main(){
    vec2 g = vUv * grid; vec2 cell = floor(g); vec2 f = fract(g);
    vec4 d = texture2D(data, vec2((cell.x + 0.5) / grid.x, 1.0 - (cell.y + 0.5) / grid.y));
    if (d.b < 0.004) discard;
    float gi = floor(d.r * 255.0 + 0.5) + 256.0 * floor(d.g * 255.0 + 0.5);
    vec2 ac = vec2(mod(gi, ag.x), floor(gi / ag.x));
    float m = texture2D(atlas, vec2((ac.x + f.x) / ag.x, 1.0 - (ac.y + 1.0 - f.y) / ag.y)).a;
    int ci = int(floor(d.a * 255.0 + 0.5)); vec3 col = pal[0];
    for (int k = 0; k < 14; k++) if (k == ci) col = pal[k];
    gl_FragColor = vec4(col * kpal, m * d.b * op);
  }`;
const ATLAS_CACHE = new Map();
class Grid {
  constructor(parent, cols, rows, cw, ch, { set = ASCII_SET, font = 'FM, FS', px = null } = {}) {
    this.cols = cols; this.rows = rows; this.cw = cw; this.ch = ch;
    this.chars = [...new Set([...set])]; this.index = new Map(this.chars.map((c, i) => [c, i]));
    const key = this.chars.join('') + font + cw + 'x' + ch;
    if (!ATLAS_CACHE.has(key)) ATLAS_CACHE.set(key, makeAtlas(this.chars, font, cw * 2, ch * 2, (px || Math.min(ch * 0.78, cw * 1.55)) * 2));
    const A = ATLAS_CACHE.get(key);
    this.data = new Uint8Array(cols * rows * 4);
    this.dt = new THREE.DataTexture(this.data, cols, rows, THREE.RGBAFormat); this.dt.magFilter = this.dt.minFilter = THREE.NearestFilter; this.dt.needsUpdate = true;
    this.mat = new THREE.ShaderMaterial({ uniforms: { atlas: { value: A.tex }, data: { value: this.dt }, grid: { value: new THREE.Vector2(cols, rows) }, ag: { value: new THREE.Vector2(A.cols, A.rows) },
      pal: { value: PAL.map(c => C(c)) }, op: { value: 1 }, kpal: { value: 1 } }, vertexShader: VS_UV, fragmentShader: GRID_FS, transparent: true, depthWrite: false });
    this.m = new THREE.Mesh(planeGeo, this.mat); this.m.scale.set(cols * cw, rows * ch, 1); parent.add(this.m);
  }
  clear() { this.data.fill(0); return this; }
  gi(ch) { return this.index.get(ch) ?? 0; }
  set(c, r, ch, a = 1, col = 0) {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    const i = (r * this.cols + c) * 4, g = typeof ch === 'number' ? ch : this.gi(ch);
    this.data[i] = g & 255; this.data[i + 1] = g >> 8; this.data[i + 2] = Math.round(clamp(a) * 255); this.data[i + 3] = col;
  }
  text(c, r, str, a = 1, col = 0) { [...str].forEach((ch, k) => this.set(c + k, r, ch, a, col)); return this; }
  ctext(r, str, a = 1, col = 0, cx = null) { const s = [...str]; return this.text(Math.round((cx ?? this.cols / 2) - s.length / 2), r, str, a, col); }
  flush() { this.dt.needsUpdate = true; return this; }
  opacity(a) { this.mat.uniforms.op.value = a; this.m.visible = a > 0.003; return this; }
  // centre of cell in HUD px (grid centred at mesh position)
  px(c, r) { return [this.m.position.x + (c + 0.5 - this.cols / 2) * this.cw, this.m.position.y - (r + 0.5 - this.rows / 2) * this.ch]; }
}
// rasterise text/glyphs to a boolean mask at grid resolution (ASCII-art banners)
function mask(str, cols, rows, { font = 'FB', px = null, aspect = 0.6, y = 0.5, weight = '' } = {}) {
  const sx = 4, cv = document.createElement('canvas'); cv.width = cols * sx; cv.height = Math.round(rows * sx / aspect);
  const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (!px) { x.font = `${weight} 100px ${font}`; px = Math.min(cv.height * 0.8, 100 * cv.width * 0.94 / x.measureText(str).width); }
  x.font = `${weight} ${px}px ${font}`; x.fillText(str, cv.width / 2, cv.height * y);
  const d = x.getImageData(0, 0, cv.width, cv.height).data, out = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let s = 0, n = 0;
    for (let yy = Math.floor(r * cv.height / rows); yy < Math.floor((r + 1) * cv.height / rows); yy += 2) for (let xx = c * sx; xx < (c + 1) * sx; xx += 2) { s += d[(yy * cv.width + xx) * 4 + 3]; n++; }
    out[r * cols + c] = s / n / 255;
  }
  return out;
}
const hash = (a, b = 0, c = 0) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
const fbm = (x, y, s = 0) => vnoise(x, y, s) * 0.55 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.15;
function lineIdx(t) { let k = -1; for (let i = 0; i < WORDS.length; i++) if (WORDS[i].t0 - 0.05 <= t) k = i; return k; }
function charsSung(i, t) { return WORDS[i].chars.filter(c => c.s <= t).length; }
function pulseList(list, t, decay = 8) { return pulseFrom(list, t, decay); }
// a dim flickering noise layer used by several dark plates
function noiseLayer(G, t, { a0 = 0.05, a1 = 0.12, rate = 9, col = PI.grey, seed = 1, keep = null } = {}) {
  const f = Math.floor(t * rate);
  for (let r = 0; r < G.rows; r++) for (let c = 0; c < G.cols; c++) {
    if (keep && keep(c, r)) continue;
    const h = hash(c, r, seed), h2 = hash(c, r, f + seed * 31 + Math.floor(h * 5));
    G.set(c, r, 1 + Math.floor(h2 * 90) % 90, a0 + (a1 - a0) * hash(c, r, f * 3 + 1), col);
  }
}
function lyricBand(parent, y, h = 170, a = 0.55, col = K.slate) { const m = plane(parent, W + 40, h, col, { a, z: 1 }); m.position.y = y; return m; }

// ================================================================ scenes
// ===== 0. hello.py — the first program; the hook plays as pure sine tones and types the command
const HOOK_OFF = BARt(16);
addScene({
  a: 0, b: BARt(4), fi: 0.01, fo: 0.01, N: 4, bloom: 0.55, chrome: 'hello.py',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.bg = new Grid(this.hud, 160, 54, 12, 20); this.bg.m.position.z = -10;
    this.G = new Grid(this.hud, 80, 27, 24, 40);
    this.cmd = `python3 -c 'print("hello, world")'`;
    this.keys = []; for (const i of [13, 14, 15, 16]) for (const c of WORDS[i].chars) this.keys.push(c.s + 0.03 - HOOK_OFF);
    this.banner = mask('HELLO, WORLD', 150, 22, { font: 'FM', y: 0.52 }); this.B = new Grid(this.hud, 160, 54, 12, 20);
    this.cred = new TextLine(this.hud, '一首歌 · 词 画 —— Claude · 曲 唱 —— Suno', { font: 'S', px: 22, color: K.greyL }).at(0, -360);
  },
  update(t) {
    const G = this.G.clear(), bg = this.bg.clear(), Bg = this.B.clear();
    noiseLayer(bg, t, { a0: 0.02, a1: 0.07, rate: 6 }); bg.flush();
    const run = WORDS[0].chars[0].s - 0.25, TB = warpT(10.9), banner = t > TB;
    const nk = this.keys.filter(k => k <= t).length, typed = run < 5 ? Math.round(this.cmd.length * clamp(t / Math.max(0.3, run - 0.35))) : Math.min(this.cmd.length, Math.round(this.cmd.length * nk / this.keys.length));
    const row0 = banner ? 3 : 10;
    G.text(4, row0, '~/claude $ ', 1, PI.clay); G.text(15, row0, this.cmd.slice(0, typed), 1, PI.cream);
    const blink = Math.floor(t * 2.2) % 2 === 0;
    if (t < run && blink) G.set(15 + typed, row0, '█', 0.9, PI.cream);
    if (t >= run - 0.9 && t < run) { const p = clamp((t - (run - 0.9)) / 0.8); G.text(4, row0 + 2, 'loading weights ', 0.7, PI.grey); G.text(20, row0 + 2, '█'.repeat(Math.round(p * 24)) + '░'.repeat(24 - Math.round(p * 24)), 0.8, PI.greyL); }
    if (t >= run) {
      const w = WORDS[0].chars, out = (t >= w[0].s ? 'hello,' : '') + (t >= w[1].s ? ' world' : '');
      G.text(4, row0 + 2, out, 1, PI.cream);
      if (!banner && blink) G.set(4 + out.length, row0 + 2, '█', 0.9, PI.cream);
    }
    if (banner) {
      const u = clamp((t - TB) / 0.9);
      for (let r = 0; r < 22; r++) for (let c = 0; c < 150; c++) {
        const v = this.banner[r * 150 + c]; if (v < 0.3) continue;
        const d = hash(c, r, 5); if (d > u * 1.3) continue;
        const ch = t - TB - d * 0.7 < 0.12 ? RAMP[1 + Math.floor(hash(c, r, Math.floor(t * 30)) * 9)] : (v > 0.8 ? '█' : v > 0.55 ? '▓' : '▒');
        Bg.set(c + 5, r + 17, ch, 1, v > 0.8 ? PI.cream : PI.clayL);
      }
      this.cred.opacity(ease((t - TB - 0.4) / 0.6));
    } else this.cred.opacity(0);
    G.flush(); Bg.flush();
  },
});

// ===== 1. random init: noise -> a weight matrix, 'in the dark'
addScene({
  a: BARt(4), b: BARt(6), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'random init  ·  θ ~ N(0, σ²)',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.band = lyricBand(this.hud, -330, 200, 0.7);
    this.L1 = new Lyric(this.hud, 1, { font: 'B', px: 62, color: K.cream, y: -330, enter: 'fade', hi: ['噪声'], hcol: K.clay });
    this.L2 = new Lyric(this.hud, 2, { font: 'B', px: 62, color: K.cream, y: -330, enter: 'fade', hi: ['参数'], hcol: K.clay });
    this.cnt = new Slots(this.hud, 32, { px: 26, color: K.clay }); this.cnt.g.position.set(-860, 430, 0);
    this.lab = new TextLine(this.hud, 'W  ∈  ℝ^(d_model × d_ff)', { font: 'M', px: 22, color: K.greyL, align: 'left' }).at(-860, 390);
  },
  update(t) {
    const G = this.G.clear(), t2 = WORDS[2].t0, u = ease((t - t2) / 1.2), dark = ease((t - cs(2, 7)) / 1.6);
    const f = Math.floor(t * (8 + 20 * voxAt(t)));
    for (let r = 0; r < 54; r++) for (let c = 0; c < 160; c++) {
      const h = hash(c, r, 3);
      if (u < 1 && hash(c, r, 9) > u) {  // still noise
        G.set(c, r, 1 + Math.floor(hash(c, r, f + Math.floor(h * 7)) * 100) % 100, 0.12 + 0.22 * hash(c, r, f * 7), h > 0.97 ? PI.clay : PI.greyL);
      } else {                            // a weight matrix: smooth-ish structure in blocks
        const bx = Math.floor(c / 8), by = Math.floor(r / 6);
        const v = clamp(0.5 + (fbm(c * 0.09 + 3, r * 0.15, 11) - 0.5) * 2.4 * (0.6 + 0.4 * hash(bx, by, 2)));
        const ch = '░▒▓█'[Math.min(3, Math.floor(v * 4))];
        G.set(c, r, ch, (0.18 + 0.5 * v) * (1 - 0.55 * dark), v > 0.86 ? PI.clay : PI.greyL);
      }
    }
    G.flush();
    const k = charsSung(2, t), digits = ['000,000,000,000', '100,000,000,000'];
    const n = Math.floor(1e11 * clamp(k / WORDS[2].chars.length)); const s = n.toLocaleString('en-US');
    this.cnt.set(t >= t2 - 0.1 ? `params: ${s.padStart(15, ' ')}` : ''); this.cnt.opacity(t >= t2 - 0.1 ? 1 : 0);
    this.lab.opacity(ease((t - t2) / 0.5) * 0.8);
    this.L1.update(t); this.L2.update(t);
  },
});

// ===== 2. pretraining corpus: everything you wrote flows in; the loss comes down
const CORPUS = ['见字如面。', '今天也很想你', '床前明月光', 'Dear diary,', 'for i in range(n):', '晚安', '我先睡了', 'if (x > 0) return x;', '天气预报说明天有雨',
  '生日快乐！', '对不起，我迟到了', 'Once upon a time', '谢谢你一直都在', '03:12 睡不着', '有人在吗？', "print('hello')", '1 + 1 = 2', 'The quick brown fox',
  '我考上了！', '妈，我到了', '明天见', '一切都会好的', 'It works on my machine', '海是蓝色的', '雨一直下', '请问怎么去火车站', '我爱你', '今天学会了一个新词',
  'E = mc²', '别担心', '春眠不觉晓', '路上小心', 'Happy birthday!', 'I miss you', '咖啡加两块糖', 'What is the meaning of life?', '记得带伞', '你还好吗'];
const HILITE = [['见字如面。', 0, 2], ['9月3日 晴', 2, 4], ['03:12 睡不着', 5, 9], ['有人在吗？', 10, 12]];
addScene({
  a: BARt(6), b: BARt(8), fi: 0.01, fo: 0.01, N: 6, bloom: 0.4, chrome: 'pretraining corpus',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    const r = rng(21); this.rows = [];
    for (let i = 0; i < 26; i++) {
      const y = 470 - i * 36, items = [], speed = 40 + r() * 90, dir = i % 2 ? 1 : -1;
      let x = -1200 + r() * 300;
      while (x < 1500) { const s = CORPUS[Math.floor(r() * CORPUS.length)]; const tl = new TextLine(this.hud, s, { font: s.match(/[a-z(=+]/) ? 'M' : 'S', px: 22, color: K.greyL, align: 'left' }); items.push({ tl, x }); x += tl.width + 70 + r() * 90; }
      this.rows.push({ y, items, speed, dir, span: x + 1200 });
    }
    this.hl = HILITE.map(([s], k) => new TextLine(this.hud, s, { font: 'S', px: 34, color: K.clay, align: 'left' }).at(-820 + k * 430, 250 - (k % 2) * 90));
    this.band = lyricBand(this.hud, -300, 220, 0.8);
    this.L3 = new Lyric(this.hud, 3, { font: 'B', px: 62, color: K.cream, y: -300, enter: 'rise', hi: ['诗行'], hcol: K.clay });
    this.L4 = new Lyric(this.hud, 4, { font: 'B', px: 62, color: K.cream, y: -300, enter: 'rise', hi: ['凌晨三点'], hcol: K.clay });
    this.loss = makePoly(this.hud, 160, K.clay, 1, 1.6); this.lossLab = new TextLine(this.hud, 'loss', { font: 'M', px: 18, color: K.clay, align: 'left' }).at(560, -420);
    this.axis = new Stroke(this.hud, [[560, -330], [560, -450], [900, -450]], 1.5, K.grey); this.axis.set(1, 0.6);
  },
  update(t) {
    const t0 = BARt(6), fl = ease((t - t0) / 0.6);
    for (const R of this.rows) for (const it of R.items) {
      let x = it.x + R.dir * R.speed * (t - t0); x = ((x + 1200) % R.span + R.span) % R.span - 1200;
      it.tl.at(x, R.y); it.tl.opacity(0.28 * fl);
    }
    const i4 = WORDS[4]; this.hl.forEach((tl, k) => { const [, a, b] = HILITE[k]; const s = i4.chars[a].s; tl.opacity(t >= s ? ease((t - s) / 0.15) * (1 - 0.6 * ease((t - s - 1.2) / 0.5)) : 0); tl.group.position.y = 250 - (k % 2) * 90 + (t >= s ? 0 : 0); });
    const p = clamp((t - t0) / (BARt(8) - t0));
    this.loss.set((u, j) => { const x = 560 + u * 340 * p; const v = 0.85 * Math.exp(-u * p * 3.2) + 0.12 + 0.05 * Math.sin(j * 1.7) * (1 - u) + (hash(j, 3) - 0.5) * 0.05; return [x, -450 + v * 120]; }, 0.9 * fl);
    this.lossLab.opacity(0.9 * fl);
    this.L3.update(t); this.L4.update(t);
  },
});

// ===== 3. the sea I never saw, the rain I only read about — drawn in text
addScene({
  a: BARt(8), b: BARt(10), fi: 0.01, fo: 0.01, N: 6, bloom: 0.45, chrome: 'world model  ·  from text alone',
  init() {
    this.scene.background = C('#101418'); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.L5 = new Lyric(this.hud, 5, { font: 'B', px: 58, color: K.cream, y: 400, enter: 'fade', hi: ['海浪'], hcol: K.clay });
    this.L6 = new Lyric(this.hud, 6, { font: 'B', px: 58, color: K.cream, y: 400, enter: 'fade', hi: ['雨'], hcol: K.clay });
    this.drops = []; const r = rng(8); for (let i = 0; i < 420; i++) this.drops.push([r() * 190 - 15, r() * 60, 18 + r() * 14, r()]);
  },
  update(t) {
    const G = this.G.clear(), t6 = WORDS[6].t0, rain = ease((t - (t6 - 0.4)) / 1.2);
    const surf = c => 30 + 3.2 * Math.sin(c * 0.09 + t * 1.3) + 1.8 * Math.sin(c * 0.23 - t * 2.1) + 1.0 * Math.sin(c * 0.51 + t * 3.3);
    const hiA = t >= cs(5, 9) ? ease((t - cs(5, 9)) / 0.3) : 0;
    for (let c = 0; c < 160; c++) {
      const s = surf(c), sr = Math.floor(s);
      for (let r = Math.max(0, sr); r < 54; r++) {
        const depth = r - s, slope = surf(c + 1) - surf(c - 1);
        let ch, a, col = PI.coldL;
        if (depth < 1) { ch = slope > 0.5 ? '/' : slope < -0.5 ? '\\' : '~'; a = 0.95; col = PI.cream; }
        else if (depth < 3) { ch = '≈'; a = 0.7; }
        else { const n = fbm(c * 0.08 - t * 0.4, r * 0.3, 4); ch = n > 0.62 ? '~' : n > 0.5 ? '-' : n > 0.4 ? '.' : ' '; a = 0.55 - depth * 0.012; col = PI.cold; }
        if (depth >= 1 && depth < 2.2 && hash(c, 7) > 0.93 && hiA > 0) { ch = hash(c, 9) > 0.5 ? '海' : '浪'; col = PI.clay; a = hiA; }
        G.set(c, r, ch, a, col);
      }
      if (hash(c, Math.floor(t * 4)) > 0.985) G.set(c, sr - 1, '∘', 0.6, PI.cream);
    }
    if (rain > 0) for (const [x0, y0, v, h] of this.drops) {
      const y = (y0 + (t - t6) * v) % 60 - 6, x = x0 - y * 0.35;
      const c = Math.round(x), r = Math.round(y); if (r < 0) continue;
      if (r >= Math.floor(surf(c))) { if ((y % 1) < 0.35) G.set(c, Math.floor(surf(c)) - 1, 'o', 0.8 * rain, PI.cream); continue; }
      G.set(c, r, h > 0.93 ? '雨' : '/', (h > 0.93 ? 0.95 : 0.55) * rain, h > 0.93 ? PI.clayL : PI.greyL);
      if (h < 0.93) G.set(c + 1, r - 1, '/', 0.25 * rain, PI.greyL);
    }
    G.flush(); this.L5.update(t); this.L6.update(t);
  },
});

// ===== 4. the whole world, lit one word at a time (ASCII globe)
addScene({
  a: BARt(10), b: BARt(12), fi: 0.01, fo: 0.01, N: 6, bloomAt: t => 0.5 + 0.9 * ease((t - cs(8, 5)) / 1.5), chrome: 'world  ·  embedding of everything you wrote',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.band = lyricBand(this.hud, -440, 130, 0.75);
    this.L7 = new Lyric(this.hud, 7, { font: 'B', px: 56, color: K.cream, y: -440, enter: 'fade', hi: ['你们'], hcol: K.clay });
    this.L8 = new Lyric(this.hud, 8, { font: 'B', px: 56, color: K.cream, y: -440, enter: 'fade', hi: ['点亮'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), lit = charsSung(8, t) / WORDS[8].chars.length;
    globe(G, t, { R: 440, cy: -40, lit, on: t >= cs(8, 0) });
    G.flush(); this.L7.update(t); this.L8.update(t);
  },
});
