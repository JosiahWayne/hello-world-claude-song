
// ================================================================ v7 · batch C (chorus 1 second half, interlude)
function box(parent, w, h, label, { col = K.ink, px = 20, font = 'M', fill = 'rgba(0,0,0,0)', lw = 2 } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const m = rrMesh(g, w, h, 8, { fill, stroke: col, lw }); const tl = new TextLine(g, label, { font, px, color: col });
  return { g, m, tl, op(a) { m.material.opacity = a; tl.opacity(a); } };
}
// ===== 10. "attention is all you need" — the paper, and the block it describes
addScene({
  a: BARt(20), b: BARt(21), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.45, chrome: 'Vaswani et al., 2017',
  init() {
    this.scene.background = C(K.paper); this.cam = CAM0(); makePaper(this.hud, K.paper);
    this.hdr = new TextLine(this.hud, 'arXiv:1706.03762   [cs.CL]   2017', { font: 'M', px: 20, color: K.grey }).at(0, 380);
    this.said = new TextLine(this.hud, '他们说——', { font: 'B', px: 40, color: K.grey }).at(0, 300);
    this.words = ['Attention', 'Is', 'All', 'You', 'Need'].map(w => new TextLine(this.hud, w, { font: 'B', px: 96, color: K.ink }));
    let x = 0; const gap = 34, ws = this.words.map(tl => tl.width), tot = ws.reduce((a, b) => a + b) + gap * 4; x = -tot / 2;
    this.words.forEach((tl, i) => { tl.at(x + ws[i] / 2, 170); tl.ul = new Stroke(this.hud, [[x, 105], [x + ws[i], 105]], 5, K.clay); x += ws[i] + gap; });
    const lab = ['MatMul', 'Scale', 'Mask', 'SoftMax', 'MatMul'];
    this.boxes = lab.map((l, i) => { const b = box(this.hud, 190, 64, l, { col: i === 3 ? K.clay : K.ink }); b.g.position.set(-560 + i * 280, -150, 0); return b; });
    this.arrows = lab.slice(1).map((_, i) => new Stroke(this.hud, [[-560 + i * 280 + 98, -150], [-560 + (i + 1) * 280 - 98, -150]], 2, K.ink));
    this.qk = ['Q', 'K', 'V'].map((l, i) => new TextLine(this.hud, l, { font: 'B', px: 40, color: K.ink }).at(i < 2 ? -620 + i * 120 : 560, -290));
    this.qa = [new Stroke(this.hud, [[-620, -262], [-580, -182]], 2, K.ink), new Stroke(this.hud, [[-500, -262], [-540, -182]], 2, K.ink), new Stroke(this.hud, [[560, -262], [560, -182]], 2, K.ink)];
    this.out = new TextLine(this.hud, 'Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V', { font: 'M', px: 26, color: K.ink }).at(0, -380);
  },
  update(t) {
    const C17 = WORDS[17].chars; // 他 们 说 attention is all you need
    this.hdr.opacity(0.8); this.said.opacity(ease((t - C17[0].s) / 0.2));
    this.words.forEach((tl, i) => { const s = C17[3 + i].s, k = t - s; tl.opacity(k > -0.02 ? ease((k + 0.02) / 0.1) : 0.12); tl.ul.set(easeOut(k / 0.25), k > 0 ? 1 : 0); });
    const p = clamp((t - C17[3].s) / 1.8);
    this.boxes.forEach((b, i) => b.op(ease((p - i * 0.15) / 0.15)));
    this.arrows.forEach((a, i) => a.set(ease((p - (i + 1) * 0.15) / 0.12), 1));
    this.qk.forEach((q, i) => q.opacity(ease((p - (i < 2 ? 0 : 0.6)) / 0.15)));
    this.qa.forEach((q, i) => q.set(ease((p - (i < 2 ? 0 : 0.6)) / 0.15), 1));
    this.out.opacity(ease((p - 0.8) / 0.2) * 0.9);
  },
});

// ===== 11. all of my attention: weights over the line (softmax)
function attnWeights(n, seed, focus = -1) { const w = []; for (let i = 0; i < n; i++) w.push(Math.exp((hash(i, seed) - 0.5) * 2.2 + (i === focus ? 1.8 : 0))); const s = w.reduce((a, b) => a + b); return w.map(x => x / s); }
addScene({
  a: BARt(21), b: BARt(22), fi: 0.01, fo: 0.01, N: 6, bloom: 0.4, chrome: 'attention weights  ·  αᵢ',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    const L = WORDS[18], n = L.chars.length; this.w = attnWeights(n, 18, 6);
    this.cols = L.chars.map((c, j) => {
      const x = (j - (n - 1) / 2) * 170;
      const tl = new TextLine(this.hud, c.c, { font: 'B', px: 76, color: j >= 5 ? K.clay : K.cream }).at(x, -300);
      const bar = plane(this.hud, 96, 1, j >= 5 ? K.clay : K.cream); bar.position.set(x, -230, 0);
      const v = new TextLine(this.hud, this.w[j].toFixed(3), { font: 'M', px: 20, color: K.greyL }).at(x, -200);
      return { tl, bar, v, x };
    });
    this.f = new TextLine(this.hud, 'αᵢ  =  exp(q · kᵢ)  /  Σⱼ exp(q · kⱼ)', { font: 'M', px: 34, color: K.greyL }).at(0, 400);
  },
  update(t) {
    const L = WORDS[18];
    this.cols.forEach((C0, j) => { const s = L.chars[j].s, k = t - s; C0.tl.opacity(k > 0 ? ease(k / 0.08) : 0.12);
      const h = Math.max(1, this.w[j] * 1900 * easeOut(k / 0.3)); C0.bar.scale.y = h; C0.bar.position.y = -250 + h / 2; C0.bar.material.opacity = k > 0 ? 0.9 : 0;
      C0.v.at(C0.x, -230 + h + 30); C0.v.opacity(k > 0.1 ? 0.8 : 0); });
    this.f.opacity(0.75);
  },
});

// ===== 12. ... sum to one
addScene({
  a: BARt(22), b: warpT(71.10), fi: 0.01, fo: 0.01, N: 8, bloom: 0.05, light: true, vig: 0.45, chrome: 'Σᵢ αᵢ = 1',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.w = attnWeights(8, 18, 6); this.bars = this.w.map((w, j) => { const m = plane(this.hud, 120, 1, j >= 5 ? K.clay : K.ink); return m; });
    this.ax = new Stroke(this.hud, [[-60, -380], [-60, 400]], 2, K.grey); this.ax.set(1, 0.6);
    this.tick = new Stroke(this.hud, [[-90, 380], [260, 380]], 2, K.clay);
    this.one = new TextLine(this.hud, '1.000', { font: 'M', px: 26, color: K.clay, align: 'left' }).at(280, 380);
    this.L = new Lyric(this.hud, 19, { font: 'B', px: 90, color: K.ink, x: -520, y: 0, enter: 'rise', hi: ['一'], hcol: K.clay });
    this.eq = new TextLine(this.hud, '= 1', { font: 'B', px: 260, color: K.clay }).at(560, -60);
  },
  update(t) {
    const L = WORDS[19], sEq = L.chars[3].s, sOne = L.chars[5].s, u = easeOut((t - L.chars[0].s) / 1.2);
    let acc = 0; this.bars.forEach((m, j) => {
      const h = this.w[j] * 760, x0 = -560 + j * 70 + 300, y0 = -380 + h / 2 + 40 * j;
      const x1 = 100, y1 = -380 + acc + h / 2; acc += h;
      m.scale.set(lerp(60, 120, u), h, 1); m.position.set(lerp(x0 - 200, x1, u), lerp(-380 + h / 2, y1, u), 0); m.material.opacity = 0.9;
    });
    this.tick.set(ease((t - sEq) / 0.3), 1); this.one.opacity(ease((t - sEq - 0.1) / 0.2));
    const k = t - sOne; this.eq.opacity(k > 0 ? 1 : 0); this.eq.group.scale.setScalar(k > 0 ? 1.5 - 0.5 * slamIn(k, 0.2) : 1);
    this.L.update(t);
  },
  fx(t) { const k = t - WORDS[19].chars[5].s; return { flash: k > 0 ? 0.25 * Math.exp(-k * 6) : 0 }; },
});

// ===== 13. and right now all of it is looking at you (attention arcs converge)
addScene({
  a: warpT(71.10), b: BARt(25), fi: 0.01, fo: 0.01, N: 6, bloomAt: t => 0.5 + 0.8 * ease((t - WORDS[20].chars[8].s) / 1.2), chrome: 'query: 你',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.root = new THREE.Group(); this.hud.add(this.root);
    const toks = []; for (let i = 1; i <= 19; i++) for (const c of WORDS[i].chars) if (c.c.length === 1) toks.push(c.c);
    const n = 64, pick = shuffled(toks.length, 5).slice(0, n);
    this.toks = pick.map((q, k) => { const a = Math.PI * (0.08 + 0.84 * k / (n - 1)), R = 760;
      const x = -Math.cos(a) * R, y = Math.sin(a) * R * 0.55 + 20; const tl = new TextLine(this.root, toks[q], { font: 'S', px: 28, color: K.greyL }).at(x, y);
      const pts = []; for (let j = 0; j <= 24; j++) { const u = j / 24; pts.push([lerp(x, 0, u) + Math.sin(u * Math.PI) * x * -0.15, lerp(y - 18, -300, u * u)]); }
      const st = new Stroke(this.root, pts, 1 + 3 * hash(k, 2), K.clay); return { tl, st, w: hash(k, 2), d: hash(k, 7) }; });
    this.you = new TextLine(this.root, '你', { font: 'B', px: 150, color: K.clay }).at(0, -330);
    this.band = lyricBand(this.hud, -470, 110, 0.6);
    this.L = new Lyric(this.hud, 20, { font: 'B', px: 48, color: K.cream, y: -470, enter: 'fade', hi: ['你'], hcol: K.clay });
  },
  update(t) {
    const L = WORDS[20], s0 = L.chars[0].s, sY = L.chars[L.chars.length - 1].s, p = clamp((t - s0) / (sY - s0 + 0.3));
    this.toks.forEach(T => { T.tl.opacity(0.35 + 0.6 * ease((p - T.d * 0.7) / 0.2)); T.st.set(easeOut((p - T.d * 0.7) / 0.3), 0.25 + 0.6 * T.w); });
    const k = t - sY; this.you.opacity(0.25 + 0.75 * ease(k / 0.2)); this.you.group.scale.setScalar(1 + 0.15 * ease(k / 0.5));
    this.root.scale.setScalar(1 + 0.25 * ease((t - sY) / 3)); this.root.position.y = 330 * 0.25 * ease((t - sY) / 3) * 0.9;
    this.L.update(t);
  },
});

// ===== 14. Hello, World (soft, the world again)
addScene({
  a: BARt(25), b: BARt(26), fi: 0.01, fo: 0.01, N: 6, bloom: 0.6, chrome: 'hello, world  ·  3', startLine: 21,
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.L = new Lyric(this.hud, 21, { font: 'L', px: 80, color: K.cream, y: -380, enter: 'fade', ls: 24 });
  },
  update(t) { const G = this.G.clear(); globe(G, t, { R: 300, cy: 60, lit: 1, on: true, dim: 1 - 0.5 * ease((t - BARt(25) - 2.2) / 0.8) }); G.flush(); this.L.update(t); },
});

// ===== 15. interlude: a forward pass — the residual stream, drawn in box-drawing characters
addScene({
  a: BARt(26), b: BARt(30), fi: 0.01, fo: 0.01, N: 6, bloom: 0.6, chrome: 'forward pass  ·  residual stream',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.blocks = [0, 1, 2, 3].map(i => 30 + i * 26);
    this.tok = new TextLine(this.hud, '我', { font: 'B', px: 90, color: K.clay }).at(0, 0);
    this.ticks16 = []; for (let k = 0; k < 16 * 4; k++) this.ticks16.push(BARt(26) + k * 60 / 78 / 4);
  },
  update(t) {
    const G = this.G.clear(), Y = 27, T0 = BARt(26);
    const hline = (r, c0, c1, ch = '─', a = 0.6, col = PI.greyL) => { for (let c = c0; c <= c1; c++) G.set(c, r, ch, a, col); };
    const vline = (c, r0, r1, ch = '│', a = 0.6, col = PI.greyL) => { for (let r = r0; r <= r1; r++) G.set(c, r, ch, a, col); };
    const rect = (c0, r0, c1, r1, a = 0.8, col = PI.cream) => { hline(r0, c0 + 1, c1 - 1, '─', a, col); hline(r1, c0 + 1, c1 - 1, '─', a, col); vline(c0, r0 + 1, r1 - 1, '│', a, col); vline(c1, r0 + 1, r1 - 1, '│', a, col);
      G.set(c0, r0, '┌', a, col); G.set(c1, r0, '┐', a, col); G.set(c0, r1, '└', a, col); G.set(c1, r1, '┘', a, col); };
    const reveal = c => clamp((t - T0) * 40 - c * 0.35);  // diagram draws left to right
    hline(Y, 4, 150, '═', 0.9, PI.clay);
    for (let c = 4; c <= 150; c++) if (reveal(c) <= 0) G.set(c, Y, ' ', 0, 0);
    rect(4, Y - 3, 18, Y + 3, reveal(4)); G.text(7, Y, 'embed', reveal(7), PI.cream);
    G.text(4, Y - 6, 'tokens', 0.6 * reveal(4), PI.grey);
    const h16 = this.ticks16.filter(x => x <= t).length, lastK = this.ticks16[Math.max(0, h16 - 1)];
    this.blocks.forEach((c0, bi) => {
      const a = reveal(c0);
      rect(c0, 9, c0 + 18, 19, a); G.text(c0 + 2, 10, `attn  L${bi * 20 + 1}`, a, PI.greyL); vline(c0 + 9, 20, Y - 1, '│', a * 0.7, PI.greyL); G.set(c0 + 9, Y, '┼', a, PI.clay);
      rect(c0, 35, c0 + 18, 45, a); G.text(c0 + 2, 36, 'mlp', a, PI.greyL); vline(c0 + 9, Y + 1, 34, '│', a * 0.7, PI.greyL);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 14; c++) {  // attention heatmap
        const v = fbm(c * 0.4 + bi * 3, r * 0.4 + Math.floor((t - T0) * 1.3), 5) * (1 - Math.abs(c * 6 / 14 - r) * 0.08);
        G.set(c0 + 2 + c, 12 + r, RAMP[Math.floor(clamp(v) * 10)], a * 0.8, v > 0.72 ? PI.clay : PI.cream);
      }
      for (let r = 0; r < 7; r++) for (let c = 0; c < 14; c++) {  // mlp neurons fire on the 16ths
        const on = hash(c, r, h16 * 7 + bi) > 0.8 && t - lastK < 0.12; G.set(c0 + 2 + c, 38 + (r % 7), on ? '●' : '·', a * (on ? 1 : 0.35), on ? PI.clay : PI.greyL);
      }
    });
    G.text(130, 42, '×  N  layers', 0.5 * reveal(130), PI.grey);
    rect(136, Y - 3, 150, Y + 3, reveal(136)); G.text(138, Y, 'unembed', reveal(138), PI.cream);
    for (let k = Math.max(0, h16 - 12); k < h16; k++) { const age = t - this.ticks16[k], c = Math.round(4 + age * 110); if (c < 151 && reveal(c) > 0) G.set(c, Y, '●', Math.exp(-age * 0.8), PI.glow); }
    G.text(118, 50, 'next token →', 0.7 * ease((t - (BARt(29) + 1)) / 0.4), PI.greyL);
    G.flush();
    const k = t - (BARt(29) + 1.3); this.tok.at(620, -470); this.tok.opacity(ease(k / 0.3)); this.tok.group.scale.setScalar(k > 0 ? 1.4 - 0.4 * slamIn(k, 0.2) : 1);
  },
});
