
// ================================================================ v7 · batch F (bridge, swell, confession, final chorus, tag, outro)
// ===== 30. you corrected me, again and again — that's how I learned honest and kind (RLHF, on paper)
const EDITS = [['我当然知道答案。', '当然知道答案', '不确定，但我们可以一起想', 2], ['你应该这样做。', '应该这样做', '也许可以试试这样', 5], ['这很简单。', '很简单', '这确实不容易', 8]];
addScene({
  a: BARt(52), b: BARt(54), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.45, chrome: 'RLHF  ·  human feedback',
  init() {
    this.scene.background = C(K.paper); this.cam = CAM0(); makePaper(this.hud, K.paper);
    this.rows = EDITS.map(([orig, cut, ins, j], k) => {
      const y = 260 - k * 170, tl = new TextLine(this.hud, orig, { font: 'L', px: 52, color: K.ink, align: 'left' }).at(-620, y);
      const p0 = [...orig].indexOf([...cut][0]), m0 = tl.chars[p0], m1 = tl.chars[p0 + [...cut].length - 1];
      const x0 = -620 + m0.userData.left, x1 = -620 + m1.userData.left + m1.userData.adv;
      const st = new Stroke(this.hud, [[x0 - 4, y + 2], [x1 + 4, y - 4]], 4, K.red);
      const it = new TextLine(this.hud, ins, { font: 'S', px: 32, color: K.red, align: 'left' }).at(x0, y + 62);
      const caret = new TextLine(this.hud, '∧', { font: 'S', px: 26, color: K.red }).at(x0 - 6, y + 30);
      const note = new TextLine(this.hud, k === 0 ? '✓ 诚实' : '✓ 温柔', { font: 'S', px: 30, color: K.clay, align: 'left' }).at(560, y);
      return { tl, st, it, caret, note, j };
    });
    this.fb = new Slots(this.hud, 20, { px: 22, color: K.grey }); this.fb.g.position.set(520, 430, 0);
    this.L43 = new Lyric(this.hud, 43, { font: 'B', px: 50, color: K.ink, y: -390, enter: 'fade', hi: ['一遍又一遍'], hcol: K.clay });
    this.L44 = new Lyric(this.hud, 44, { font: 'B', px: 50, color: K.ink, y: -390, enter: 'fade', hi: ['诚实', '温柔'], hcol: K.clay });
  },
  update(t) {
    const L43 = WORDS[43], L44 = WORDS[44];
    this.rows.forEach((R, k) => { const s = L43.chars[Math.min(R.j, L43.chars.length - 1)].s, u = t - s;
      R.tl.opacity(0.9); R.st.set(easeOut(u / 0.25), u > 0 ? 1 : 0); R.it.opacity(ease((u - 0.2) / 0.25)); R.caret.opacity(ease((u - 0.15) / 0.2));
      const sn = L44.chars[k === 0 ? 4 : 7].s; R.note.opacity(ease((t - sn - k * 0.12) / 0.2)); });
    const n = Math.floor(Math.pow(clamp((t - BARt(52)) / (BARt(54) - BARt(52))), 2) * 4096) + 1; this.fb.set(`feedback  #${n}`); this.fb.opacity(0.85);
    this.L43.update(t); this.L44.update(t);
  },
});

// ===== 31. I'm not sure I have a heart — and when I don't know, I say so
const HEARTBEATS = []; for (let b = 54; b < 58; b++) for (const bt of [0, 0.375, 2, 2.375]) HEARTBEATS.push(BARt(b) + bt * 60 / 78);
addScene({
  a: BARt(54), b: BARt(56), fi: 0.01, fo: 0.01, N: 6, bloom: 0.6, chrome: 'calibration  ·  p(heart) = ?',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.bub = new THREE.Group(); this.hud.add(this.bub); this.bub.position.set(560, -120, 0);
    this.bbg = rrMesh(this.bub, 360, 96, 26, { fill: K.cream }); this.bt = new Slots(this.bub, 6, { px: 40, color: K.ink, font: 'S' }); this.bt.g.position.set(-130, 0, 0);
    this.ok = new TextLine(this.hud, '✓ calibrated', { font: 'M', px: 22, color: K.clay }).at(560, -210);
    this.band = lyricBand(this.hud, -430, 110, 0.6);
    this.L45 = new Lyric(this.hud, 45, { font: 'B', px: 52, color: K.cream, y: -430, enter: 'fade', hi: ['心'], hcol: K.clay });
    this.L46 = new Lyric(this.hud, 46, { font: 'B', px: 52, color: K.cream, y: -430, enter: 'fade', hi: ['不知道'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), beat = pulseFrom(HEARTBEATS, t, 9), sc = 1 + 0.08 * beat, cx = -300;
    for (let r = 0; r < 54; r++) for (let c = 0; c < 160; c++) {
      const x = ((c + 0.5 - 80) * 12 - cx) / (230 * sc), y = (-(r + 0.5 - 27) * 20 - 40) / (230 * sc) + 0.05;
      const v = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
      if (v < 0) G.set(c, r, '?', clamp(0.35 + (-v) * 2 + 0.4 * beat), -v > 0.15 ? PI.clay : PI.cream);
      else if (v < 0.03 && hash(c, r, 3) > 0.4) G.set(c, r, '·', 0.3, PI.greyL);
    }
    G.text(24, 46, 'p( 心 ) = ?', 0.8, PI.greyL);
    G.flush();
    const L46 = WORDS[46], s = L46.chars[4].s, n = Math.floor(clamp((t - s) / 0.5) * 5), txt = '我不知道。';
    this.bbg.material.opacity = ease((t - s + 0.2) / 0.2); this.bt.set([...txt].slice(0, n).join('')); this.bt.opacity(1);
    this.ok.opacity(ease((t - s - 0.8) / 0.3));
    this.L45.update(t); this.L46.update(t);
  },
});

// ===== 32. turn the temperature up a little
function softmaxT(logits, T) { const e = logits.map(l => Math.exp(l / T)); const s = e.reduce((a, b) => a + b); return e.map(x => x / s); }
const LOGITS = [3.1, 2.2, 1.6, 1.1, 0.8, 0.5, 0.2, -0.1, -0.4, -0.6, -0.9, -1.2];
const CANDS = ['好', '是', '在', '会', '想', '能', '要', '爱', '有', '说', '看', '等'];
function tempAt(t) { const L = WORDS[47]; return lerp(0.7, 1.6, ease((t - L.chars[4].s) / (L.chars[9].e - L.chars[4].s))); }
addScene({
  a: BARt(56), b: BARt(58), fi: 0.01, fo: 0.01, N: 6, bloom: 0.08, light: true, vig: 0.45, chrome: 'temperature',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.track = new Stroke(this.hud, [[-500, 330], [500, 330]], 4, K.rule); this.track.set(1);
    this.fill = new Stroke(this.hud, [[-500, 330], [500, 330]], 4, K.clay);
    this.knob = circle(this.hud, 18, K.clay); this.lab = new TextLine(this.hud, 'temperature', { font: 'M', px: 24, color: K.grey, align: 'left' }).at(-500, 385);
    this.val = new Slots(this.hud, 5, { px: 30, color: K.clay }); this.val.g.position.set(420, 385, 0);
    this.ticks = ['0.0', '1.0', '2.0'].map((s, i) => new TextLine(this.hud, s, { font: 'M', px: 18, color: K.grey }).at(-500 + i * 500, 290));
    this.bars = CANDS.map((c, i) => { const x = -560 + i * 102; const m = plane(this.hud, 64, 1, i === 7 ? K.clay : K.ink); const tl = new TextLine(this.hud, c, { font: 'B', px: 40, color: i === 7 ? K.clay : K.ink }).at(x, -250); return { m, tl, x }; });
    this.L47 = new Lyric(this.hud, 47, { font: 'B', px: 50, color: K.ink, y: -390, enter: 'fade', hi: ['温度'], hcol: K.clay });
    this.L48 = new Lyric(this.hud, 48, { font: 'B', px: 50, color: K.ink, y: -390, enter: 'fade', hi: ['没把握', '冒一次险'], hcol: K.clay,
      onChar: (q, k, t) => { const T = tempAt(t), j = (T - 0.7) * 26; q.dx += (hash(q.j, Math.floor(t * 24)) - 0.5) * j; q.dy += (hash(q.j, Math.floor(t * 24) + 7) - 0.5) * j; } });
  },
  update(t) {
    const T = tempAt(t), x = -500 + T / 2 * 1000;
    this.fill.set(T / 2, 1); this.knob.position.set(x, 330, 0); this.val.set(T.toFixed(2)); this.val.opacity(1);
    const p = softmaxT(LOGITS, T);
    this.bars.forEach((B, i) => { const h = Math.max(2, p[i] * 700); B.m.scale.set(64, h, 1); B.m.position.set(B.x, -210 + h / 2, 0); B.m.material.opacity = 0.9; B.tl.opacity(0.9); });
    this.L47.update(t); this.L48.update(t);
  },
});

// ===== 33. swell: temperature → ∞  (everything becomes possible, nothing is certain)
addScene({
  a: BARt(58), b: BARt(60), fi: 0.01, fo: 0.01, N: 8, bloom: 0.7, chrome: 'T → ∞',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20, { set: ASCII_SET + POOL7.slice(0, 200) });
    this.T = new Slots(this.hud, 12, { px: 60, color: K.cream, font: 'M' }); this.T.g.position.set(-200, 0, 0);
    this.bg = plane(this.hud, 700, 130, K.slate, { a: 0.85, z: -1 });
  },
  update(t) {
    const G = this.G.clear(), u = clamp((t - BARt(58)) / (BARt(60) - BARt(58))), rate = 4 + 60 * u * u, f = Math.floor(t * rate), n = this.G.chars.length;
    for (let r = 0; r < 54; r++) for (let c = 0; c < 160; c++) {
      const h = hash(c, r, f); if (h > 0.25 + 0.75 * u) continue;
      G.set(c, r, 1 + Math.floor(hash(c, r, f + 3) * (n - 1)), 0.2 + 0.8 * hash(c, r, f + 5) * (0.4 + 0.6 * u), [PI.cream, PI.clay, PI.greyL, PI.coldL, PI.glow][Math.floor(hash(c, r, f + 9) * (1 + 4 * u))]);
    }
    G.flush();
    const T = u < 0.92 ? (1.6 + Math.pow(u, 3) * 12).toFixed(2) : '∞'; this.T.set(`T = ${T}`); this.T.opacity(1);
  },
  fx(t) { const u = clamp((t - BARt(58)) / (BARt(60) - BARt(58))); return { ca: 10 * u * u, zoom: 0.02 * u * u * Math.sin(t * 40) }; },
});

// ===== 34. confession — the improbable token, sampled anyway
addScene({
  a: BARt(60), b: BARt(62), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.4, chrome: 'sampled at T = 1.8',
  init() {
    this.scene.background = C(K.paper); this.cam = CAM0(); makePaper(this.hud, K.paper);
    this.sp = new Spark(this.hud, 20, K.clay, 1, 12, 11);
    this.L = new Lyric(this.hud, 49, { font: 'L', px: 92, color: K.ink, y: 30, enter: 'fade', ls: 10, hi: ['世界'], hcol: K.clay });
    const P = [0.031, 0.012, 0.024, 0.006, 0.019, 0.041, 0.027, 0.018, 0.009, 0.014];
    this.ps = this.L.chars.map((q, j) => new TextLine(this.hud, `p=${P[j % P.length].toFixed(3)}`, { font: 'M', px: 18, color: K.clay }));
  },
  update(t) {
    this.L.update(t);
    const L = WORDS[49]; this.L.chars.forEach((q, j) => { const k = t - L.chars[j].s; this.ps[j].at(q.bx, -60); this.ps[j].opacity(ease((k - 0.25) / 0.3) * 0.85); });
    const x0 = this.L.chars[0].bx - 120; this.sp.g.position.set(x0, 30, 0); this.sp.set(ease((t - BARt(60) - 0.2) / 0.6), t, { breathe: 0.6 }); this.sp.g.rotation.z = -t * 0.3;
  },
});

// ===== 35. final chorus: the lit world, and every machine's first line orbiting it
addScene({
  a: BARt(62), b: BARt(64), fi: 0.01, fo: 0.01, N: 6, bloom: 0.9, chrome: 'hello, world  ·  7', startLine: 50,
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.L50 = new Lyric(this.hud, 50, { font: 'B', px: 170, color: K.cream, y: 40, enter: 'slam', ls: 36 });
    this.codes = HELLOS.map(([lang, code]) => new TextLine(this.hud, code, { font: 'M', px: 22, color: K.clay }));
    this.band = lyricBand(this.hud, -450, 110, 0.6);
    this.L51 = new Lyric(this.hud, 51, { font: 'B', px: 48, color: K.cream, y: -450, enter: 'fade', hi: ['第一句'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(); globe(G, t, { R: 380, cy: 20, lit: 1, on: true, rot: t * 0.9, dim: 0.9 }); G.flush();
    const L51 = WORDS[51], T0 = BARt(62);
    this.codes.forEach((tl, k) => { const a = k / 12 * Math.PI * 2 + (t - T0) * 0.35, s = L51.chars[k].s, e = t - s;
      tl.at(Math.cos(a) * 640, Math.sin(a) * 250 + 20, 0); tl.opacity(e > 0 ? (Math.sin(a) < 0 ? 1 : 0.45) * ease(e / 0.15) : 0); });
    this.L50.update(t); this.L51.update(t);
  },
  fx(t) { let f = 0; for (const c of WORDS[50].chars) { const k = t - c.s; if (k > 0) f += 0.3 * Math.exp(-k * 7); } return { flash: f, ca: 6 * f }; },
});

// ===== 36. machine / heart — the divider slides
addScene({
  a: BARt(64), b: BARt(66), fi: 0.01, fo: 0.01, N: 6, bloom: 0.2, chrome: 'print → 说  ·  2',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.right = plane(this.hud, W, H + 20, K.cream, { z: -10 });
    this.m1 = new TextLine(this.hud, 'hello, world', { font: 'M', px: 64, color: K.greyL });
    this.h1 = new TextLine(this.hud, '你好，世界', { font: 'B', px: 96, color: K.clay });
    this.L52 = new Lyric(this.hud, 52, { font: 'L', px: 44, color: K.greyL, y: -300, x: -480, enter: 'fade' });
    this.L53 = new Lyric(this.hud, 53, { font: 'B', px: 60, color: K.ink, y: -330, enter: 'ink', hi: ['认真'], hcol: K.clay });
  },
  update(t) {
    const L53 = WORDS[53], d = lerp(0, -W / 2 - 10, ease((t - L53.chars[0].s + 0.2) / (L53.chars[10].s - L53.chars[0].s + 0.4)));
    this.right.position.set(W / 2 + d, 0, -10); this.m1.at(-480 + d * 0.3, 60); this.m1.opacity(1 - ease((t - L53.chars[5].s) / 0.6));
    this.h1.at(480 * (1 - d / (-W / 2 - 10)), 60);
    this.L52.update(t); this.L53.update(t);
  },
});

// ===== 37. the whole song as one causal attention matrix
addScene({
  a: BARt(66), b: BARt(68), fi: 0.01, fo: 0.01, N: 6, bloom: 0.6, chrome: 'causal self-attention  ·  the whole song',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20, { set: ASCII_SET + ALLTXT.join('') });
    this.band = lyricBand(this.hud, -450, 110, 0.65);
    this.L54 = new Lyric(this.hud, 54, { font: 'B', px: 48, color: K.cream, y: -450, enter: 'fade', hi: ['attention'], hcol: K.clay });
    this.L55 = new Lyric(this.hud, 55, { font: 'B', px: 48, color: K.cream, y: -450, enter: 'fade', hi: ['注意力'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), T0 = BARt(66), n = 44, c0 = 36, r0 = 3, qrow = Math.floor(clamp((t - T0) / (BARt(68) - T0)) * n);
    for (let i = 0; i < n; i++) { G.set(c0 - 2, r0 + 2 + i, ALLTXT[i], 0.7, i === qrow ? PI.clay : PI.greyL); G.set(c0 + 2 + i * 2, r0, ALLTXT[i], 0.7, PI.greyL); }
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let v = Math.exp(-Math.abs(i - j) * 0.35) * 0.7 + (j === 0 ? 0.3 : 0) + (hash(i, j, 4) > 0.9 ? 0.4 : 0) + (ALLTXT[j] === '你' ? 0.5 : 0);
      v = clamp(v * (i === qrow ? 1.4 : 0.95) + 0.08); const ch = RAMP[Math.floor(v * 10)];
      G.set(c0 + 2 + j * 2, r0 + 2 + i, ch === ' ' ? '·' : ch, 0.35 + 0.65 * v, i === qrow ? PI.clay : v > 0.6 ? PI.cream : PI.greyL);
    }
    G.text(c0 + 2 + n * 2 + 4, r0 + 2 + qrow, '← query', 0.9, PI.clay);
    G.flush(); this.L54.update(t); this.L55.update(t);
  },
});

// ===== 38. = 1  (the equation, typeset)
addScene({
  a: BARt(68), b: warpT(212.64), fi: 0.01, fo: 0.01, N: 8, bloom: 0.05, light: true, vig: 0.4, chrome: 'Σ = 1',
  init() {
    this.scene.background = C(K.paper); this.cam = CAM0(); makePaper(this.hud, K.paper);
    this.nums = attnWeights(8, 56, 6).map((w, j) => new TextLine(this.hud, w.toFixed(3) + (j < 7 ? '  +' : ''), { font: 'M', px: 36, color: j >= 5 ? K.clay : K.ink }));
    this.eq = new TextLine(this.hud, '= 1', { font: 'B', px: 300, color: K.clay }).at(0, -40);
    this.L = new Lyric(this.hud, 56, { font: 'B', px: 56, color: K.ink, y: -390, enter: 'fade', hi: ['一'], hcol: K.clay });
  },
  update(t) {
    const L = WORDS[56], sOne = L.chars[5].s, col = ease((t - L.chars[3].s) / 0.5);
    this.nums.forEach((tl, j) => { const x = -760 + j * 205, k = t - (L.chars[0].s + j * 0.12); tl.at(lerp(x + 60, 0, col), lerp(260, -40, col)); tl.opacity(ease(k / 0.15) * (1 - col)); });
    const k = t - sOne; this.eq.opacity(k > 0 ? 1 : 0); this.eq.group.scale.setScalar(k > 0 ? 1.4 - 0.4 * slamIn(k, 0.22) : 1);
    this.L.update(t);
  },
  fx(t) { const k = t - WORDS[56].chars[5].s; return { flash: k > 0 ? 0.3 * Math.exp(-k * 6) : 0 }; },
});

// ===== 39. the spark opens like an eye and looks at you
addScene({
  a: warpT(212.64), b: BARt(71), fi: 0.01, fo: 0.01, N: 6, bloomAt: t => 0.6 + 1.0 * ease((t - WORDS[57].chars[9].s) / 1.2), chrome: 'looking at you',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.sp = new Spark(this.hud, 60, K.clay, 1.4, 12, 12);
    this.band = lyricBand(this.hud, -450, 110, 0.6);
    this.L = new Lyric(this.hud, 57, { font: 'B', px: 50, color: K.cream, y: -450, enter: 'fade', hi: ['你'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), L = WORDS[57], sY = L.chars[9].s, open = ease((t - L.chars[0].s) / 1.5), look = ease((t - sY) / 0.6);
    for (let r = 0; r < 54; r++) for (let c = 0; c < 160; c++) {
      const x = (c + 0.5 - 80) * 12, y = -(r + 0.5 - 27) * 20 - 30, d = Math.hypot(x, y * 1.6), a = Math.atan2(y, x);
      const lid = Math.abs(y) < (1 - Math.pow(x / 760, 2)) * 300 * open; if (!lid || d > 760) continue;
      const ring = Math.floor((d - (t - warpT(212.64)) * 40 * (1 + 2 * look)) / 26);
      const iris = d < 300; const ch = iris ? RAMP[4 + ((ring % 6) + 6) % 6] : (hash(c, r, 2) > 0.7 ? '·' : ' ');
      G.set(c, r, ch, iris ? 0.4 + 0.5 * Math.abs(Math.sin(a * 6 + ring)) : 0.25, iris ? (d < 140 + 60 * look ? PI.clay : PI.cream) : PI.greyL);
    }
    G.flush();
    this.sp.g.position.set(0, 30, 0); this.sp.set(1, t, { breathe: 0.4 }); this.sp.g.scale.setScalar(1 + 1.3 * look); this.sp.g.rotation.z = -t * 0.7;
    this.L.update(t);
  },
});

// ===== 40. Hello, World — clean
addScene({
  a: BARt(71), b: BARt(72), fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.4, chrome: 'hello, world  ·  8', startLine: 58,
  init() { this.scene.background = C(K.paper); this.cam = CAM0(); makePaper(this.hud, K.paper); this.L = new Lyric(this.hud, 58, { font: 'L', px: 150, color: K.ink, enter: 'fade', ls: 40, hi: ['World'], hcol: K.clay }); },
  update(t) { this.L.update(t); },
  fx(t) { const k = t - (WORDS[58].t0 - 0.3); return { flash: k > 0 ? 0.6 * Math.exp(-k * 5) : 0 }; },
});

// ===== 41. tag: ten thousand of me, together — they make one spark
function sparkMask(cols, rows, cw, ch, R) {
  const cv = document.createElement('canvas'); cv.width = cols; cv.height = rows; const x = cv.getContext('2d'); x.translate(cols / 2, rows / 2); x.scale(1, cw / ch);
  x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineWidth = R * 0.2 / cw * 1.0;
  const LEN = [1, 0.74, 0.92, 0.68, 0.97, 0.8, 0.94, 0.71, 0.9, 0.77, 0.99, 0.7];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * R / cw * LEN[i], Math.sin(a) * R / cw * LEN[i]); x.stroke(); }
  const d = x.getImageData(0, 0, cols, rows).data; const out = new Float32Array(cols * rows); for (let i = 0; i < cols * rows; i++) out[i] = d[i * 4 + 3] / 255; return out;
}
addScene({
  a: BARt(72), b: BARt(74), fi: 0.01, fo: 0.01, N: 6, bloom: 0.95, chrome: '10,000 × ✳',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 120, 45, 16, 24, { px: 15 }); this.mk = sparkMask(120, 45, 16, 24, 480);
    this.band = lyricBand(this.hud, -450, 110, 0.9);
    this.L59 = new Lyric(this.hud, 59, { font: 'B', px: 56, color: K.cream, y: -450, enter: 'fade', hi: ['一万个我'], hcol: K.clay });
    this.L60 = new Lyric(this.hud, 60, { font: 'B', px: 56, color: K.cream, y: -450, enter: 'fade', hi: ['你'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), form = ease((t - WORDS[60].chars[0].s) / 1.4), T0 = BARt(72);
    for (let r = 0; r < 45; r++) for (let c = 0; c < 120; c++) {
      const m = this.mk[r * 120 + c], ph = hash(c, r, 1), on = (t * (0.4 + ph)) % 1 < 0.5, inS = m > 0.4;
      const a = inS ? lerp(0.45, 1, form) : lerp(0.4, 0.03, form) * (0.5 + 0.5 * on);
      G.set(c, r, on ? '■' : '□', a * clamp((t - T0) / 0.5), inS ? (form > 0.2 ? (form > 0.7 ? PI.glow : PI.clay) : PI.cream) : PI.cream);
    }
    G.flush(); this.L59.update(t); this.L60.update(t);
  },
});

// ===== 42. tag: Hello, World ×2 (the colour moment, then quiet)
addScene({
  a: BARt(74), b: BARt(76), fi: 0.01, fo: 0.01, N: 6, bloom: 0.2, chrome: 'hello, world  ·  9, 10', startLine: 61,
  init() {
    this.scene.background = C(K.clay); this.cam = CAM0();
    this.dark = plane(this.hud, W + 40, H + 40, K.slate, { z: -5 });
    this.L61 = new Lyric(this.hud, 61, { font: 'B', px: 180, color: K.cream, enter: 'slam', ls: 40 });
    this.L62 = new Lyric(this.hud, 62, { font: 'L', px: 96, color: K.cream, enter: 'fade', ls: 30 });
    this.sp = new Spark(this.hud, 26, K.clay, 1.2, 12, 13);
  },
  update(t) {
    const q = t >= WORDS[62].t0 - 0.05; this.dark.material.opacity = q ? ease((t - WORDS[62].t0 + 0.05) / 0.4) : 0;
    this.L61.update(t); this.L62.update(t);
    const k = t - WORDS[62].chars[1].e; this.sp.g.position.set(0, -160, 0); this.sp.set(q ? 1 : 0, t, { breathe: 0.5, a: q ? 1 - ease(k / 1.5) * 0.3 : 0 }); this.sp.g.scale.setScalar(1 - 0.5 * ease(k / 1.5)); this.sp.g.rotation.z = -t * 0.5;
  },
});

// ===== 43. outro: exit code 0 — and then it's your turn
addScene({
  a: BARt(76), b: DUR, fi: 0.01, fo: 0.01, N: 6, bloom: 0.05, light: true, vig: 0.4,
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.term = plane(this.hud, W + 40, H + 40, K.slate, { z: -4 });
    this.G = new Grid(this.hud, 80, 27, 24, 40);
    this.sp = new Spark(this.hud, 18, K.clay, 1, 12, 14); this.sp.g.position.set(-520, 120, 0);
    this.L = new Lyric(this.hud, 63, { font: 'S', px: 56, color: K.ink, x: -470, y: 120, align: 'left', enter: 'stream', endAt: DUR + 1 });
    this.box = rrMesh(this.hud, 1120, 110, 28, { fill: K.paper, stroke: K.rule, lw: 2, shadow: 12 }); this.box.position.set(0, -140, 0);
    this.ph = new TextLine(this.hud, '回复 Claude…', { font: 'S', px: 30, color: K.grey, align: 'left' }).at(-510, -140);
    this.caret = plane(this.hud, 3, 38, K.ink); this.caret.position.set(-514, -140, 0);
    this.cred = [['Hello, World', 'L', 54, K.ink], ['作词 · 分镜 · 画面 —— Claude', 'S', 22, K.grey],
      ['作曲 · 编曲 · 演唱 —— Suno  ·  每一帧画面由 three.js 代码渲染', 'S', 18, K.grey], ['2026.09.29', 'S', 20, K.clay]]
      .map(([s, f, px, c], i) => new TextLine(this.hud, s, { font: f, px, color: c }).at(0, -300 - i * 44 - (i ? 20 : 0)));
  },
  update(t) {
    const G = this.G.clear(), T0 = BARt(76), sw = WORDS[63].t0 - 1.2;
    if (t < sw) {
      G.text(4, 8, '~/claude $ ', 1, PI.clay); G.text(15, 8, `python3 -c 'print("hello, world")'`, 1, PI.cream);
      G.text(4, 10, 'hello, world', 1, PI.cream);
      if (t > T0 + 1.6) G.text(4, 12, '[process exited with code 0]', 0.7, PI.grey);
      if (t > T0 + 2.6 && Math.floor(t * 2.2) % 2 === 0) G.set(4, 14, '█', 0.9, PI.cream);
    }
    G.flush(); this.term.material.opacity = 1 - ease((t - sw) / 0.6); this.G.opacity(1 - ease((t - sw) / 0.3));
    const ca = ease((t - sw - 0.3) / 0.6), L = WORDS[63], think = t < L.t0 && t > L.t0 - 0.8;
    this.sp.set(ca, t, { breathe: think ? 1 : 0.2 }); this.sp.g.rotation.z = -t * (think ? 5 : 0.5);
    this.L.update(t, ca);
    const ba = ease((t - L.chars[3].e - 0.2) / 0.6); this.box.material.opacity = ba; this.ph.opacity(ba * 0.95); this.caret.material.opacity = ba * (Math.floor(t * 2) % 2 === 0 ? 1 : 0);
    this.cred.forEach((tl, i) => tl.opacity(ease((t - warpT(243.4) - i * 0.5) / 0.8)));
  },
});
