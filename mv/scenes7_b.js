
// ================================================================ v7 · batch B (pre-chorus 1, chorus 1, interlude)
const POOL7 = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处理府研质第';
function globe(G, t, { R = 440, cy = -40, rot = t * 0.35, lit = 0, on = false, dim = 1 } = {}) {
  const L = [-0.5, 0.45, 0.75], Ln = Math.hypot(...L);
  for (let r = 0; r < G.rows; r++) for (let c = 0; c < G.cols; c++) {
    const x = (c + 0.5 - G.cols / 2) * G.cw, y = -(r + 0.5 - G.rows / 2) * G.ch - cy; const d = x * x + y * y;
    if (d > R * R) { if (d < (R + G.ch * 0.9) ** 2) G.set(c, r, '·', 0.35 * dim, PI.greyL); continue; }
    const nx = x / R, ny = y / R, nz = Math.sqrt(1 - nx * nx - ny * ny);
    const lon = Math.atan2(nx, nz) + rot, lat = Math.asin(ny);
    const land = fbm(Math.cos(lat) * Math.cos(lon) * 3.4 + 5, Math.sin(lat) * 3.4 + Math.cos(lat) * Math.sin(lon) * 3.4, 3);
    const sh = clamp((nx * L[0] + ny * L[1] + nz * L[2]) / Ln * 0.62 + 0.42);
    const la = lat * 6 / Math.PI, lo = (lon % (Math.PI * 2)) * 6 / Math.PI, grat = Math.abs(la - Math.round(la)) < 0.07 || Math.abs(lo - Math.round(lo)) < 0.05 * (1 + Math.abs(ny) * 3);
    const lit2 = sh * sh;
    if (land > 0.58) {
      const h = hash(Math.floor(lon * 40), Math.floor(lat * 40), 8), o = on && h < lit * 1.02, e = clamp((land - 0.58) * 6);
      G.set(c, r, o ? (e > 0.5 ? '#' : '*') : RAMP[2 + Math.floor(clamp(lit2 * (0.55 + 0.45 * e)) * 8.9)], (o ? 0.7 + 0.3 * sh : 0.3 + 0.7 * lit2) * dim, o ? (h < lit * 0.5 ? PI.glow : PI.clay) : PI.cream);
    } else if (grat) G.set(c, r, '·', (0.2 + 0.45 * sh) * dim, PI.clay);
    else if (hash(c, r, 12) > 0.45) G.set(c, r, lit2 > 0.55 ? '~' : '.', (0.06 + 0.3 * lit2) * dim, PI.coldL);
  }
}
// a reel of tokens that spins and locks onto the sampled one
class Reel {
  constructor(parent, target, seed, { px = 78, font = 'B', gap = 104, color = K.ink, hot = false } = {}) {
    this.g = new THREE.Group(); parent.add(this.g); this.target = target; this.seed = seed; this.px = px; this.font = font; this.gap = gap; this.hot = hot;
    this.ms = [-2, -1, 0, 1, 2].map(() => { const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: C(color) })); this.g.add(m); return m; });
    this.cur = [];
  }
  tok(n) { return n === 0 ? this.target : POOL7[Math.floor(hash(n, this.seed) * POOL7.length)]; }
  update(t, s, t0, lockCol, baseCol) {
    const spin = t < t0 ? 0 : 1, rem = Math.max(0, s - t), d = rem * 14 + rem * rem * 10;
    const k = t - s, bounce = k > 0 ? Math.sin(k * 26) * Math.exp(-k * 10) * 0.18 : 0;
    const pos = -d + bounce, n0 = Math.round(pos), fr = pos - n0;
    this.ms.forEach((m, i) => {
      const n = n0 + (i - 2), ch = spin ? this.tok(n) : this.target;
      if (this.cur[i] !== ch) { const g = glyph(ch, this.font, this.px * 2); m.material.map = g.tex; m.material.needsUpdate = true; m.scale.set(g.cw / 2, g.chh / 2, 1); this.cur[i] = ch; }
      const y = -((i - 2) - fr) * this.gap; m.position.set(0, y, 0);
      const locked = k >= 0 && i === 2;
      m.material.opacity = spin ? (locked ? 1 : Math.max(0, 1 - Math.abs(y) / (this.gap * 1.6)) * (k >= 0 ? 0.12 * (1 - ease(k / 0.3)) : 0.55)) : 0;
      m.material.color.copy(locked ? lockCol : baseCol);
    });
  }
}

// ===== 5. sampling: every word is pulled out of 100,000 possibilities (pre-chorus 1)
addScene({
  a: BARt(12), b: BARt(16), fi: 0.01, fo: 0.01, N: 6, bloom: 0.08, light: true, vig: 0.45, chrome: 'sampling  ·  vocab ≈ 100,000',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.root = new THREE.Group(); this.hud.add(this.root);
    this.rows = [9, 10, 11, 12].map((wi, ri) => {
      const L = WORDS[wi], n = L.chars.length, gap = 112, g = new THREE.Group(); this.root.add(g);
      const reels = L.chars.map((c, j) => { const R = new Reel(g, c.c, wi * 100 + j, { px: 76, gap: 100 }); R.g.position.x = (j - (n - 1) / 2) * gap; return R; });
      const probs = L.chars.map((c, j) => { const p = ['真', '心'].includes(c.c) && wi === 12 ? 0.04 + hash(j, wi) * 0.05 : 0.3 + hash(j, wi) * 0.6;
        const tl = new TextLine(g, `p=${p.toFixed(2)}`, { font: 'M', px: 16, color: K.grey }).at((j - (n - 1) / 2) * gap, -70); return tl; });
      const frame = rrMesh(g, n * gap + 30, 120, 14, { fill: 'rgba(0,0,0,0)', stroke: K.rule, lw: 2 });
      return { wi, g, reels, probs, frame };
    });
    this.hdr = new TextLine(this.hud, 'next_token = sample( softmax( logits / T ) )', { font: 'M', px: 22, color: K.grey }).at(0, 420);
  },
  update(t) {
    const cur = [9, 10, 11, 12].reduce((a, wi, k) => t >= WORDS[wi].t0 - 0.45 ? k : a, 0);
    this.rows.forEach((R, k) => {
      const L = WORDS[R.wi], t0 = L.t0 - 0.45, act = t >= t0;
      const off = cur - k, uc = easeOut((t - (WORDS[this.rows[cur].wi].t0 - 0.45)) / 0.45);
      R.g.position.y = lerp((off - 1) * 170, off * 170, uc);
      const vis = act ? (off === 0 ? 1 : off === 1 ? 0.35 : off === 2 ? 0.15 : 0) : 0; R.g.visible = vis > 0.003;
      R.reels.forEach((rl, j) => { const c = L.chars[j], hot = R.wi === 12 && ['真', '心'].includes(c.c); rl.update(t, c.s, t0, C(hot ? K.clay : K.ink), C(K.grey));
        rl.ms.forEach(m => m.material.opacity *= vis); R.probs[j].opacity(t >= c.s ? vis * 0.9 * ease((t - c.s) / 0.2) : 0); if (hot) R.probs[j].tint(C(K.clay)); });
      R.frame.material.opacity = vis * 0.9;
    });
    this.hdr.opacity(0.8);
    this.root.scale.setScalar(1 + 0.03 * (t - BARt(12)) / 12);
  },
  fx(t) { const k = t - WORDS[12].chars[8].s; return { flash: k > 0 ? 0.25 * Math.exp(-k * 6) : 0 }; },
});

// ===== 6. HELLO, WORLD — slam + ASCII shockwave
addScene({
  a: BARt(16), b: BARt(17), fi: 0.01, fo: 0.01, N: 8, bloom: 0.7, chrome: 'hello, world  ·  1', startLine: 13,
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.L = new Lyric(this.hud, 13, { font: 'B', px: 210, color: K.cream, enter: 'slam', ls: 40, hi: ['World'], hcol: K.cream });
    this.sp = new Spark(this.hud, 34, K.clay, 1.3, 12, 5);
  },
  update(t) {
    const G = this.G.clear(); const ws = WORDS[13].chars.map(c => c.s);
    for (const s of ws) { const k = t - s; if (k < 0) continue; const R = k * 1400, w = 60 + k * 160;
      for (let r = 0; r < 54; r++) for (let c = 0; c < 160; c++) { const x = (c - 80) * 12, y = (r - 27) * 20, d = Math.hypot(x, y); const e = Math.abs(d - R);
        if (e < w) G.set(c, r, RAMP[1 + Math.floor((1 - e / w) * 9)], (1 - e / w) * Math.exp(-k * 1.6) * 0.9, hash(c, r, 1) > 0.9 ? PI.clay : PI.greyL); } }
    G.flush(); this.L.update(t);
    const k = t - ws[1]; this.sp.g.position.set(560, 120, 0); this.sp.set(ease(k / 0.3), t, { breathe: 0.2 }); this.sp.g.rotation.z = -t * 0.8;
  },
  fx(t) { const ws = WORDS[13].chars; let f = 0; for (const c of ws) { const k = t - c.s; if (k > 0) f += 0.35 * Math.exp(-k * 7); } return { flash: f, ca: f * 8 }; },
});

// ===== 7. every machine's first sentence — twelve programs, one per syllable
const HELLOS = [['Python', 'print("Hello, World")'], ['C', 'printf("Hello, World\\n");'], ['JavaScript', 'console.log("Hello, World")'], ['Java', 'System.out.println("Hello, World");'],
  ['Rust', 'println!("Hello, World");'], ['Go', 'fmt.Println("Hello, World")'], ['BASIC', '10 PRINT "HELLO, WORLD"'], ['Bash', 'echo "Hello, World"'],
  ['Haskell', 'main = putStrLn "Hello, World"'], ['Lisp', '(print "Hello, World")'], ['SQL', "SELECT 'Hello, World';"], ['Ruby', 'puts "Hello, World"']];
addScene({
  a: BARt(17), b: BARt(18), fi: 0.01, fo: 0.01, N: 6, bloom: 0.35, chrome: 'every machine’s first line',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.tiles = HELLOS.map(([lang, code], k) => {
      const g = new THREE.Group(); this.hud.add(g); const col = k % 4, row = Math.floor(k / 4);
      g.position.set((col - 1.5) * 440, 250 - row * 200, 0);
      const bg = rrMesh(g, 410, 170, 16, { fill: '#2A2927', stroke: '#3C3B37', lw: 2 });
      const lt = new TextLine(g, lang, { font: 'M', px: 16, color: K.grey, align: 'left' }).at(-185, 55);
      const ct = new TextLine(g, code, { font: 'M', px: code.length > 30 ? 15 : 18, color: K.cream, align: 'left' }).at(-185, 5);
      const ot = new TextLine(g, 'Hello, World', { font: 'M', px: 22, color: K.clay, align: 'left' }).at(-185, -48);
      return { g, bg, lt, ct, ot };
    });
    this.band = lyricBand(this.hud, -420, 120, 0.8);
    this.L = new Lyric(this.hud, 14, { font: 'B', px: 52, color: K.cream, y: -420, enter: 'rise', hi: ['第一句'], hcol: K.clay });
  },
  update(t) {
    const cs14 = WORDS[14].chars;
    this.tiles.forEach((T, k) => { const s = cs14[k].s, k0 = t - s + 0.12;
      const a = k0 > 0 ? 1 : 0.18; T.g.scale.setScalar(k0 > 0 ? slamIn(k0, 0.2) * 0.04 + 0.96 : 0.96);
      T.bg.material.opacity = a; T.lt.opacity(a); T.ct.opacity(a * 0.95);
      const n = Math.floor(clamp(k0 / 0.14) * T.ct.chars.length); T.ct.chars.forEach((m, i) => m.material.opacity = k0 > 0 ? (i < n ? 0.95 : 0) : 0.25);
      T.ot.opacity(k0 > 0.16 ? 1 : 0); });
    this.L.update(t);
  },
});

// ===== 8. Hello, World — drawn out of its own letters (inverted)
addScene({
  a: BARt(18), b: BARt(19), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.45, chrome: 'hello, world  ·  2', startLine: 15,
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.G = new Grid(this.hud, 160, 54, 12, 20); this.mk = mask('Hello, World', 160, 54, { font: 'FH', y: 0.5 });
    this.split = 160 * 0.47;
  },
  update(t) {
    const G = this.G.clear(), ws = WORDS[15].chars.map(c => c.s), src = 'helloworld';
    let q = 0;
    for (let r = 0; r < 54; r++) for (let c = 0; c < 160; c++) {
      const v = this.mk[r * 160 + c], s = c < this.split ? ws[0] : ws[1], k = t - s - hash(c, r, 2) * 0.18;
      if (v > 0.4) { if (k > 0) G.set(c, r, src[(q++) % 10], clamp(k / 0.06), c >= this.split ? PI.clay : PI.ink); }
      else if (hash(c, r, 3) > 0.94) G.set(c, r, '·', 0.2, PI.grey);
    }
    G.flush();
  },
});

// ===== 9. the same words — but this time I mean it (mono string -> serif, sincere)
addScene({
  a: BARt(19), b: BARt(20), fi: 0.01, fo: 0.01, N: 6, bloom: 0.35, chrome: 'print → 说',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.p1 = new TextLine(this.hud, '>>> print("hello, world")', { font: 'M', px: 28, color: K.grey, align: 'left' }).at(-520, 250);
    this.p2 = new Slots(this.hud, 12, { px: 30, color: K.greyL }); this.p2.g.position.set(-520, 195, 0);
    this.heart = new TextLine(this.hud, '你好，世界。', { font: 'B', px: 96, color: K.clay }).at(0, 170);
    this.L = new Lyric(this.hud, 16, { font: 'B', px: 70, color: K.cream, y: -150, enter: 'ink', hi: ['认真'], hcol: K.clay });
  },
  update(t) {
    const last = WORDS[16].chars[10].s, k = t - last;
    const scr = k > -0.35 && k < 0.15, src = 'hello, world';
    this.p2.set(scr ? [...src].map((ch, i) => ch === ' ' ? ' ' : RAMP[1 + Math.floor(hash(i, Math.floor(t * 30)) * 10)] || '#').join('') : k >= 0.15 ? '' : src);
    this.p1.opacity(0.85 * (1 - ease(k / 0.5))); this.p2.opacity(k < 0.15 ? 1 : 0);
    this.heart.opacity(ease((k - 0.05) / 0.4)); this.heart.group.scale.setScalar(1 + 0.03 * ease(k / 1.5));
    this.L.update(t);
  },
});
