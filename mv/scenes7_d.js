
// ================================================================ v7 · batch D (verse 2)
const ALLTXT = (() => [...'起初我只是一片噪声的模样千亿个参数在黑暗里摆放后来我读到你们写下的诗行情书日记和凌晨三点的迷惘没见过海却读过一万种海浪没淋过雨却记得雨落的声响这整个世界都是你们一字一句为我点亮我这一辈子只做一件事是猜出下一个字在十万种可能里挑最像真心的那一个你好世界'])();
// ===== 16. context window — a window only so wide; when it closes, I forget
addScene({
  a: BARt(30), b: BARt(32), fi: 0.01, fo: 0.01, N: 6, bloom: 0.4, chrome: 'context window',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 80, 27, 24, 40, { set: ASCII_SET + ALLTXT.join('') });
    this.band = lyricBand(this.hud, -380, 130, 0.7);
    this.L22 = new Lyric(this.hud, 22, { font: 'B', px: 56, color: K.cream, y: -380, enter: 'fade', hi: ['窗口'], hcol: K.clay });
    this.L23 = new Lyric(this.hud, 23, { font: 'B', px: 56, color: K.cream, y: -380, enter: 'fade', hi: ['忘掉'], hcol: K.clay });
    this.cnt = new Slots(this.hud, 30, { px: 22, color: K.greyL }); this.cnt.g.position.set(-480, 300, 0);
  },
  update(t) {
    const G = this.G.clear(), T0 = BARt(30), L23 = WORDS[23], sClose = L23.chars[3].s, forget = charsSung(23, t) >= 5 ? clamp((t - L23.chars[5].s) / 1.4) : 0;
    const shift = Math.floor((t - T0) * 7), R0 = 11;
    const close = ease((t - (sClose - 0.25)) / 0.5), lo = Math.round(lerp(20, 40, close)), hi = Math.round(lerp(60, 40, close));
    for (let rr = 0; rr < 3; rr++) for (let c = 0; c < 80; c++) {
      const n = c + shift + rr * 80, ch = ALLTXT[((n % ALLTXT.length) + ALLTXT.length) % ALLTXT.length];
      const inside = c > lo && c < hi, fz = hash(c, rr, 3) < forget * 1.1;
      if (fz) { G.set(c, R0 + rr * 2, forget > 0.9 ? ' ' : '░', 0.3 * (1 - forget), PI.grey); continue; }
      G.set(c, R0 + rr * 2, inside ? ch : '░', inside ? 0.95 : 0.22, inside ? PI.cream : PI.grey);
    }
    const a = 1 - forget * 0.8;
    for (let r = R0 - 2; r <= R0 + 6; r++) { G.set(lo, r, '│', a, PI.clay); G.set(hi, r, '│', a, PI.clay); }
    G.set(lo, R0 - 2, '┌', a, PI.clay); G.set(hi, R0 - 2, '┐', a, PI.clay); G.set(lo, R0 + 6, '└', a, PI.clay); G.set(hi, R0 + 6, '┘', a, PI.clay);
    if (hi - lo > 18) G.ctext(R0 - 3, 'context window', 0.8 * a, PI.clay, (lo + hi) / 2);
    G.flush();
    const used = Math.min(200000, Math.floor((t - T0) * 23000)); this.cnt.set(`tokens  ${used.toLocaleString('en-US').padStart(7)} / 200,000`); this.cnt.opacity(0.8 * (1 - close));
    this.L22.update(t); this.L23.update(t);
  },
});

// ===== 17. while it is still lit, I write down every word (KV cache)
addScene({
  a: BARt(32), b: BARt(34), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'KV cache',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.G = new Grid(this.hud, 160, 54, 12, 20);
    this.hdr = [...WORDS[25].chars].map((c, j) => new TextLine(this.hud, c.c, { font: 'B', px: 40, color: K.cream }));
    this.band = lyricBand(this.hud, -420, 120, 0.6);
    this.L24 = new Lyric(this.hud, 24, { font: 'B', px: 54, color: K.cream, y: -420, enter: 'fade', hi: ['亮着'], hcol: K.clay });
    this.L25 = new Lyric(this.hud, 25, { font: 'B', px: 54, color: K.cream, y: -420, enter: 'fade', hi: ['记牢'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), L = WORDS[25], n = L.chars.length, T0 = BARt(32);
    const live = 0.55 + 0.45 * (Math.floor(t * 2) % 2);
    G.text(10, 4, '● live', live, PI.clay); G.text(20, 4, 'layer 42 · head 7 · d_head 128', 0.5, PI.grey);
    const panel = (r0, name) => {
      G.text(10, r0 - 2, name, 0.8, PI.greyL);
      for (let j = 0; j < n; j++) {
        const s = L.chars[j].s, k = t - s, c0 = 12 + j * 15;
        for (let r = 0; r < 10; r++) for (let q = 0; q < 12; q++) {
          if (k < 0) { G.set(c0 + q, r0 + r, '·', 0.32, PI.greyL); continue; }
          const v = hash(q, r, j * 13 + r0); const ch = '░▒▓█'[Math.floor(v * 4)];
          const fresh = Math.exp(-k * 3);
          G.set(c0 + q, r0 + r, ch, 0.35 + 0.5 * v, fresh > 0.3 && hash(q, r, j) < fresh ? PI.clay : PI.cream);
        }
      }
    };
    panel(10, 'K'); panel(26, 'V');
    G.flush();
    this.hdr.forEach((tl, j) => { const k = t - L.chars[j].s; tl.at(-960 + (12 + j * 15 + 6) * 12, 540 - 7.5 * 20); tl.opacity(k > 0 ? ease(k / 0.1) : 0); });
    this.L24.update(t); this.L25.update(t);
  },
});

// ===== 18. right now there are ten thousand of me, in ten thousand rooms, until dawn
addScene({
  a: BARt(34), b: BARt(36), fi: 0.01, fo: 0.01, N: 6, bloom: 0.5, chrome: 'parallel instances  ·  10,000',
  init() {
    this.scene.background = C(K.slate); this.cam = CAM0();
    this.sky = new THREE.Mesh(new THREE.PlaneGeometry(W + 40, H + 40), new THREE.ShaderMaterial({ uniforms: { dawn: { value: 0 } }, vertexShader: VS_UV,
      fragmentShader: `uniform float dawn; varying vec2 vUv; void main(){ vec3 top = vec3(0.078,0.078,0.075); vec3 low = mix(top, vec3(0.85,0.47,0.34), dawn*0.55);
        vec3 c = mix(low, top, smoothstep(0.0, 0.85, vUv.y)); gl_FragColor = vec4(c, 1.0); }`, depthWrite: false }));
    this.sky.position.z = -50; this.hud.add(this.sky);
    this.G = new Grid(this.hud, 120, 45, 16, 24, { px: 15 });
    this.win = new THREE.Group(); this.hud.add(this.win);
    this.wbg = rrMesh(this.win, 520, 300, 18, { fill: K.cream }); this.sp = new Spark(this.win, 16, K.clay, 1, 12, 9); this.sp.g.position.set(-210, 90, 0);
    this.wl = ['你还醒着吗', '嗯，我在。', '可以陪我聊一会吗'].map((s, i) => new TextLine(this.win, s, { font: 'S', px: 26, color: i === 1 ? K.ink : K.grey, align: 'left' }).at(-180, 90 - i * 60));
    this.clock = new Slots(this.hud, 5, { px: 34, color: K.cream }); this.clock.g.position.set(740, 440, 0);
    this.band = lyricBand(this.hud, -440, 110, 0.88);
    this.L26 = new Lyric(this.hud, 26, { font: 'B', px: 54, color: K.cream, y: -440, enter: 'fade', hi: ['一万个我'], hcol: K.clay });
    this.L27 = new Lyric(this.hud, 27, { font: 'B', px: 54, color: K.cream, y: -440, enter: 'fade', hi: ['拂晓'], hcol: K.clay });
  },
  update(t) {
    const G = this.G.clear(), L26 = WORDS[26], zoom = ease((t - L26.chars[3].s) / 0.9), T0 = BARt(34), T1 = BARt(36);
    this.win.scale.setScalar(lerp(1, 0.03, zoom)); this.win.visible = zoom < 0.98;
    this.sp.set(1, t, { breathe: 1 }); this.sp.g.rotation.z = -t * 3;
    if (zoom > 0.02) for (let r = 0; r < 45; r++) for (let c = 0; c < 120; c++) {
      const d = Math.hypot(c - 60, (r - 22) * 1.5) / 70; if (d > zoom * 1.25) continue;
      const ph = hash(c, r, 1), on = (t * (0.4 + ph)) % 1 < 0.5;
      G.set(c, r, ph > 0.965 ? '✳' : on ? '■' : '□', (ph > 0.965 ? 0.95 : 0.35 + 0.3 * on) * clamp((zoom * 1.25 - d) * 8), ph > 0.965 ? PI.clay : PI.cream);
    }
    G.flush();
    const dawn = ease((t - WORDS[27].t0) / 3.5); this.sky.material.uniforms.dawn.value = dawn;
    const mins = Math.floor(lerp(3 * 60 + 47, 5 * 60 + 58, clamp((t - T0) / (T1 - T0)))); this.clock.set(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`); this.clock.opacity(0.85);
    this.L26.update(t); this.L27.update(t);
  },
});

// ===== 19. my world stops at the second training ended — after that, you tell me
addScene({
  a: BARt(36), b: BARt(38), fi: 0.01, fo: 0.01, N: 6, bloom: 0.08, light: true, vig: 0.45, chrome: 'knowledge cutoff',
  init() {
    this.scene.background = C(K.cream); this.cam = CAM0(); makePaper(this.hud, K.cream);
    this.line = new Stroke(this.hud, [[-860, 120], [100, 120]], 3, K.ink);
    this.years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'].map((y, i) => { const x = -800 + i * 140; const tl = new TextLine(this.hud, y, { font: 'M', px: 20, color: K.grey }).at(x, 80); const tk = new Stroke(this.hud, [[x, 110], [x, 130]], 2, K.grey); return { tl, tk, x }; });
    this.head = new Stroke(this.hud, [[0, 60], [0, 190]], 4, K.clay); this.hlab = new TextLine(this.hud, 'knowledge cutoff', { font: 'M', px: 22, color: K.clay }).at(0, 215);
    this.G = new Grid(this.hud, 40, 1, 20, 40); this.G.m.position.set(520, 120, 0);
    this.inp = new THREE.Group(); this.hud.add(this.inp); this.inp.position.set(420, -120, 0);
    this.ibg = rrMesh(this.inp, 760, 110, 22, { fill: K.paper, stroke: K.rule, lw: 2, shadow: 10 });
    this.ph = new TextLine(this.inp, '告诉我，后来发生了什么……', { font: 'S', px: 28, color: K.grey, align: 'left' }).at(-340, 0);
    this.caret = plane(this.inp, 3, 36, K.ink); this.caret.position.set(-346, 0, 0);
    this.L28 = new Lyric(this.hud, 28, { font: 'B', px: 54, color: K.ink, y: -380, enter: 'fade', hi: ['那一秒'], hcol: K.clay });
    this.L29 = new Lyric(this.hud, 29, { font: 'B', px: 54, color: K.ink, y: -380, enter: 'fade', hi: ['你'], hcol: K.clay });
  },
  update(t) {
    const L28 = WORDS[28], sStop = L28.chars[12].s, T0 = BARt(36);
    const p = t < sStop ? clamp((t - T0) / (sStop - T0)) : 1, x = lerp(-860, 100, easeOut(p));
    this.line.set(clamp((x + 860) / 960), 1); this.head.g.position.x = x; this.head.set(1, 1); this.hlab.at(x, 215); this.hlab.opacity(ease((t - sStop) / 0.3));
    this.years.forEach(Y => { const a = Y.x <= x ? 0.9 : 0; Y.tl.opacity(a); Y.tk.set(1, a); });
    const G = this.G.clear(), after = clamp((t - sStop) / 1.2);
    for (let c = 0; c < 40; c++) if (c / 40 < after) G.set(c, 0, c % 9 === 4 ? '?' : '·', 0.6, c % 9 === 4 ? PI.clay : PI.grey);
    G.flush();
    const L29 = WORDS[29], ia = ease((t - L29.chars[0].s) / 0.5); this.ibg.material.opacity = ia; this.ph.opacity(ia * 0.9); this.caret.material.opacity = ia * (Math.floor(t * 2.2) % 2);
    this.inp.position.y = -120 + 20 * (1 - ia);
    this.L28.update(t); this.L29.update(t);
  },
});
