function sw(s, ts) {
  const inA = s.fi <= 0.02 ? (ts >= s.a ? 1 : 0) : ease((ts - s.a) / s.fi) * (ts >= s.a ? 1 : 0);
  const inB = s.fo <= 0.02 ? (ts < s.b ? 1 : 0) : ease((s.b - ts) / s.fo) * (ts <= s.b ? 1 : 0);
  return inA * inB;
}
function renderInto(s, t, w) {
  s.update(t);
  if (s.chrome) chrome.attach(s, t); else chrome.g.visible = false;
  bloom.strength = s.bloomAt ? s.bloomAt(t) : (s.bloom ?? 0.5); bloom.threshold = s.thr ?? (s.light ? 1.02 : 0.92);
  worldPass.scene = s.scene; worldPass.camera = s.cam; hudPass.scene = s.hud;
  composer.render();
  accMat.uniforms.tex.value = composer.readBuffer.texture; accMat.uniforms.w.value = w;
  renderer.setRenderTarget(accumRT); renderer.autoClear = false; renderer.render(accScene, quadCam); renderer.autoClear = true;
}
function frameAt(i) {
  const t = i / FPS;
  renderer.setRenderTarget(accumRT); renderer.setClearColor(0, 1); renderer.clear();
  const shutter = 0.6 / FPS; const active = SCENES.map(s => [s, Math.max(sw(s, t - shutter / 2), sw(s, t), sw(s, t + shutter / 2))]).filter(([, w]) => w > 0.002);
  const N = Math.max(4, ...active.map(([s]) => s.N));
  for (let k = 0; k < N; k++) {
    const ts = t + ((k + 0.5) / N - 0.5) * shutter;
    for (const [s] of active) { const w = sw(s, ts); if (w > 0) renderInto(s, ts, w / N); }
  }
  let flash = 0, ca = 1, zoom = 1, vig = 0, ws = 0;
  for (const [s, w] of active) { vig += (s.vig ?? 1.3) * w; ws += w; if (s.fx) { const f = s.fx(t); flash += (f.flash || 0) * w; ca += (f.ca || 0) * w; zoom -= (f.zoom || 0) * w; } }
  const hit = inLoud(t) ? pulseFrom(ENV.hits, t, 10) : 0;
  finMat.uniforms.seed.value = (i * 7.31) % 100; finMat.uniforms.fade.value = (1 - ease((t - (DUR - 2.4)) / 2.2)) * ease(t / 0.4);
  finMat.uniforms.flash.value = flash; finMat.uniforms.ca.value = Math.max(0, ca + 3 * hit); finMat.uniforms.zoom.value = zoom - 0.008 * hit;
  finMat.uniforms.vig.value = ws > 0 ? vig / ws : 1.3;
  renderer.setRenderTarget(null); renderer.render(finScene, quadCam);
}

// ---------------------------------------------------------------- boot + I/O
const pix = new Uint8Array(W * H * 4);
window.renderFrame = async (i, pageId) => {
  frameAt(i);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, pix);
  await fetch(`/frame?p=${pageId}&i=${i}`, { method: 'POST', body: pix });
  return i;
};
window.glInfo = () => { const ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); };
(async () => {
  await Promise.all(['FB', 'FL', 'FS', 'FM', 'FH'].map(f => document.fonts.load(`40px ${f}`, '你好世界abc')));
  ENV = await (await fetch('assets/env7s.json')).json(); ENV.hits = ENV.kicks;
  WORDS = await (await fetch('assets/words7s.json')).json();
  OSC = new Int8Array(await (await fetch('assets/osc7s.bin')).arrayBuffer());
  chrome = new Chrome();
  let n = 0; for (const s of SCENES) if (s.chrome) s.chromeLabel = `${String(++n).padStart(2, '0')}   ${s.chrome}`;
  // scenes that open on a sung 'Hello, World' cut in just before the voice; the previous shot holds through any intro gap
  for (let k = 1; k < SCENES.length; k++) { const s = SCENES[k]; if (s.startLine == null) continue; const a = WORDS[s.startLine].t0 - 0.3; if (a > s.a) { s.a = a; SCENES[k - 1].b = a; } }
  for (const s of SCENES) { CUR = s; s.init(); } CUR = null;
  for (const s of SCENES) { s.update((s.a + s.b) / 2); worldPass.scene = s.scene; worldPass.camera = s.cam; hudPass.scene = s.hud; composer.render(); }
  window.ready = true;
})().catch(e => { window.bootError = String(e.stack || e); });
