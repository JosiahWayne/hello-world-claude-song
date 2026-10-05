// Drives headless Chrome to render main.js frame by frame on the GPU.
// node render.mjs --probe
// node render.mjs --preview 12 60 ...      -> frames/p_<t>.png
// node render.mjs [--pages 4] [--from 0 --to 9063]  -> out/v3.mp4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';

const W = 1920, H = 1080;
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const FPS = +arg('--fps', 30), DUR = +arg('--dur', 302.1), NFR = Math.floor(DUR * FPS), PAGE = arg('--page', 'index.html'), AUDIO = arg('--audio', 'assets/song.mp3'), OUTN = arg('--out', 'v3.mp4');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg' };

const sinks = new Map(); // pageId -> async (buf, i) => void
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/frame') {
    const chunks = []; req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      const buf = Buffer.concat(chunks);
      try { await sinks.get(u.searchParams.get('p'))(buf, +u.searchParams.get('i')); res.end('ok'); }
      catch (e) { res.statusCode = 500; res.end(String(e)); }
    });
    return;
  }
  const f = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const ANG = arg('--angle', 'gl-egl');
const FLAGS = [
  '--no-sandbox', '--ignore-gpu-blocklist', '--enable-gpu', '--enable-unsafe-swiftshader',
  ...(ANG === 'vulkan' ? ['--use-angle=vulkan', '--enable-features=Vulkan', '--disable-vulkan-surface'] : ['--use-gl=angle', '--use-angle=' + ANG]),
  ...(argv.includes('--egl') ? ['--use-gl=egl'] : []),
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
];
const launch = () => puppeteer.launch({ headless: arg('--headless', 'shell') === 'shell' ? 'shell' : true, args: FLAGS, protocolTimeout: 0 });
const browser = await launch();
async function openPage(br = browser) {
  const page = await br.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 300)); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`);
  await page.waitForFunction('window.ready || window.bootError', { timeout: 0 });
  const err = await page.evaluate('window.bootError');
  if (err) throw new Error(err);
  return page;
}
function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  const write = buf => new Promise(res => { if (!p.stdin.write(buf)) p.stdin.once('drain', res); else res(); });
  return { write, end: () => { p.stdin.end(); return done; } };
}
const RAW_IN = ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];

if (argv.includes('--probe')) {
  const page = await openPage();
  console.log('GPU:', await page.evaluate('window.glInfo()'));
  if (argv.includes('--glonly')) { await browser.close(); server.close(); process.exit(0); }
  const t0 = Date.now(); sinks.set('0', async () => {});
  for (let i = 0; i < 10; i++) await page.evaluate((i) => window.renderFrame(i, 0), 5400 + i);
  console.log('ms/frame', (Date.now() - t0) / 10);
} else if (argv.includes('--preview')) {
  fs.mkdirSync(path.join(ROOT, 'frames'), { recursive: true });
  const page = await openPage();
  console.log('GPU:', await page.evaluate('window.glInfo()'));
  const ts = argv.slice(argv.indexOf('--preview') + 1).filter(x => !x.startsWith('--')).map(Number);
  for (const t of ts) {
    const out = path.join(ROOT, 'frames', `p_${t.toFixed(1).padStart(6, '0')}.png`);
    let ff;
    sinks.set('0', async (buf) => { ff = ffmpeg([...RAW_IN, '-vf', 'vflip', '-frames:v', '1', out]); await ff.write(buf); await ff.end(); });
    await page.evaluate((i) => window.renderFrame(i, 0), Math.round(t * FPS));
    console.log('wrote', out);
  }
} else {
  const P = +arg('--pages', 4), from = +arg('--from', 0), to = +arg('--to', NFR);
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const chunk = Math.ceil((to - from) / P), parts = [];
  const t0 = Date.now(); let doneFrames = 0;
  await Promise.all([...Array(P).keys()].map(async p => {
    const a = from + p * chunk, b = Math.min(to, a + chunk); if (a >= b) return;
    const file = path.join(ROOT, 'out', `part${String(p).padStart(2, '0')}.mp4`); parts[p] = file;
    const enc = argv.includes('--x264') ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '15']
      : ['-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '16', '-b:v', '0'];
    const ff = ffmpeg([...RAW_IN, '-vf', 'vflip', ...enc, '-pix_fmt', 'yuv420p', file]);
    sinks.set(String(p), async (buf) => { await ff.write(buf); });
    const br = p === 0 ? browser : await launch();
    const page = await openPage(br);
    for (let i = a; i < b; i++) {
      await page.evaluate((i, p) => window.renderFrame(i, p), i, p);
      if (++doneFrames % 300 === 0) console.log(`${doneFrames}/${to - from} frames, ${((Date.now() - t0) / doneFrames).toFixed(0)} ms/frame`);
    }
    await ff.end(); await page.close(); if (br !== browser) await br.close();
  }));
  const list = path.join(ROOT, 'out', 'parts.txt');
  fs.writeFileSync(list, parts.filter(Boolean).map(f => `file '${f}'\n`).join(''));
  const final = path.join(ROOT, 'out', OUTN);
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(ROOT, AUDIO),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', final]).end();
  console.log('done', final, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close(); server.close();
