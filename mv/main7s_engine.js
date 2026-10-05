// Hello, World — three.js, deterministic per-frame renderer.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1920, H = 1080, FPS = 60, DUR = 242.2;

// ---------------------------------------------------------------- utils
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
const lerp = (a, b, u) => a + (b - a) * u;
function win(t, a, b, fi = 0.8, fo = 0.8) {
  if (t < a || t > b) return 0;
  return ease((t - a) / fi) * ease((b - t) / fo);
}
function rng(seed) {
  let s = seed >>> 0;
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

let ENV = null, LYR = [];
function envAt(key, t) { const a = ENV[key]; const i = clamp(Math.floor(t * FPS), 0, a.length - 1); return a[i]; }
function beatPulse(t, decay = 7) {
  // sharp pulse right after each beat
  const b = ENV.beats; let lo = 0, hi = b.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (b[m] <= t) lo = m; else hi = m - 1; }
  const d = t - b[lo]; return d >= 0 ? Math.exp(-d * decay) : 0;
}

// ---------------------------------------------------------------- text
const FONTS = { B: 'FB', L: 'FL', S: 'FS' };
const glyphCache = new Map();
const measureCtx = document.createElement('canvas').getContext('2d');
function glyph(ch, font, px) {
  const key = ch + '|' + font + '|' + px;
  let g = glyphCache.get(key);
  if (g) return g;
  const f = `${px}px ${FONTS[font]}`;
  measureCtx.font = f;
  const adv = measureCtx.measureText(ch).width;
  const pad = Math.ceil(px * 0.25);
  const cw = Math.max(2, Math.ceil(adv) + pad * 2), chh = Math.ceil(px * 1.5);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = chh;
  const ctx = cv.getContext('2d');
  ctx.font = f; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, pad, chh / 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  g = { tex, adv, cw, chh, pad };
  glyphCache.set(key, g);
  return g;
}
const planeGeo = new THREE.PlaneGeometry(1, 1);

// A line of text built from per-glyph quads (so every character can animate).
// Units: 1 unit = 1 "px" at the given resolution; scale the group for world use.
class TextLine {
  constructor(parent, str, { font = 'B', px = 48, color = '#fff', k = 1, align = 'center', ls = 0, res = 2 } = {}) {
    this.group = new THREE.Group(); parent.add(this.group);
    this.chars = []; this.str = str;
    const rp = Math.round(px * res);
    let x = 0; const items = [];
    for (const ch of [...str]) {
      const g = glyph(ch, font, rp);
      items.push({ ch, g, x }); x += g.adv / res + ls;
    }
    this.width = Math.max(0, x - ls);
    const x0 = align === 'center' ? -this.width / 2 : align === 'right' ? -this.width : 0;
    for (const it of items) {
      const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
        map: it.g.tex, transparent: true, depthWrite: false, toneMapped: false, color: C(color, k) }));
      m.scale.set(it.g.cw / res, it.g.chh / res, 1);
      const cx = x0 + it.x - it.g.pad / res + it.g.cw / res / 2;
      m.position.set(cx, 0, 0);
      m.userData = { baseX: cx, ch: it.ch, left: x0 + it.x, adv: it.g.adv / res };
      this.group.add(m); this.chars.push(m);
    }
    this.color = C(color, k);
  }
  opacity(a) { for (const m of this.chars) m.material.opacity = a; this.group.visible = a > 0.003; return this; }
  tint(c) { for (const m of this.chars) m.material.color.copy(c); return this; }
  at(x, y, z = 0) { this.group.position.set(x, y, z); return this; }
}

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NoToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const gl = renderer.getContext();

const hudCam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -100, 100);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H);
composer.renderToScreen = false;
const worldPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const hudPass = new RenderPass(new THREE.Scene(), hudCam); hudPass.clear = false; hudPass.clearDepth = true;
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.5, 0.9);
composer.addPass(worldPass); composer.addPass(hudPass); composer.addPass(bloom); composer.addPass(new OutputPass());

const accumRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, depthBuffer: false });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const accMat = new THREE.ShaderMaterial({
  uniforms: { tex: { value: null }, w: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(tex,vUv).rgb*w,1.); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
  depthTest: false, depthWrite: false,
});
const accScene = new THREE.Scene(); accScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat));
const finMat = new THREE.ShaderMaterial({
  uniforms: { tex: { value: accumRT.texture }, seed: { value: 0 }, fade: { value: 1 }, flash: { value: 0 }, ca: { value: 1 }, zoom: { value: 1 }, vig: { value: 1.3 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: `uniform sampler2D tex; uniform float seed; uniform float fade; uniform float flash; uniform float ca; uniform float zoom; uniform float vig; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
    void main(){
      vec2 uv0 = (vUv - 0.5) * zoom + 0.5;
      vec2 d = uv0 - 0.5; float r = dot(d,d);
      vec2 off = d * 0.0022 * r * 4.0 * ca;
      vec3 c = vec3(texture2D(tex, uv0 + off).r, texture2D(tex, uv0).g, texture2D(tex, uv0 - off).b);
      c += vec3(1.0, 0.86, 0.68) * flash * (1.0 - r * 1.2);
      c *= clamp(1.0 + 0.09 * vig - r * vig, 0.0, 1.0);
      float g = h(floor(vUv * vec2(960.0, 540.0))) - 0.5;
      c += g * 0.035;
      gl_FragColor = vec4(c * fade, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const finScene = new THREE.Scene(); finScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finMat));

// ---------------------------------------------------------------- shared world pieces
const SKY_VS = 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; }';
function makeSky(parent) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { top: { value: C('#05060f') }, hor: { value: C('#1a1424') }, dawn: { value: 0 }, sunDir: { value: new THREE.Vector3(0, -0.05, -1) }, glow: { value: 0 } },
    vertexShader: SKY_VS,
    fragmentShader: `uniform vec3 top, hor; uniform float dawn, glow; uniform vec3 sunDir; varying vec3 vDir;
      void main(){ vec3 d=normalize(vDir); float h=d.y;
        vec3 col = mix(hor, top, smoothstep(-0.02, 0.55, h));
        vec3 dt = mix(vec3(0.95,0.48,0.24), vec3(0.07,0.05,0.10), smoothstep(0.0,0.22,h));
        col = mix(col, dt, dawn*0.85);
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += dawn * (vec3(1.0,0.84,0.58)*smoothstep(0.99955,0.9998,s)*6.0 + vec3(1.0,0.55,0.25)*pow(s,60.0)*0.55 + vec3(1.0,0.5,0.25)*pow(s,8.0)*0.10);
        col += glow * vec3(0.9,0.55,0.25) * exp(-abs(h)*18.0) * 0.35;
        gl_FragColor = vec4(col, 1.0); }`,
    side: THREE.BackSide, depthWrite: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), mat);
  m.renderOrder = -10; parent.add(m); return m;
}
function makeStars(parent, n = 2600, seed = 1, radius = 1200) {
  const r = rng(seed); const pos = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, y = Math.abs(u) * 0.97 + 0.03;
    const s = Math.sqrt(1 - y * y);
    pos.set([Math.cos(th) * s * radius, y * radius, Math.sin(th) * s * radius], i * 3);
    sz[i] = 1.0 + Math.pow(r(), 6) * 5.0; ph[i] = r() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('sz', new THREE.BufferAttribute(sz, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, op: { value: 1 }, tint: { value: C('#b8c8ff') } },
    vertexShader: `attribute float sz; attribute float ph; uniform float time; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
        float tw = 0.55 + 0.45*sin(time*(0.7+fract(ph)*1.8)+ph); vA = tw; gl_PointSize = sz*(0.8+0.4*tw); }`,
    fragmentShader: `uniform float op; uniform vec3 tint; varying float vA;
      void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); float a = smoothstep(0.5,0.0,d);
        gl_FragColor = vec4(tint*1.3, a*vA*op); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p = new THREE.Points(g, mat); p.renderOrder = -9; parent.add(p); return p;
}
function makeGround(parent) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { camPos: { value: new THREE.Vector3() }, fogCol: { value: C('#1a1424') }, dawn: { value: 0 }, roadA: { value: 1 }, time: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform vec3 camPos, fogCol; uniform float dawn, roadA; varying vec3 vW;
      float band(float x, float c, float w){ float fw = fwidth(x); return 1.0 - smoothstep(w-fw, w+fw, abs(x-c)); }
      void main(){
        float x = vW.x, z = vW.z;
        vec3 col = vec3(0.012,0.012,0.02);
        float road = 1.0 - smoothstep(4.2, 4.35, abs(x));
        col = mix(col, vec3(0.03,0.03,0.042), road);
        float edge = band(abs(x), 3.9, 0.07);
        col += vec3(0.42,0.42,0.55) * edge * 0.55 * roadA;
        float dash = band(x, 0.0, 0.09) * step(fract(z/9.0), 0.45);
        col += vec3(1.0,0.66,0.3) * dash * 1.6 * roadA;
        float dist = length(vW.xz - camPos.xz);
        col += dawn * vec3(1.0,0.55,0.28) * 0.05 * exp(-abs(x)*0.03) * smoothstep(60.0, 900.0, dist);
        float f = 1.0 - exp(-dist*0.0035);
        col = mix(col, fogCol, f);
        gl_FragColor = vec4(col,1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), mat);
  m.rotation.x = -Math.PI / 2; parent.add(m); return m;
}
let _dot = null;
function dotTex() { if (_dot) return _dot; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); _dot = new THREE.CanvasTexture(c); return _dot; }
function makeReflectors(parent, seed = 3) {
  // glowing roadside markers every 18 units, repeated around camera
  const n = 90, pos = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) { pos.set([-4.9, 0.55, -i * 18], i * 6); pos.set([4.9, 0.55, -i * 18 - 9], i * 6 + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ size: 0.35, map: dotTex(), color: C('#ffb060', 2.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const p = new THREE.Points(g, mat); parent.add(p); return p;
}
function makeRoadWorld(scene, seed) {
  scene.background = new THREE.Color(0);
  const sky = makeSky(scene), stars = makeStars(scene, 2600, seed), ground = makeGround(scene), refl = makeReflectors(scene, seed);
  const cam = new THREE.PerspectiveCamera(52, W / H, 0.1, 4000);
  return { sky, stars, ground, refl, cam,
    place(z, t, { sway = 1, height = 1.7, look = 1.35, shake = 0, roll = 0 } = {}) {
      cam.position.set(Math.sin(t * 0.23) * 0.45 * sway, height + Math.sin(t * 1.3) * 0.03, z);
      cam.lookAt(Math.sin(t * 0.17) * 1.2 * sway, look, z - 60);
      if (shake) { cam.position.x += (Math.sin(t * 91.3) + Math.sin(t * 57.1)) * shake; cam.position.y += Math.sin(t * 73.7) * shake; }
      cam.rotation.z += roll;
      sky.position.copy(cam.position); stars.position.set(cam.position.x, 0, cam.position.z);
      ground.material.uniforms.camPos.value.copy(cam.position);
      stars.material.uniforms.time.value = t;
      refl.position.z = Math.ceil(z / 18) * 18;
    } };
}
// integrate a speed profile so position is exact for any t
function integrator(speedFn, t0, t1) {
  const dt = 1 / 240, n = Math.ceil((t1 - t0) / dt) + 2, tab = new Float64Array(n);
  let d = 0; for (let i = 1; i < n; i++) { d += speedFn(t0 + (i - 0.5) * dt) * dt; tab[i] = d; }
  return t => { const x = clamp((t - t0) / dt, 0, n - 1.001); const i = Math.floor(x), f = x - i; return tab[i] + (tab[i + 1] - tab[i]) * f; };
}

const SCENES = [];
function addScene(def) { def.scene = def.scene || new THREE.Scene(); def.hud = def.hud || new THREE.Scene(); SCENES.push(def); return def; }
// ---------------------------------------------------------------- helpers used above
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function ticketPath(x, w, h) { const r = 30, n = 34; x.beginPath(); x.moveTo(r, 0); x.lineTo(w - r, 0); x.arcTo(w, 0, w, r, r); x.lineTo(w, h - r); x.arcTo(w, h, w - r, h, r); x.lineTo(r, h); x.arcTo(0, h, 0, h - r, r); x.lineTo(0, r); x.arcTo(0, 0, r, 0, r); x.closePath();
  for (const cy of [0, h]) { x.moveTo(1040 + n, cy); x.arc(1040, cy, n, 0, Math.PI * 2); } }
function makeBokeh(parent, n, seed, xr, yr, zr, col, sizeK = 1) {
  const r = rng(seed), p = new Float32Array(n * 3), s = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { p.set([lerp(xr[0], xr[1], r()), lerp(yr[0], yr[1], r()), lerp(zr[0], zr[1], r())], i * 3); s[i] = (4 + r() * 18) * sizeK; ph[i] = r() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('sz', new THREE.BufferAttribute(s, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, tint: { value: C(col) } },
    vertexShader: `attribute float sz; attribute float ph; uniform float time; varying float vA;
      void main(){ vec3 q = position; q.y += mod(time*0.25*(0.3+fract(ph)) + ph, 20.0) - 10.0; q.x += sin(time*0.3+ph)*0.6;
        vec4 mv = modelViewMatrix*vec4(q,1.); gl_Position = projectionMatrix*mv; gl_PointSize = sz * 30.0 / -mv.z;
        vA = 0.35 + 0.65*(0.5+0.5*sin(time*0.8+ph*3.0)); }`,
    fragmentShader: `uniform vec3 tint; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.35,d)*0.55 + smoothstep(0.5,0.0,d)*0.35; gl_FragColor=vec4(tint*1.1, a*vA*0.5); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat); parent.add(pts); return pts;
}

