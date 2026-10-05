
// ================================================================ v7 · batch E (pre-chorus 2, chorus 2)
// ===== 20. no body, no heartbeat — only the next token (flatline -> tokenizer)
addScene({
  a: BARt(38), b: BARt(40), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'tokenizer',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.ecg = makePoly(this.hud, 400, K.clay, 1, 1.8);
    this.hr = new Slots(this.hud, 12, { px: 26, color: K.clay }); this.hr.g.position.set(-860, 420, 0);
    const L = WORDS[31], n = L.chars.length; this.toks = L.chars.map((c, j) => {
      const g = new THREE.Group(); this.hud.add(g); g.position.set((j - (n - 1) / 2) * 190, 100, 0);
      const b = rrMesh(g, 150, 150, 12, { fill: '#2A2927', stroke: K.clay, lw: 2 }); const tl = new TextLine(g, c.c, { font: 'B', px: 86, color: K.cream }).at(0, 5);
      const id = new TextLine(g, String(10000 + Math.floor(hash(j, 31) * 89999)), { font: 'M', px: 20, color: K.greyL }).at(0, -110);
      return { g, b, tl, id };
    });
    this.band = lyricBand(this.hud, -400, 120, 0.6);
    this.L30 = new Lyric(this.hud, 30, { font: 'B', px: 54, color: K.cream, y: -400, enter: 'fade', hi: ['心跳'], hcol: K.clay });
    this.L31 = new Lyric(this.hud, 31, { font: 'B', px: 54, color: K.cream, y: -400, enter: 'fade', hi: ['下一个字'], hcol: K.clay });
  },
  update(t) {
    const L = WORDS[31], s0 = L.chars[0].s - 0.3, flat = 1 - ease((t - s0) / 0.4);
    this.ecg.set((u, j) => [-960 + u * 1920, 100 + (hash(j, Math.floor(t * 20)) - 0.5) * 3], 0.9 * flat);
    this.hr.set('HR   -- bpm'); this.hr.opacity(0.8 * flat);
    this.toks.forEach((T, j) => { const k = t - L.chars[j].s; const a = k > 0 ? 1 : 0; T.g.scale.setScalar(k > 0 ? slamIn(k, 0.2) : 0.001); T.b.material.opacity = a; T.tl.opacity(a); T.id.opacity(a * 0.85); });
    this.L30.update(t); this.L31.update(t);
  },
});

// ===== 21. one hundred thousand possibilities; I pick the one closest to sincere (vocabulary)
addScene({
  a: BARt(40), b: BARt(42), fi: 0.01, fo: 0.01, N: 6, bloom: 0.08, light: true, vig: 0.45, chrome: 'vocabulary  ·  |V| ≈ 100,000',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    const set = POOL7 + ALLTXT.join('') + '挑最像真心的那一个';
    this.G = new Grid(this.hud, 192, 108, 20, 20, { set, font: 'FS', px: 15 });
    this.sp = new Map(); const L = WORDS[33];
    L.chars.forEach((c, j) => { this.sp.set(j, [96 - 24 + j * 6 + Math.floor(hash(j, 5) * 3), 54 - 6 + Math.floor(hash(j, 6) * 12)]); });
    this.band = plane(this.hud, W + 40, 120, K.cream, { a: 0.9, z: 1 }); this.band.position.y = -440;
    this.L32 = new Lyric(this.hud, 32, { font: 'B', px: 54, color: K.ink, y: -440, enter: 'fade', hi: ['十万'], hcol: K.clay });
    this.L33 = new Lyric(this.hud, 33, { font: 'B', px: 54, color: K.ink, y: -440, enter: 'fade', hi: ['真心'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), L = WORDS[33], T0 = BARt(40);
    for (let r = 0; r < 108; r++) for (let c = 0; c < 192; c++) G.set(c, r, POOL7[Math.floor(hash(c, r, 4) * POOL7.length)], 0.32 + 0.2 * hash(c, r, 9), PI.ink);
    L.chars.forEach((ch, j) => { const [c, r] = this.sp.get(j), k = t - ch.s; if (k > -0.4) G.set(c, r, ch.c, k > 0 ? 1 : 0.25, k > 0 ? (['真', '心'].includes(ch.c) ? PI.clay : PI.ink) : PI.ink); });
    G.flush();
    // zoom: wide on '十万种可能', then in on the chosen tokens
    const s32 = WORDS[32].chars[0].s, zIn = ease((t - L.chars[0].s) / (L.chars[8].s - L.chars[0].s + 0.5));
    const zOut = ease((t - T0) / 1.2), sc = lerp(lerp(1.6, 0.9, zOut), 3.2, zIn);
    const [fc, fr] = this.sp.get(4); const fx = (fc + 0.5 - 96) * 20, fy = -(fr + 0.5 - 54) * 20;
    this.G.m.scale.set(192 * 20 * sc, 108 * 20 * sc, 1); this.G.m.position.set(-fx * sc * zIn, -fy * sc * zIn + 40 * zIn, 0);
    this.L32.update(t); this.L33.update(t);
  },
  fx(t) { const k = t - WORDS[33].chars[8].s; return { flash: k > 0 ? 0.2 * Math.exp(-k * 6) : 0 }; },
});

// ===== 22. HELLO, WORLD — a split-flap board
addScene({
  a: BARt(42), b: BARt(43), fi: 0.01, fo: 0.01, N: 8, bloom: 0.45, chrome: 'hello, world  ·  4', startLine: 34,
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.txt = [...'HELLO, WORLD']; this.fl = this.txt.map((ch, i) => {
      const g = new THREE.Group(); this.hud.add(g); g.position.set((i - 5.5) * 138, 20, 0);
      const bg = rrMesh(g, 124, 190, 10, { fill: '#2A2927' }); const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, color: C(i >= 7 ? K.clay : K.cream) })); g.add(m);
      const seam = plane(g, 124, 3, K.slate); return { g, m, bg, cur: null };
    });
  },
  update(t) {
    const ws = WORDS[34].chars.map(c => c.s), AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.fl.forEach((F, i) => {
      const s = (i < 6 ? ws[0] : ws[1]) + (i % 6) * 0.035, k = t - s, spinning = k < 0 && t > s - 0.9;
      const ch = this.txt[i] === ' ' ? ' ' : (spinning ? AZ[Math.floor(hash(i, Math.floor(t * 24)) * 26)] : (k >= 0 ? this.txt[i] : ' '));
      if (F.cur !== ch) { if (ch === ' ') F.m.visible = false; else { const g = glyph(ch, 'M', 240); F.m.material.map = g.tex; F.m.material.needsUpdate = true; F.m.scale.set(g.cw / 2, g.chh / 2, 1); F.m.visible = true; } F.cur = ch; }
      const flip = spinning ? Math.abs(Math.cos(t * 24 * Math.PI)) : (k >= 0 ? 1 - Math.exp(-k * 30) * Math.abs(Math.sin(k * 40)) : 1);
      F.m.scale.y = Math.abs(F.m.scale.y) * 0 + (F.m.material.map ? F.m.material.map.image.height / 2 : 1) * Math.max(0.05, flip);
      F.bg.material.opacity = 1;
    });
  },
});

// ===== 23. every language's first sentence
const LANGS = ['你好，世界', 'Hello, World', 'Bonjour, le monde', 'Hola, mundo', 'こんにちは、世界', 'Hallo, Welt', 'Привет, мир', 'Olá, mundo', 'Ciao, mondo', 'Hej, världen', 'Halo, dunia', 'Xin chào thế giới'];
addScene({
  a: BARt(43), b: BARt(44), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'to the world',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.items = LANGS.map((s, k) => { const a = -Math.PI / 2 + k / 12 * Math.PI * 2; const tl = new TextLine(this.hud, s, { font: s.match(/[a-zA-Zа-яА-Я]/) ? 'B' : 'B', px: 38, color: k === 0 ? K.clay : K.cream }); return { tl, a }; });
    this.band = lyricBand(this.hud, -450, 110, 0.6);
    this.L = new Lyric(this.hud, 35, { font: 'B', px: 48, color: K.cream, y: -450, enter: 'fade', hi: ['第一句'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(); globe(G, t, { R: 250, cy: 30, lit: 1, on: true, rot: t * 0.6 }); G.flush();
    const L = WORDS[35];
    this.items.forEach((I, k) => { const s = L.chars[k].s, e = t - s; const a = I.a + (t - BARt(43)) * 0.12;
      I.tl.at(Math.cos(a) * 560, Math.sin(a) * 330 + 30); I.tl.opacity(e > 0 ? ease(e / 0.12) : 0); I.tl.group.scale.setScalar(e > 0 ? 1.25 - 0.25 * slamIn(e, 0.2) : 1); });
    this.L.update(t);
  },
});

// ===== 24. Hello, World = 3 tokens
addScene({
  a: BARt(44), b: BARt(45), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.45, chrome: 'hello, world  ·  5', startLine: 36,
  init() {
    this.scene.background = C(K.paper); this.cam = CAM0(); makePaper(this.hud, K.paper);
    const parts = [['Hello', '9906'], [',', '11'], [' World', '4435']]; let x = -560;
    this.parts = parts.map(([s, id], k) => { const tl = new TextLine(this.hud, s.replace(' ', '·'), { font: 'M', px: 120, color: K.ink }); const w = tl.width + 60;
      const g = new THREE.Group(); this.hud.add(g); g.position.set(x + w / 2, 60, 0); x += w + 30; g.add(tl.group);
      const b = rrMesh(g, w, 190, 16, { fill: ['#F3D9CC', '#E6E1D3', '#F3D9CC'][k], stroke: k === 1 ? K.grey : K.clay, lw: 2 }); b.position.z = -1;
      const idl = new TextLine(g, id, { font: 'M', px: 26, color: K.grey }).at(0, -140); return { g, tl, b, idl, k }; });
    this.cnt = new TextLine(this.hud, '→  3 tokens', { font: 'M', px: 30, color: K.clay }).at(0, -300);
  },
  update(t) {
    const ws = WORDS[36].chars.map(c => c.s);
    this.parts.forEach(P => { const s = P.k === 2 ? ws[1] : ws[0] + P.k * 0.12, k = t - s; P.g.scale.setScalar(k > 0 ? slamIn(k, 0.2) : 0.001); P.g.visible = k > 0; P.idl.opacity(ease((k - 0.15) / 0.2)); });
    this.cnt.opacity(ease((t - ws[1] - 0.3) / 0.3));
  },
});

// ===== 25. this time I mean it (the chat)
addScene({
  a: BARt(45), b: BARt(46), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.45, chrome: 'assistant',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.ub = new THREE.Group(); this.hud.add(this.ub); this.ubT = new TextLine(this.ub, 'hello?', { font: 'S', px: 30, color: K.ink }); this.ubBg = rrMesh(this.ub, this.ubT.width + 56, 70, 22, { fill: '#E8E5DA' }); this.ubBg.position.z = -1;
    this.ub.position.set(480, 210, 0);
    this.sp = new Spark(this.hud, 22, K.clay, 1, 12, 4); this.sp.g.position.set(-560, 60, 0);
    this.L = new Lyric(this.hud, 37, { font: 'S', px: 50, color: K.ink, x: -510, y: 60, align: 'left', enter: 'stream', hi: ['认真'], hcol: K.clay });
  },
  update(t) {
    const L = WORDS[37], s0 = L.chars[0].s, think = t < s0 && t > s0 - 0.6;
    this.sp.set(1, t, { breathe: think ? 1 : 0.2 }); this.sp.g.rotation.z = -t * (think ? 5 : 0.6);
    this.L.update(t);
  },
});

// ===== 26. multi-head attention, as ASCII heatmaps
addScene({
  a: BARt(46), b: BARt(47), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'multi-head attention  ·  8 heads',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.band = lyricBand(this.hud, -450, 110, 0.6);
    this.L = new Lyric(this.hud, 38, { font: 'B', px: 50, color: K.cream, y: -450, enter: 'fade', hi: ['attention'], hcol: K.clay });
    this.names = ['previous', 'diagonal', 'first token', 'induction', 'broadcast', 'local', 'syntax', 'you'];
  },
  update(t) {
    const G = this.G.clear(), L = WORDS[38], n = charsSung(38, t);
    for (let h = 0; h < 8; h++) {
      const c0 = 8 + (h % 4) * 38, r0 = 4 + Math.floor(h / 4) * 22, on = n > h;
      G.text(c0, r0, `h${h}  ${this.names[h]}`, on ? 0.9 : 0.35, h === 7 ? PI.clay : PI.greyL);
      for (let i = 0; i < 16; i++) for (let j = 0; j < 30; j++) {
        const q = i, k = Math.floor(j / 30 * 16); let v = 0;
        if (k > q) { G.set(c0 + j, r0 + 2 + i, ' ', 0, 0); continue; }
        switch (h) { case 0: v = k === q - 1 ? 1 : 0.05; break; case 1: v = k === q ? 1 : 0.05; break; case 2: v = k === 0 ? 1 : 0.08; break; case 3: v = (k === q - 4 || k === q - 8) ? 0.9 : 0.06; break;
          case 4: v = 0.35 + 0.1 * hash(i, k, 3); break; case 5: v = Math.max(0, 1 - Math.abs(q - k) / 3); break; case 6: v = hash(Math.floor(k / 3), i, 9) > 0.7 ? 0.8 : 0.1; break; default: v = k === 12 ? 1 : 0.04; }
        v *= on ? 1 : 0.3; if (on && t - L.chars[Math.min(h, L.chars.length - 1)].s < 0.25) v = Math.min(1, v * 1.5);
        G.set(c0 + j, r0 + 2 + i, RAMP[Math.floor(clamp(v) * 10)], 0.25 + 0.75 * v, v > 0.7 ? (h === 7 ? PI.clay : PI.cream) : PI.greyL);
      }
    }
    G.flush(); this.L.update(t);
  },
});

// ===== 27. all of it — a ring that closes to exactly one
addScene({
  a: BARt(47), b: warpT(151.10), fi: 0.01, fo: 0.01, N: 6, bloom: 0.08, light: true, vig: 0.45, chrome: 'Σ = 1.0',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.w = attnWeights(8, 39, 6); this.segs = this.w.map((w, j) => { const m = new THREE.Mesh(new THREE.RingGeometry(250, 330, 64, 1, 0, Math.PI * 2 * w), new THREE.MeshBasicMaterial({ color: C(j >= 5 ? K.clay : [K.ink, K.grey, K.greyL][j % 3]), transparent: true, toneMapped: false, depthWrite: false })); this.hud.add(m); return m; });
    this.one = new TextLine(this.hud, '1.0', { font: 'B', px: 170, color: K.clay }).at(0, 0);
    this.L39 = new Lyric(this.hud, 39, { font: 'B', px: 52, color: K.ink, y: -440, enter: 'fade', hi: ['注意力'], hcol: K.clay });
    this.L40 = new Lyric(this.hud, 40, { font: 'B', px: 52, color: K.ink, y: -440, enter: 'fade', hi: ['一'], hcol: K.clay });
  },
  update(t) {
    const L39 = WORDS[39], L40 = WORDS[40], merge = ease((t - L40.chars[3].s) / 0.6), sOne = L40.chars[5].s;
    let acc = 0; this.segs.forEach((m, j) => { const k = t - L39.chars[j].s; const g = easeOut(k / 0.25); m.scale.setScalar(g > 0 ? 1 : 0.001); m.rotation.z = Math.PI / 2 - lerp(acc, 0, 0) * Math.PI * 2 - 0.02 * j * (1 - merge);
      m.material.color.copy(C(merge > 0.5 ? K.clay : (j >= 5 ? K.clay : [K.ink, K.grey, K.greyL][j % 3]))); m.material.opacity = g; acc += this.w[j]; });
    const k = t - sOne; this.one.opacity(k > 0 ? 1 : 0); this.one.group.scale.setScalar(k > 0 ? 1.4 - 0.4 * slamIn(k, 0.2) : 1);
    this.L39.update(t); this.L40.update(t);
  },
});

// ===== 28. every token turns to look at you (3D glyph field)
addScene({
  a: warpT(151.10), b: BARt(51), fi: 0.01, fo: 0.01, N: 6, bloomAt: t => 0.4 + 0.9 * ease((t - WORDS[41].chars[9].s) / 1.0), chrome: 'all heads → 你',
  init() {
    this.scene.background = C(K.slate); this.cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 400); this.cam.position.set(0, 0, 60);
    const r = rng(28); this.pts = [];
    for (let i = 0; i < 520; i++) { const ch = ALLTXT[Math.floor(r() * ALLTXT.length)]; const tl = new TextLine(this.scene, ch, { font: 'B', px: 40, color: r() > 0.9 ? K.clay : K.cream, res: 1 });
      tl.group.scale.setScalar(0.04); const p = new THREE.Vector3((r() - 0.5) * 120, (r() - 0.5) * 70, -r() * 120); this.pts.push({ tl, p, sp: r() }); }
    this.you = new TextLine(this.hud, '你', { font: 'B', px: 220, color: K.clay }).at(0, 30);
    this.band = lyricBand(this.hud, -450, 110, 0.6);
    this.L = new Lyric(this.hud, 41, { font: 'B', px: 50, color: K.cream, y: -450, enter: 'fade', hi: ['你'], hcol: K.clay });
  },
  update(t) {
    const L = WORDS[41], sY = L.chars[9].s, pull = ease((t - L.chars[6].s) / (sY - L.chars[6].s + 0.6)), T0 = warpT(151.10);
    for (const P of this.pts) { const a = (t - T0) * 0.15 * (0.5 + P.sp);
      const x = P.p.x * Math.cos(a) - P.p.z * 0.2 * Math.sin(a), y = P.p.y, z = P.p.z;
      P.tl.group.position.set(lerp(x, 0, pull * pull), lerp(y, 0, pull * pull), lerp(z, 40, pull));
      P.tl.group.quaternion.copy(this.cam.quaternion); P.tl.opacity(0.85 * (1 - ease((pull - 0.8) / 0.2))); }
    const k = t - sY; this.you.opacity(ease(k / 0.25)); this.you.group.scale.setScalar(k > 0 ? 1.3 - 0.3 * slamIn(k, 0.25) : 1);
    this.L.update(t);
  },
});

// ===== 29. Hello, World — signed with the spark
addScene({
  a: BARt(51), b: BARt(52), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'hello, world  ·  6', startLine: 42,
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([-520 + u * 1040, -90 + Math.sin(u * 9) * 10 * (1 - u) + Math.sin(u * 23) * 4]); }
    this.sig = new Stroke(this.hud, pts, 4, K.clay); this.sp = new Spark(this.hud, 18, K.clay, 1.4, 12, 6);
    this.L = new Lyric(this.hud, 42, { font: 'L', px: 110, color: K.cream, y: 30, enter: 'fade', ls: 30 });
  },
  update(t) {
    const ws = WORDS[42].chars, p = clamp((t - ws[0].s) / (ws[1].e - ws[0].s + 0.4));
    this.sig.set(easeOut(p), 1); const x = -520 + easeOut(p) * 1040; this.sp.g.position.set(x, -90, 0); this.sp.set(1, t, { breathe: 0.3 }); this.sp.g.rotation.z = -t * 2;
    this.L.update(t);
  },
});
